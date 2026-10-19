
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';

import {
    consultarReporteAsistencia,
    listarDependencias,
    listarFuncionarios,
} from '../services/api';

import * as FileSystem from 'expo-file-system/legacy';

import * as Print from 'expo-print';

function obtenerFechaLocal() {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Asuncion',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const valores = {};

    partes.forEach((parte) => {
        if (parte.type !== 'literal') {
            valores[parte.type] = parte.value;
        }
    });

    return `${valores.year}-${valores.month}-${valores.day}`;
}

function desplazarFecha(fecha, dias) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaCalculada = new Date(Date.UTC(anio, mes - 1, dia + dias));

    return [
        fechaCalculada.getUTCFullYear(),
        String(fechaCalculada.getUTCMonth() + 1).padStart(2, '0'),
        String(fechaCalculada.getUTCDate()).padStart(2, '0'),
    ].join('-');
}

function formatearFecha(fechaHora) {
    if (!fechaHora) return '-';

    const fecha = new Date(fechaHora);

    return new Intl.DateTimeFormat('es-PY', {
        timeZone: 'America/Asuncion',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(fecha);
}

function formatearHora(fechaHora) {
    if (!fechaHora) return '-';

    const fecha = new Date(fechaHora);

    return new Intl.DateTimeFormat('es-PY', {
        timeZone: 'America/Asuncion',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(fecha);
}


function escaparCSV(valor) {
    const texto = String(valor ?? '');
    return `"${texto.replace(/"/g, '""')}"`;
}

function generarContenidoCSV(resultados, desde, hasta) {
    const filas = [];

    // Identificación del reporte.
    filas.push([
        escaparCSV('REPORTE DE ASISTENCIA'),
        escaparCSV('Desde'),
        escaparCSV(desde),
        escaparCSV('Hasta'),
        escaparCSV(hasta),
    ].join(';'));

    filas.push('');

    // Encabezados.
    filas.push([
        'Cedula',
        'Apellido',
        'Nombre',
        'Dependencia',
        'Fecha',
        'Hora',
        'Tipo de marcacion',
        'Origen',
        'Observacion',
    ].map(escaparCSV).join(';'));

    resultados.forEach((funcionario) => {
        if (!funcionario.marcaciones ||
            funcionario.marcaciones.length === 0) {
            filas.push([
                funcionario.cedula,
                funcionario.apellido,
                funcionario.nombre,
                funcionario.dependenciaNombre,
                '',
                '',
                '',
                '',
                'Sin marcaciones en el periodo',
            ].map(escaparCSV).join(';'));

            return;
        }

        funcionario.marcaciones.forEach((marcacion) => {
            filas.push([
                funcionario.cedula,
                funcionario.apellido,
                funcionario.nombre,
                funcionario.dependenciaNombre,
                formatearFecha(marcacion.fechaHora),
                formatearHora(marcacion.fechaHora),
                marcacion.tipo,
                marcacion.origen,
                '',
            ].map(escaparCSV).join(';'));
        });
    });

    // BOM para facilitar la lectura de tildes y ñ en Excel.
    return '\uFEFF' + filas.join('\r\n');
}



function escaparHTML(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generarHTMLReporte({
    resultados,
    desde,
    hasta,
    dependenciaNombre,
    funcionarioNombre,
    totalEntradas,
    totalSalidas,
    totalMarcaciones,
    sinMarcaciones,
}) {
    const filas = resultados.map((funcionario) => {
        const nombre = `${funcionario.apellido}, ${funcionario.nombre}`;

        if (
            !funcionario.marcaciones ||
            funcionario.marcaciones.length === 0
        ) {
            return `
        <tr>
          <td>${escaparHTML(funcionario.cedula)}</td>
          <td>${escaparHTML(nombre)}</td>
          <td>${escaparHTML(funcionario.dependenciaNombre)}</td>
          <td colspan="4" class="sin-registros">
            Sin marcaciones en el período
          </td>
        </tr>
      `;
        }

        return funcionario.marcaciones.map((marcacion) => `
      <tr>
        <td>${escaparHTML(funcionario.cedula)}</td>
        <td>${escaparHTML(nombre)}</td>
        <td>${escaparHTML(funcionario.dependenciaNombre)}</td>
        <td>${escaparHTML(formatearFecha(marcacion.fechaHora))}</td>
        <td>${escaparHTML(formatearHora(marcacion.fechaHora))}</td>
        <td>${escaparHTML(marcacion.tipo)}</td>
        <td>${escaparHTML(marcacion.origen)}</td>
      </tr>
    `).join('');
    }).join('');

    const fechaGeneracion = formatearFecha(
        `${obtenerFechaLocal()}T12:00:00`
    );

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <style>
        @page {
          size: A4 landscape;
          margin: 14mm 10mm;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #1e293b;
          font-size: 10px;
        }

        .encabezado {
          border-bottom: 3px solid #17365D;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .institucion {
          color: #17365D;
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 5px;
        }

        h2 {
          font-size: 15px;
          margin: 8px 0;
        }

        .metadatos {
          margin: 5px 0;
          color: #475569;
          font-size: 10px;
        }

        .resumen {
          display: flex;
          gap: 8px;
          margin: 15px 0;
        }

        .indicador {
          flex: 1;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 9px;
          text-align: center;
        }

        .numero {
          display: block;
          color: #17365D;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .etiqueta {
          color: #475569;
          font-size: 9px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        thead {
          display: table-header-group;
        }

        th {
          background: #17365D;
          color: #ffffff;
          text-align: left;
          padding: 8px 5px;
          font-size: 9px;
        }

        td {
          border: 1px solid #cbd5e1;
          padding: 6px 5px;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        tr {
          page-break-inside: avoid;
        }

        tbody tr:nth-child(even) {
          background: #f1f5f9;
        }

        .sin-registros {
          color: #92400e;
          font-weight: bold;
        }

        .pie {
          margin-top: 18px;
          padding-top: 8px;
          border-top: 1px solid #cbd5e1;
          color: #64748b;
          font-size: 9px;
        }
      </style>
    </head>

    <body>
      <header class="encabezado">
        <p class="institucion">CONTROL DE ASISTENCIA</p>
        <h2>Reporte de asistencia de funcionarios</h2>

        <p class="metadatos">
          <strong>Período:</strong>
          ${escaparHTML(desde)} al ${escaparHTML(hasta)}
        </p>

        <p class="metadatos">
          <strong>Dependencia:</strong>
          ${escaparHTML(dependenciaNombre)}
        </p>

        <p class="metadatos">
          <strong>Funcionario:</strong>
          ${escaparHTML(funcionarioNombre)}
        </p>
      </header>

      <section class="resumen">
        <div class="indicador">
          <span class="numero">${resultados.length}</span>
          <span class="etiqueta">Funcionarios</span>
        </div>

        <div class="indicador">
          <span class="numero">${totalEntradas}</span>
          <span class="etiqueta">Entradas</span>
        </div>

        <div class="indicador">
          <span class="numero">${totalSalidas}</span>
          <span class="etiqueta">Salidas</span>
        </div>

        <div class="indicador">
          <span class="numero">${totalMarcaciones}</span>
          <span class="etiqueta">Total marcaciones</span>
        </div>

        <div class="indicador">
          <span class="numero">${sinMarcaciones}</span>
          <span class="etiqueta">Sin registros</span>
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Funcionario</th>
            <th>Dependencia</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Origen</th>
          </tr>
        </thead>

        <tbody>
          ${filas || `
            <tr>
              <td colspan="7">No hay funcionarios para los filtros seleccionados.</td>
            </tr>
          `}
        </tbody>
      </table>

      <footer class="pie">
        Reporte generado el ${escaparHTML(fechaGeneracion)}.
        Documento generado por el sistema de Control de Asistencia.
      </footer>
    </body>
    </html>
  `;
}


function SelectorSimple({
    titulo,
    opciones,
    valor,
    onChange,
    textoTodos,
}) {
    return (
        <View style={styles.grupo}>
            <Text style={styles.label}>{titulo}</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.opciones}
            >
                <Pressable
                    style={[
                        styles.opcion,
                        valor === null && styles.opcionSeleccionada,
                    ]}
                    onPress={() => onChange(null)}
                >
                    <Text
                        style={[
                            styles.textoOpcion,
                            valor === null && styles.textoOpcionSeleccionada,
                        ]}
                    >
                        {textoTodos}
                    </Text>
                </Pressable>

                {opciones.map((opcion) => {
                    const seleccionado =
                        String(valor) === String(opcion.id);

                    return (
                        <Pressable
                            key={opcion.id}
                            style={[
                                styles.opcion,
                                seleccionado && styles.opcionSeleccionada,
                            ]}
                            onPress={() => onChange(opcion.id)}
                        >
                            <Text
                                style={[
                                    styles.textoOpcion,
                                    seleccionado && styles.textoOpcionSeleccionada,
                                ]}
                            >
                                {opcion.nombre}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export default function ReporteAsistenciaScreen() {
    const fechaHoy = obtenerFechaLocal();

    //ANTES DE LOS USESTATE


    const exportarCSV = async () => {
        if (!consultado) {
            Alert.alert(
                'Reporte no consultado',
                'Primero consultá el reporte antes de exportarlo.'
            );
            return;
        }

        if (resultados.length === 0) {
            Alert.alert(
                'Sin resultados',
                'No hay datos para exportar con los filtros seleccionados.'
            );
            return;
        }

        setExportandoCSV(true);

        try {
            const disponible = await Sharing.isAvailableAsync();

            if (!disponible) {
                Alert.alert(
                    'No disponible',
                    'La opción de compartir archivos no está disponible en este dispositivo.'
                );
                return;
            }

            const contenido = generarContenidoCSV(resultados, desde, hasta);
            const nombreArchivo = `reporte_asistencia_${desde}_${hasta}.csv`;
            const directorio = FileSystem.cacheDirectory;

            if (!directorio) {
                throw new Error('No se encontró un directorio para guardar el archivo.');
            }

            const rutaArchivo = `${directorio}${nombreArchivo}`;

            await FileSystem.writeAsStringAsync(rutaArchivo, contenido, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            await Sharing.shareAsync(rutaArchivo, {
                mimeType: 'text/csv',
                dialogTitle: 'Compartir reporte de asistencia',
                UTI: 'public.comma-separated-values-text',
            });
        } catch (e) {
            Alert.alert(
                'Error al exportar',
                e.message || 'No se pudo generar o compartir el archivo CSV.'
            );
        } finally {
            setExportandoCSV(false);
        }
    };


    //ANTES DE LOS USESTATE


    //FUNCION PDF
    const exportarPDF = async () => {
        if (!consultado) {
            Alert.alert(
                'Reporte no consultado',
                'Primero consultá el reporte antes de exportarlo.'
            );
            return;
        }

        if (resultados.length === 0) {
            Alert.alert(
                'Sin resultados',
                'No hay datos para exportar con los filtros seleccionados.'
            );
            return;
        }

        setExportandoPDF(true);

        try {
            const disponible = await Sharing.isAvailableAsync();

            if (!disponible) {
                Alert.alert(
                    'No disponible',
                    'La opción de compartir archivos no está disponible en este dispositivo.'
                );
                return;
            }

            const dependenciaSeleccionada = dependencias.find(
                (dependencia) =>
                    String(dependencia.id) === String(dependenciaId)
            );

            const funcionarioSeleccionado = funcionarios.find(
                (funcionario) =>
                    String(funcionario.id) === String(funcionarioId)
            );

            const dependenciaNombre = dependenciaSeleccionada
                ? dependenciaSeleccionada.nombre
                : 'Todas';

            const funcionarioNombre = funcionarioSeleccionado
                ? `${funcionarioSeleccionado.apellido}, ${funcionarioSeleccionado.nombre}`
                : 'Todos';

            const html = generarHTMLReporte({
                resultados,
                desde,
                hasta,
                dependenciaNombre,
                funcionarioNombre,
                totalEntradas,
                totalSalidas,
                totalMarcaciones,
                sinMarcaciones,
            });

            const resultadoPDF = await Print.printToFileAsync({
                html,
                width: 842,
                height: 595,
            });

            if (!resultadoPDF?.uri) {
                throw new Error(
                    'No se pudo obtener el archivo PDF generado.'
                );
            }

            await Sharing.shareAsync(resultadoPDF.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Compartir reporte de asistencia',
                UTI: 'com.adobe.pdf',
            });
        } catch (e) {
            Alert.alert(
                'Error al exportar PDF',
                e.message || 'No se pudo generar o compartir el PDF.'
            );
        } finally {
            setExportandoPDF(false);
        }
    };
    //FUNCION PDF

    const [exportandoCSV, setExportandoCSV] = useState(false);

    const [exportandoPDF, setExportandoPDF] = useState(false);

    const [desde, setDesde] = useState(
        `${fechaHoy.slice(0, 8)}01`
    );
    const [hasta, setHasta] = useState(fechaHoy);

    const [dependencias, setDependencias] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);

    const [dependenciaId, setDependenciaId] = useState(null);
    const [funcionarioId, setFuncionarioId] = useState(null);

    const [resultados, setResultados] = useState([]);
    const [consultado, setConsultado] = useState(false);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [consultando, setConsultando] = useState(false);
    const [error, setError] = useState('');

    const cargarCatalogos = useCallback(async () => {
        setCargandoCatalogos(true);

        try {
            const [listaDependencias, listaFuncionarios] =
                await Promise.all([
                    listarDependencias(),
                    listarFuncionarios(true),
                ]);

            setDependencias(listaDependencias);
            setFuncionarios(listaFuncionarios);
        } catch (e) {
            setError(
                e.message || 'No se pudieron cargar los filtros del reporte.'
            );
        } finally {
            setCargandoCatalogos(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarCatalogos();
        }, [cargarCatalogos])
    );

    useEffect(() => {
        if (dependenciaId === null) return;

        const funcionarioSeleccionado = funcionarios.find(
            (funcionario) =>
                String(funcionario.id) === String(funcionarioId)
        );

        if (
            funcionarioSeleccionado &&
            String(funcionarioSeleccionado.dependenciaId) !==
            String(dependenciaId)
        ) {
            setFuncionarioId(null);
        }
    }, [dependenciaId, funcionarioId, funcionarios]);

    const funcionariosFiltrados =
        dependenciaId === null
            ? funcionarios
            : funcionarios.filter(
                (funcionario) =>
                    String(funcionario.dependenciaId) ===
                    String(dependenciaId)
            );

    const consultar = async () => {
        setError('');

        if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
            setError('La fecha inicial debe tener el formato AAAA-MM-DD.');
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
            setError('La fecha final debe tener el formato AAAA-MM-DD.');
            return;
        }

        const inicio = new Date(`${desde}T00:00:00Z`);
        const fin = new Date(`${hasta}T00:00:00Z`);

        if (
            Number.isNaN(inicio.getTime()) ||
            Number.isNaN(fin.getTime()) ||
            inicio.toISOString().slice(0, 10) !== desde ||
            fin.toISOString().slice(0, 10) !== hasta
        ) {
            setError('Ingresá fechas válidas.');
            return;
        }

        if (desde > hasta) {
            setError(
                'La fecha inicial no puede ser posterior a la fecha final.'
            );
            return;
        }

        setConsultando(true);

        try {
            const datos = await consultarReporteAsistencia(
                desde,
                hasta,
                dependenciaId,
                funcionarioId
            );

            setResultados(datos);
            setConsultado(true);
        } catch (e) {
            setResultados([]);
            setConsultado(false);
            setError(e.message || 'No se pudo consultar el reporte.');
        } finally {
            setConsultando(false);
        }
    };

    const totalEntradas = resultados.reduce(
        (total, funcionario) =>
            total +
            funcionario.marcaciones.filter(
                (marcacion) => marcacion.tipo === 'ENTRADA'
            ).length,
        0
    );

    const totalSalidas = resultados.reduce(
        (total, funcionario) =>
            total +
            funcionario.marcaciones.filter(
                (marcacion) => marcacion.tipo === 'SALIDA'
            ).length,
        0
    );

    const totalMarcaciones = resultados.reduce(
        (total, funcionario) =>
            total + funcionario.marcaciones.length,
        0
    );

    const sinMarcaciones = resultados.filter(
        (funcionario) => funcionario.marcaciones.length === 0
    ).length;

    const renderFuncionario = ({ item }) => (
        <View style={styles.tarjeta}>
            <Text style={styles.nombreFuncionario}>
                {item.apellido}, {item.nombre}
            </Text>

            <Text style={styles.dato}>
                Cédula: {item.cedula}
            </Text>

            <Text style={styles.dato}>
                Dependencia: {item.dependenciaNombre}
            </Text>

            {item.marcaciones.length === 0 ? (
                <Text style={styles.sinMarcaciones}>
                    Sin marcaciones en el período
                </Text>
            ) : (
                item.marcaciones.map((marcacion) => (
                    <View
                        key={marcacion.id}
                        style={styles.filaMarcacion}
                    >
                        <View style={styles.datosMarcacion}>
                            <Text style={styles.tipoMarcacion}>
                                {marcacion.tipo}
                            </Text>

                            <Text style={styles.dato}>
                                {formatearFecha(marcacion.fechaHora)}
                                {' · '}
                                {formatearHora(marcacion.fechaHora)}
                            </Text>
                        </View>

                        <Text style={styles.origen}>
                            {marcacion.origen}
                        </Text>
                    </View>
                ))
            )}
        </View>
    );

    if (cargandoCatalogos) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#17365D" />
                <Text style={styles.textoCarga}>
                    Cargando filtros del reporte...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.contenedor}>
            <FlatList
                data={consultado ? resultados : []}
                keyExtractor={(item) => String(item.funcionarioId)}
                renderItem={renderFuncionario}
                contentContainerStyle={styles.lista}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.titulo}>
                            Reporte de asistencia
                        </Text>

                        <Text style={styles.descripcion}>
                            Consultá las marcaciones por período, dependencia
                            y funcionario.
                        </Text>

                        <View style={styles.panelFiltros}>
                            <Text style={styles.subtitulo}>
                                Período de consulta
                            </Text>

                            <Text style={styles.label}>
                                Fecha desde (AAAA-MM-DD)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={desde}
                                onChangeText={setDesde}
                                placeholder="2026-10-01"
                                keyboardType="numbers-and-punctuation"
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>
                                Fecha hasta (AAAA-MM-DD)
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={hasta}
                                onChangeText={setHasta}
                                placeholder="2026-10-19"
                                keyboardType="numbers-and-punctuation"
                                autoCapitalize="none"
                            />

                            <View style={styles.botonesRapidos}>
                                <Pressable
                                    style={styles.botonSecundario}
                                    onPress={() => {
                                        setDesde(`${fechaHoy.slice(0, 8)}01`);
                                        setHasta(fechaHoy);
                                    }}
                                >
                                    <Text style={styles.textoBotonSecundario}>
                                        Este mes
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.botonSecundario}
                                    onPress={() => {
                                        setDesde(fechaHoy);
                                        setHasta(fechaHoy);
                                    }}
                                >
                                    <Text style={styles.textoBotonSecundario}>
                                        Hoy
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.botonSecundario}
                                    onPress={() => {
                                        setDesde(desplazarFecha(fechaHoy, -6));
                                        setHasta(fechaHoy);
                                    }}
                                >
                                    <Text style={styles.textoBotonSecundario}>
                                        Últimos 7 días
                                    </Text>
                                </Pressable>
                            </View>

                            <SelectorSimple
                                titulo="Dependencia"
                                opciones={dependencias.map((dependencia) => ({
                                    id: dependencia.id,
                                    nombre: dependencia.nombre,
                                }))}
                                valor={dependenciaId}
                                onChange={setDependenciaId}
                                textoTodos="Todas"
                            />

                            <SelectorSimple
                                titulo="Funcionario"
                                opciones={funcionariosFiltrados.map((funcionario) => ({
                                    id: funcionario.id,
                                    nombre: `${funcionario.apellido}, ${funcionario.nombre}`,
                                }))}
                                valor={funcionarioId}
                                onChange={setFuncionarioId}
                                textoTodos="Todos"
                            />

                            <Pressable
                                style={[
                                    styles.botonConsultar,
                                    consultando && styles.botonDeshabilitado,
                                ]}
                                onPress={consultar}
                                disabled={consultando}
                            >
                                {consultando ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.textoBotonConsultar}>
                                        Consultar reporte
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {error ? (
                            <View style={styles.panelError}>
                                <Text style={styles.textoError}>{error}</Text>
                                <Pressable onPress={cargarCatalogos}>
                                    <Text style={styles.textoReintentar}>
                                        Recargar filtros
                                    </Text>
                                </Pressable>
                            </View>
                        ) : null}

                        {consultado && (
                            <View>
                                <Text style={styles.subtituloResultados}>
                                    Resultados del período
                                </Text>

                                <View style={styles.resumen}>
                                    <View style={styles.tarjetaResumen}>
                                        <Text style={styles.numeroResumen}>
                                            {resultados.length}
                                        </Text>
                                        <Text style={styles.etiquetaResumen}>
                                            Funcionarios
                                        </Text>
                                    </View>

                                    <View style={styles.tarjetaResumen}>
                                        <Text style={styles.numeroResumen}>
                                            {totalEntradas}
                                        </Text>
                                        <Text style={styles.etiquetaResumen}>
                                            Entradas
                                        </Text>
                                    </View>

                                    <View style={styles.tarjetaResumen}>
                                        <Text style={styles.numeroResumen}>
                                            {totalSalidas}
                                        </Text>
                                        <Text style={styles.etiquetaResumen}>
                                            Salidas
                                        </Text>
                                    </View>

                                    <View style={styles.tarjetaResumen}>
                                        <Text style={styles.numeroResumen}>
                                            {sinMarcaciones}
                                        </Text>
                                        <Text style={styles.etiquetaResumen}>
                                            Sin registros
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.totalTexto}>
                                    Total de marcaciones: {totalMarcaciones}
                                </Text>


                                <Pressable
                                    style={[
                                        styles.botonExportar,
                                        exportandoCSV && styles.botonDeshabilitado,
                                    ]}
                                    onPress={exportarCSV}
                                    disabled={exportandoCSV}
                                >
                                    {exportandoCSV ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.textoBotonExportar}>
                                            📄 Exportar reporte a CSV
                                        </Text>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.botonExportarPDF,
                                        exportandoPDF && styles.botonDeshabilitado,
                                    ]}
                                    onPress={exportarPDF}
                                    disabled={exportandoPDF}
                                >
                                    {exportandoPDF ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.textoBotonExportar}>
                                            📑 Exportar reporte a PDF
                                        </Text>
                                    )}
                                </Pressable>


                                {resultados.length === 0 && (
                                    <Text style={styles.sinResultados}>
                                        No hay funcionarios que coincidan con los filtros.
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    consultado && resultados.length === 0 ? null : !consultado ? (
                        <Text style={styles.instruccion}>
                            Seleccioná los filtros y pulsá “Consultar reporte”.
                        </Text>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#F3F6FA',
    },
    lista: {
        padding: 16,
        paddingBottom: 32,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F6FA',
    },
    textoCarga: {
        marginTop: 12,
        color: '#475569',
    },
    titulo: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#17365D',
        marginBottom: 8,
    },
    descripcion: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 18,
        lineHeight: 20,
    },
    panelFiltros: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subtitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#17365D',
        marginBottom: 14,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 7,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 15,
        color: '#0F172A',
    },
    botonesRapidos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
        marginBottom: 8,
    },
    botonSecundario: {
        borderWidth: 1,
        borderColor: '#17365D',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    textoBotonSecundario: {
        color: '#17365D',
        fontSize: 12,
        fontWeight: '600',
    },
    grupo: {
        marginTop: 12,
    },
    opciones: {
        gap: 8,
        paddingVertical: 4,
    },
    opcion: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 13,
        maxWidth: 260,
    },
    opcionSeleccionada: {
        backgroundColor: '#17365D',
        borderColor: '#17365D',
    },
    textoOpcion: {
        color: '#334155',
        fontSize: 13,
    },
    textoOpcionSeleccionada: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    botonConsultar: {
        backgroundColor: '#17365D',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 22,
    },
    botonDeshabilitado: {
        opacity: 0.6,
    },
    textoBotonConsultar: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    panelError: {
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    textoError: {
        color: '#991B1B',
        fontSize: 14,
    },
    textoReintentar: {
        color: '#17365D',
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtituloResultados: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#17365D',
        marginBottom: 12,
    },
    resumen: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tarjetaResumen: {
        width: '48%',
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    numeroResumen: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#17365D',
    },
    etiquetaResumen: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 4,
    },
    totalTexto: {
        marginTop: 12,
        marginBottom: 12,
        fontWeight: '600',
        color: '#334155',
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    nombreFuncionario: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#17365D',
        marginBottom: 6,
    },
    dato: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 3,
    },
    sinMarcaciones: {
        color: '#B45309',
        marginTop: 12,
        fontWeight: '600',
    },
    filaMarcacion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
        marginTop: 10,
    },
    datosMarcacion: {
        flex: 1,
    },
    tipoMarcacion: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0F766E',
    },
    origen: {
        fontSize: 11,
        color: '#64748B',
    },
    sinResultados: {
        color: '#64748B',
        paddingVertical: 12,
    },
    instruccion: {
        color: '#64748B',
        textAlign: 'center',
        paddingVertical: 24,
        lineHeight: 20,
    },

    botonExportar: {
        backgroundColor: '#0F766E',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 18,
    },

    botonExportarPDF: {
        backgroundColor: '#8B1E1E',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 18,
    },
    textoBotonExportar: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
