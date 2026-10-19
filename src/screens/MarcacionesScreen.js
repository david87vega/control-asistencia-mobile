
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { consultarMarcaciones } from '../services/api';

function obtenerFechaLocal() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function desplazarFecha(fechaTexto, cantidad) {
  const [anio, mes, dia] = fechaTexto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + cantidad));

  return [
    fecha.getUTCFullYear(),
    String(fecha.getUTCMonth() + 1).padStart(2, '0'),
    String(fecha.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function formatearFecha(fechaTexto) {
  const [anio, mes, dia] = fechaTexto.split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatearHora(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Asuncion',
  });
}

export default function MarcacionesScreen() {
  const [fecha, setFecha] = useState(obtenerFechaLocal);
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarMarcaciones = useCallback(async (fechaConsulta) => {
    setCargando(true);
    setError('');

    try {
      const datos = await consultarMarcaciones(fechaConsulta);
      setAsistencias(datos);
    } catch (e) {
      setError(e.message || 'No fue posible consultar las marcaciones.');
      setAsistencias([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarMarcaciones(fecha);
    }, [fecha, cargarMarcaciones])
  );

  const cambiarFecha = (cantidad) => {
    setFecha((actual) => desplazarFecha(actual, cantidad));
  };

  const totalMarcaciones = asistencias.reduce(
    (total, funcionario) => total + funcionario.marcaciones.length,
    0
  );

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Marcaciones</Text>
      <Text style={styles.subtitulo}>
        Consulta diaria de asistencia
      </Text>

      <View style={styles.selectorFecha}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Día anterior"
          style={styles.botonFecha}
          onPress={() => cambiarFecha(-1)}
        >
          <Text style={styles.textoBotonFecha}>‹</Text>
        </Pressable>

        <View style={styles.fechaCentro}>
          <Text style={styles.etiquetaFecha}>Fecha seleccionada</Text>
          <Text style={styles.fechaTexto}>
            {formatearFecha(fecha)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Día siguiente"
          style={styles.botonFecha}
          onPress={() => cambiarFecha(1)}
        >
          <Text style={styles.textoBotonFecha}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.resumen}>
        {asistencias.length} funcionario(s) · {totalMarcaciones} marcación(es)
      </Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.mensaje}>Consultando marcaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={asistencias}
          keyExtractor={(item) => String(item.funcionarioId)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            !error ? (
              <Text style={styles.mensaje}>
                No hay funcionarios activos para mostrar.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={styles.nombre}>
                {item.nombre} {item.apellido}
              </Text>

              <Text style={styles.detalle}>
                Cédula: {item.cedula}
              </Text>

              <Text style={styles.detalle}>
                Dependencia: {item.dependenciaNombre}
              </Text>

              {item.marcaciones.length === 0 ? (
                <View style={styles.sinMarcaciones}>
                  <Text style={styles.textoSinMarcaciones}>
                    Sin marcaciones en esta fecha
                  </Text>
                </View>
              ) : (
                item.marcaciones.map((marcacion) => (
                  <View
                    key={marcacion.id}
                    style={styles.filaMarcacion}
                  >
                    <View
                      style={[
                        styles.indicador,
                        marcacion.tipo === 'ENTRADA'
                          ? styles.indicadorEntrada
                          : styles.indicadorSalida,
                      ]}
                    />

                    <View style={styles.datosMarcacion}>
                      <Text style={styles.tipoMarcacion}>
                        {marcacion.tipo}
                      </Text>
                      <Text style={styles.origen}>
                        Origen: {marcacion.origen}
                      </Text>
                    </View>

                    <Text style={styles.hora}>
                      {formatearHora(marcacion.fechaHora)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#183153',
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 18,
  },
  selectorFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
  },
  botonFecha: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 10,
  },
  textoBotonFecha: {
    color: '#1565C0',
    fontSize: 32,
    lineHeight: 36,
  },
  fechaCentro: {
    flex: 1,
    alignItems: 'center',
  },
  etiquetaFecha: {
    fontSize: 12,
    color: '#64748B',
  },
  fechaTexto: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#183153',
    marginTop: 3,
  },
  resumen: {
    color: '#475569',
    fontSize: 13,
    marginVertical: 14,
  },
  lista: {
    paddingBottom: 24,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  nombre: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#183153',
    marginBottom: 6,
  },
  detalle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  filaMarcacion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  indicador: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  indicadorEntrada: {
    backgroundColor: '#16A34A',
  },
  indicadorSalida: {
    backgroundColor: '#DC2626',
  },
  datosMarcacion: {
    flex: 1,
  },
  tipoMarcacion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  origen: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  hora: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#183153',
  },
  sinMarcaciones: {
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  textoSinMarcaciones: {
    color: '#9A3412',
    fontSize: 13,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mensaje: {
    color: '#64748B',
    marginTop: 10,
    textAlign: 'center',
  },
  error: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});
