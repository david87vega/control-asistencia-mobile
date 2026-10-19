
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
    listarFuncionarios,
    consultarMarcaciones,
} from '../services/api';

function obtenerFechaParaguay() {
    const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Asuncion',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const obtener = (tipo) =>
        partes.find((parte) => parte.type === tipo)?.value;

    return `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
}

function formatearFecha(fecha) {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
}

export default function InicioScreen({ navigation }) {
    const [resumen, setResumen] = useState({
        funcionariosActivos: 0,
        entradas: 0,
        salidas: 0,
        sinMarcacion: 0,
    });

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarResumen = useCallback(async () => {
        setCargando(true);
        setError('');

        try {
            const fecha = obtenerFechaParaguay();

            const [funcionarios, asistencias] = await Promise.all([
                listarFuncionarios(true),
                consultarMarcaciones(fecha),
            ]);

            const listaFuncionarios = Array.isArray(funcionarios)
                ? funcionarios
                : [];

            const listaAsistencias = Array.isArray(asistencias)
                ? asistencias
                : [];

            let entradas = 0;
            let salidas = 0;
            let sinMarcacion = 0;

            listaAsistencias.forEach((funcionario) => {
                const marcaciones = Array.isArray(funcionario.marcaciones)
                    ? funcionario.marcaciones
                    : [];

                if (marcaciones.length === 0) {
                    sinMarcacion++;
                }

                marcaciones.forEach((marcacion) => {
                    if (marcacion.tipo === 'ENTRADA') {
                        entradas++;
                    } else if (marcacion.tipo === 'SALIDA') {
                        salidas++;
                    }
                });
            });

            setResumen({
                funcionariosActivos: listaFuncionarios.length,
                entradas,
                salidas,
                sinMarcacion,
            });
        } catch (e) {
            setError(
                e.message || 'No fue posible cargar el resumen de asistencia.',
            );
        } finally {
            setCargando(false);
        }
    }, []);

    // Actualiza el dashboard cada vez que se vuelve a Inicio.
    useFocusEffect(
        useCallback(() => {
            cargarResumen();
        }, [cargarResumen]),
    );

    const tarjetas = [
        {
            titulo: 'Funcionarios activos',
            valor: resumen.funcionariosActivos,
            icono: '👥',
            color: '#1D4ED8',
            fondo: '#E8F1FD',
        },
        {
            titulo: 'Entradas de hoy',
            valor: resumen.entradas,
            icono: '🟢',
            color: '#166534',
            fondo: '#E5F7EC',
        },
        {
            titulo: 'Salidas de hoy',
            valor: resumen.salidas,
            icono: '🔴',
            color: '#991B1B',
            fondo: '#FCE7E7',
        },
        {
            titulo: 'Sin marcación hoy',
            valor: resumen.sinMarcacion,
            icono: '⏱️',
            color: '#854D0E',
            fondo: '#FFF2D6',
        },
    ];

    const fechaActual = obtenerFechaParaguay();

    return (
        <ScrollView
            style={styles.contenedor}
            contentContainerStyle={styles.contenido}
        >
            <Text style={styles.titulo}>
                Control de Asistencia
            </Text>

            <Text style={styles.descripcion}>
                Panel de resumen de asistencia
            </Text>

            <View style={styles.encabezadoResumen}>
                <View>
                    <Text style={styles.etiquetaFecha}>
                        RESUMEN DEL DÍA
                    </Text>

                    <Text style={styles.fecha}>
                        {formatearFecha(fechaActual)}
                    </Text>
                </View>

                <Pressable
                    onPress={cargarResumen}
                    disabled={cargando}
                    style={styles.botonActualizar}
                >
                    <Text style={styles.textoActualizar}>
                        ↻ Actualizar
                    </Text>
                </Pressable>
            </View>

            {cargando ? (
                <View style={styles.estado}>
                    <ActivityIndicator size="large" color="#1565C0" />
                    <Text style={styles.textoEstado}>
                        Cargando estadísticas...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.errorContenedor}>
                    <Text style={styles.errorTexto}>{error}</Text>

                    <Pressable
                        onPress={cargarResumen}
                        style={styles.botonReintentar}
                    >
                        <Text style={styles.textoBoton}>
                            Reintentar
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.grilla}>
                    {tarjetas.map((tarjeta) => (
                        <View
                            key={tarjeta.titulo}
                            style={[
                                styles.tarjeta,
                                { backgroundColor: tarjeta.fondo },
                            ]}
                        >
                            <Text style={styles.icono}>
                                {tarjeta.icono}
                            </Text>

                            <Text
                                style={[
                                    styles.valor,
                                    { color: tarjeta.color },
                                ]}
                            >
                                {tarjeta.valor}
                            </Text>

                            <Text
                                style={[
                                    styles.tituloTarjeta,
                                    { color: tarjeta.color },
                                ]}
                            >
                                {tarjeta.titulo}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.tituloSeccion}>
                Accesos rápidos
            </Text>

            <Pressable
                style={styles.boton}
                onPress={() => navigation.navigate('Funcionarios')}
            >
                <Text style={styles.botonIcono}>👥</Text>

                <View style={styles.botonContenido}>
                    <Text style={styles.botonTitulo}>
                        Funcionarios
                    </Text>
                    <Text style={styles.botonDescripcion}>
                        Administrar funcionarios y sus datos
                    </Text>
                </View>

                <Text style={styles.flecha}>›</Text>
            </Pressable>

            <Pressable
                style={styles.boton}
                onPress={() => navigation.navigate('Marcaciones')}
            >
                <Text style={styles.botonIcono}>📋</Text>

                <View style={styles.botonContenido}>
                    <Text style={styles.botonTitulo}>
                        Marcaciones
                    </Text>
                    <Text style={styles.botonDescripcion}>
                        Consultar asistencia por fecha
                    </Text>
                </View>

                <Text style={styles.flecha}>›</Text>
            </Pressable>

            <Pressable
                style={[styles.boton, styles.botonPrincipal]}
                onPress={() => navigation.navigate('RegistrarMarcacion')}
            >
                <Text style={styles.botonIcono}>🕒</Text>

                <View style={styles.botonContenido}>
                    <Text style={styles.botonTituloPrincipal}>
                        Registrar marcación
                    </Text>
                    <Text style={styles.botonDescripcionPrincipal}>
                        Registrar una entrada o salida
                    </Text>
                </View>

                <Text style={styles.flechaPrincipal}>›</Text>
            </Pressable>


            <Pressable
                style={styles.boton}
                onPress={() => navigation.navigate('ReporteAsistencia')}
            >
                <Text style={styles.botonIcono}>📊</Text>

                <View style={styles.botonContenido}>
                    <Text style={styles.botonTitulo}>
                        Reporte de asistencia
                    </Text>

                    <Text style={styles.botonDescripcion}>
                        Consultar asistencia por período, dependencia y funcionario
                    </Text>
                </View>

                <Text style={styles.flecha}>›</Text>
            </Pressable>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#F4F6F8',
    },
    contenido: {
        padding: 18,
        paddingBottom: 35,
    },
    titulo: {
        fontSize: 27,
        fontWeight: 'bold',
        color: '#183153',
    },
    descripcion: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 5,
        marginBottom: 24,
    },
    encabezadoResumen: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    etiquetaFecha: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1,
    },
    fecha: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#183153',
        marginTop: 4,
    },
    botonActualizar: {
        backgroundColor: '#E8F0FE',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    textoActualizar: {
        color: '#1565C0',
        fontWeight: 'bold',
        fontSize: 13,
    },
    grilla: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tarjeta: {
        width: '48.5%',
        minHeight: 145,
        borderRadius: 14,
        padding: 15,
        marginBottom: 12,
        justifyContent: 'center',
    },
    icono: {
        fontSize: 25,
        marginBottom: 9,
    },
    valor: {
        fontSize: 31,
        fontWeight: 'bold',
    },
    tituloTarjeta: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 5,
    },
    estado: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 25,
        alignItems: 'center',
        marginBottom: 20,
    },
    textoEstado: {
        color: '#64748B',
        marginTop: 12,
    },
    errorContenedor: {
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    errorTexto: {
        color: '#991B1B',
    },
    botonReintentar: {
        alignSelf: 'flex-start',
        backgroundColor: '#17365D',
        padding: 10,
        borderRadius: 7,
        marginTop: 12,
    },
    textoBoton: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tituloSeccion: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#183153',
        marginTop: 17,
        marginBottom: 12,
    },
    boton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 11,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    botonPrincipal: {
        backgroundColor: '#17365D',
        borderColor: '#17365D',
    },
    botonIcono: {
        fontSize: 25,
        marginRight: 13,
    },
    botonContenido: {
        flex: 1,
    },
    botonTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#183153',
    },
    botonDescripcion: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    botonTituloPrincipal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    botonDescripcionPrincipal: {
        fontSize: 12,
        color: '#DCE8F8',
        marginTop: 4,
    },
    flecha: {
        fontSize: 28,
        color: '#64748B',
        marginLeft: 8,
    },
    flechaPrincipal: {
        fontSize: 28,
        color: '#FFFFFF',
        marginLeft: 8,
    },
});
