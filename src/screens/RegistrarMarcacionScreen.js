
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listarFuncionarios,
  registrarMarcacion,
} from '../services/api';

export default function RegistrarMarcacionScreen({ navigation }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] =
    useState(null);
  const [tipo, setTipo] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarFuncionarios();
  }, []);

  async function cargarFuncionarios() {
    try {
      setCargando(true);
      setError('');

      // Solo se muestran funcionarios activos.
      const datos = await listarFuncionarios(true);

      setFuncionarios(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }

  const funcionariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return funcionarios;
    }

    return funcionarios.filter((funcionario) => {
      const contenido = [
        funcionario.nombre,
        funcionario.apellido,
        funcionario.cedula,
        funcionario.dependenciaNombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [funcionarios, busqueda]);

  function seleccionarFuncionario(funcionario) {
    Keyboard.dismiss();
    setFuncionarioSeleccionado(funcionario);
    setTipo(null);
  }

  function limpiarSeleccion() {
    setFuncionarioSeleccionado(null);
    setTipo(null);
  }

  function confirmarMarcacion() {
    if (!funcionarioSeleccionado) {
      Alert.alert(
        'Funcionario requerido',
        'Seleccioná un funcionario antes de continuar.',
      );
      return;
    }

    if (!tipo) {
      Alert.alert(
        'Tipo requerido',
        'Seleccioná ENTRADA o SALIDA.',
      );
      return;
    }

    const nombreCompleto =
      `${funcionarioSeleccionado.nombre} ${funcionarioSeleccionado.apellido}`;

    const dependencia =
      funcionarioSeleccionado.dependenciaNombre || 'No especificada';

    Alert.alert(
      'Confirmar marcación',
      `Funcionario: ${nombreCompleto}\n` +
        `Cédula: ${funcionarioSeleccionado.cedula}\n` +
        `Dependencia: ${dependencia}\n` +
        `Tipo: ${tipo}\n\n` +
        '¿Deseás registrar esta marcación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: guardarMarcacion,
        },
      ],
      { cancelable: true },
    );
  }

  async function guardarMarcacion() {
    if (guardando || !funcionarioSeleccionado || !tipo) {
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await registrarMarcacion({
        funcionarioId: funcionarioSeleccionado.id,
        tipo: tipo,
      });

      const fechaHora = respuesta?.fechaHora
        ? new Date(respuesta.fechaHora).toLocaleString('es-PY', {
            timeZone: 'America/Asuncion',
          })
        : '';

      const mensaje =
        `La marcación de ${respuesta?.nombreFuncionario || funcionarioSeleccionado.nombre} ` +
        `${respuesta?.apellidoFuncionario || funcionarioSeleccionado.apellido} ` +
        `se registró correctamente como ${respuesta?.tipo || tipo}.` +
        (fechaHora ? `\n\nFecha y hora: ${fechaHora}` : '');

      Alert.alert(
        'Marcación registrada',
        mensaje,
        [
          {
            text: 'Ver marcaciones',
            onPress: () => navigation.navigate('Marcaciones'),
          },
          {
            text: 'Registrar otra',
            onPress: () => {
              limpiarSeleccion();
              setBusqueda('');
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(
        'No se pudo registrar',
        obtenerMensajeError(e),
      );
    } finally {
      setGuardando(false);
    }
  }

  function obtenerMensajeError(e) {
    const mensaje = e?.message || 'Ocurrió un error inesperado.';

    // Intenta extraer el mensaje de una respuesta JSON de Spring Boot.
    const separador = mensaje.indexOf(': ');

    if (separador >= 0) {
      const posibleJson = mensaje.substring(separador + 2);

      try {
        const datos = JSON.parse(posibleJson);

        if (datos.message) {
          return datos.message;
        }

        if (datos.detail) {
          return datos.detail;
        }
      } catch {
        // La respuesta no era JSON; se muestra el mensaje original.
      }
    }

    return mensaje;
  }

  function renderFuncionario({ item }) {
    const seleccionado =
      funcionarioSeleccionado?.id === item.id;

    return (
      <Pressable
        onPress={() => seleccionarFuncionario(item)}
        style={[
          styles.tarjetaFuncionario,
          seleccionado && styles.tarjetaSeleccionada,
        ]}
      >
        <View style={styles.datosFuncionario}>
          <Text style={styles.nombreFuncionario}>
            {item.apellido}, {item.nombre}
          </Text>

          <Text style={styles.textoSecundario}>
            Cédula: {item.cedula}
          </Text>

          <Text style={styles.textoSecundario}>
            {item.dependenciaNombre || 'Sin dependencia'}
          </Text>
        </View>

        <Text
          style={[
            styles.indicador,
            seleccionado && styles.indicadorSeleccionado,
          ]}
        >
          {seleccionado ? '✓' : '○'}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <FlatList
        data={funcionariosFiltrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFuncionario}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listaContenido}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo}>
              Registrar marcación
            </Text>

            <Text style={styles.descripcion}>
              Seleccioná al funcionario y el tipo de marcación.
            </Text>

            <Text style={styles.etiqueta}>
              Buscar funcionario
            </Text>

            <TextInput
              style={styles.input}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Nombre, apellido o cédula"
              placeholderTextColor="#888"
              autoCapitalize="none"
              editable={!guardando}
            />

            {cargando && (
              <View style={styles.estado}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.textoEstado}>
                  Cargando funcionarios...
                </Text>
              </View>
            )}

            {!cargando && error !== '' && (
              <View style={styles.mensajeError}>
                <Text style={styles.textoError}>{error}</Text>

                <Pressable
                  style={styles.botonReintentar}
                  onPress={cargarFuncionarios}
                >
                  <Text style={styles.textoBoton}>
                    Reintentar
                  </Text>
                </Pressable>
              </View>
            )}

            {!cargando &&
              error === '' &&
              funcionarios.length === 0 && (
                <Text style={styles.textoEstado}>
                  No hay funcionarios activos.
                </Text>
              )}

            {!cargando &&
              error === '' &&
              funcionarios.length > 0 && (
                <Text style={styles.subtitulo}>
                  Funcionarios ({funcionariosFiltrados.length})
                </Text>
              )}

            {!cargando &&
              error === '' &&
              funcionariosFiltrados.length === 0 &&
              funcionarios.length > 0 && (
                <Text style={styles.textoEstado}>
                  No se encontraron funcionarios con esa búsqueda.
                </Text>
              )}

            {funcionarioSeleccionado && (
              <View style={styles.seccionTipo}>
                <Text style={styles.subtitulo}>
                  Funcionario seleccionado
                </Text>

                <View style={styles.resumen}>
                  <Text style={styles.resumenNombre}>
                    {funcionarioSeleccionado.nombre}{' '}
                    {funcionarioSeleccionado.apellido}
                  </Text>

                  <Text style={styles.textoSecundario}>
                    Cédula: {funcionarioSeleccionado.cedula}
                  </Text>

                  <Text style={styles.textoSecundario}>
                    Dependencia:{' '}
                    {funcionarioSeleccionado.dependenciaNombre ||
                      'No especificada'}
                  </Text>

                  <Pressable
                    onPress={limpiarSeleccion}
                    disabled={guardando}
                    style={styles.botonCambiar}
                  >
                    <Text style={styles.textoCambiar}>
                      Cambiar funcionario
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.subtitulo}>
                  Tipo de marcación
                </Text>

                <View style={styles.filaTipos}>
                  <Pressable
                    onPress={() => setTipo('ENTRADA')}
                    disabled={guardando}
                    style={[
                      styles.botonTipo,
                      tipo === 'ENTRADA' && styles.entradaSeleccionada,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoTipo,
                        tipo === 'ENTRADA' && styles.textoTipoSeleccionado,
                      ]}
                    >
                      ENTRADA
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTipo('SALIDA')}
                    disabled={guardando}
                    style={[
                      styles.botonTipo,
                      tipo === 'SALIDA' && styles.salidaSeleccionada,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoTipo,
                        tipo === 'SALIDA' && styles.textoTipoSeleccionado,
                      ]}
                    >
                      SALIDA
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={confirmarMarcacion}
                  disabled={!tipo || guardando}
                  style={[
                    styles.botonConfirmar,
                    (!tipo || guardando) && styles.botonDeshabilitado,
                  ]}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoBotonConfirmar}>
                      Revisar y confirmar
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        }
        ListFooterComponent={<View style={styles.espacioFinal} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  listaContenido: {
    padding: 16,
    paddingBottom: 32,
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 15,
    color: '#596579',
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#26364A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD5DF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#26364A',
    marginTop: 8,
    marginBottom: 10,
  },
  tarjetaFuncionario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE2EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tarjetaSeleccionada: {
    borderColor: '#1565C0',
    borderWidth: 2,
    backgroundColor: '#EAF3FF',
  },
  datosFuncionario: {
    flex: 1,
  },
  nombreFuncionario: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textoSecundario: {
    color: '#596579',
    fontSize: 13,
    marginTop: 3,
  },
  indicador: {
    fontSize: 25,
    color: '#9AA5B1',
    marginLeft: 10,
  },
  indicadorSeleccionado: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  seccionTipo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DCE2EA',
  },
  resumen: {
    backgroundColor: '#F4F6F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resumenNombre: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#17365D',
  },
  botonCambiar: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 5,
  },
  textoCambiar: {
    color: '#1565C0',
    fontWeight: '600',
  },
  filaTipos: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  botonTipo: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CDD5DF',
    backgroundColor: '#FFFFFF',
  },
  entradaSeleccionada: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  salidaSeleccionada: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  textoTipo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#344054',
  },
  textoTipoSeleccionado: {
    color: '#FFFFFF',
  },
  botonConfirmar: {
    backgroundColor: '#17365D',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 9,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonConfirmar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  estado: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  textoEstado: {
    color: '#596579',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 14,
  },
  mensajeError: {
    backgroundColor: '#FDECEC',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
  },
  textoError: {
    color: '#B42318',
    fontSize: 14,
  },
  botonReintentar: {
    backgroundColor: '#17365D',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    marginTop: 12,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  espacioFinal: {
    height: 25,
  },
});
