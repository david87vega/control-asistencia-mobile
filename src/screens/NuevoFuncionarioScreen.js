
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  crearFuncionario,
  actualizarFuncionario,
  obtenerFuncionario,
  listarDependencias,
} from '../services/api';

export default function NuevoFuncionarioScreen({ navigation, route }) {
  const funcionarioId = route?.params?.funcionarioId ?? null;
  const modoEdicion = funcionarioId !== null;

  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dependenciaId, setDependenciaId] = useState(null);

  const [dependencias, setDependencias] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(modoEdicion);
  const [cargandoDependencias, setCargandoDependencias] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [errorDependencias, setErrorDependencias] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargandoDatos(modoEdicion);
      setCargandoDependencias(true);
      setErrorFormulario('');
      setErrorDependencias('');

      try {
        const datosDependencias = await listarDependencias();

        if (!activo) return;

        setDependencias(datosDependencias);

        if (datosDependencias.length === 0) {
          setErrorDependencias(
            'No existen dependencias activas para seleccionar.'
          );
        }

        if (modoEdicion) {
          const funcionario = await obtenerFuncionario(funcionarioId);

          if (!activo) return;

          setCedula(funcionario.cedula ?? '');
          setNombre(funcionario.nombre ?? '');
          setApellido(funcionario.apellido ?? '');
          setDependenciaId(
            funcionario.dependenciaId != null
              ? Number(funcionario.dependenciaId)
              : null
          );
        }
      } catch (error) {
        if (activo) {
          setErrorFormulario(
            error.message ||
              'No se pudieron cargar los datos del funcionario.'
          );
        }
      } finally {
        if (activo) {
          setCargandoDatos(false);
          setCargandoDependencias(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [funcionarioId, modoEdicion]);

  async function guardarFuncionario() {
    const cedulaLimpia = cedula.trim();
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();

    if (
      !cedulaLimpia ||
      !nombreLimpio ||
      !apellidoLimpio ||
      dependenciaId === null
    ) {
      Alert.alert(
        'Datos incompletos',
        'Completá la cédula, el nombre, el apellido y la dependencia.'
      );
      return;
    }

    if (cedulaLimpia.length > 20) {
      Alert.alert(
        'Validación',
        'La cédula no puede superar 20 caracteres.'
      );
      return;
    }

    if (nombreLimpio.length > 100 || apellidoLimpio.length > 100) {
      Alert.alert(
        'Validación',
        'El nombre y el apellido no pueden superar 100 caracteres.'
      );
      return;
    }

    const datosFuncionario = {
      cedula: cedulaLimpia,
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      dependenciaId: Number(dependenciaId),
    };

    setGuardando(true);
    setErrorFormulario('');

    try {
      if (modoEdicion) {
        await actualizarFuncionario(funcionarioId, datosFuncionario);

        Alert.alert(
          'Actualización exitosa',
          'Los datos del funcionario fueron actualizados correctamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        await crearFuncionario(datosFuncionario);

        Alert.alert(
          'Registro exitoso',
          'El funcionario fue registrado correctamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        modoEdicion ? 'No se pudo actualizar' : 'No se pudo registrar',
        error.message ||
          'Ocurrió un error al guardar los datos del funcionario.'
      );
    } finally {
      setGuardando(false);
    }
  }

  const bloqueado =
    guardando ||
    cargandoDatos ||
    cargandoDependencias ||
    dependencias.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>
          {modoEdicion ? 'Editar funcionario' : 'Nuevo funcionario'}
        </Text>

        <Text style={styles.subtitulo}>
          {modoEdicion
            ? 'Modificá los datos del funcionario seleccionado.'
            : 'Completá los datos del funcionario.'}
        </Text>

        {cargandoDatos ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="small" color="#1565C0" />
            <Text style={styles.textoSecundario}>
              Cargando datos del funcionario...
            </Text>
          </View>
        ) : null}

        {errorFormulario ? (
          <View style={styles.contenedorError}>
            <Text style={styles.error}>{errorFormulario}</Text>

            {modoEdicion ? (
              <Pressable
                style={styles.botonReintentar}
                onPress={() => navigation.replace('NuevoFuncionario', {
                  funcionarioId,
                })}
              >
                <Text style={styles.textoBoton}>Volver a cargar</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.etiqueta}>Cédula</Text>
        <TextInput
          style={styles.input}
          value={cedula}
          onChangeText={setCedula}
          placeholder="Ej.: 9876543"
          maxLength={20}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!bloqueado}
        />

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del funcionario"
          maxLength={100}
          autoCapitalize="words"
          editable={!bloqueado}
        />

        <Text style={styles.etiqueta}>Apellido</Text>
        <TextInput
          style={styles.input}
          value={apellido}
          onChangeText={setApellido}
          placeholder="Apellido del funcionario"
          maxLength={100}
          autoCapitalize="words"
          editable={!bloqueado}
        />

        <Text style={styles.etiqueta}>Dependencia</Text>

        {cargandoDependencias ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="small" color="#1565C0" />
            <Text style={styles.textoSecundario}>
              Cargando dependencias...
            </Text>
          </View>
        ) : (
          <View style={styles.listaDependencias}>
            {dependencias.map((dependencia) => {
              const seleccionada =
                dependenciaId === Number(dependencia.id);

              return (
                <Pressable
                  key={dependencia.id}
                  disabled={bloqueado}
                  onPress={() =>
                    setDependenciaId(Number(dependencia.id))
                  }
                  style={[
                    styles.opcionDependencia,
                    seleccionada && styles.opcionSeleccionada,
                    bloqueado && styles.opcionDeshabilitada,
                  ]}
                >
                  <View style={styles.filaDependencia}>
                    <Text
                      style={[
                        styles.nombreDependencia,
                        seleccionada && styles.textoSeleccionado,
                      ]}
                    >
                      {dependencia.nombre}
                    </Text>

                    <Text
                      style={[
                        styles.marcaSeleccion,
                        seleccionada && styles.textoSeleccionado,
                      ]}
                    >
                      {seleccionada ? '✓' : '○'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {errorDependencias ? (
          <Text style={styles.error}>{errorDependencias}</Text>
        ) : null}

        <Pressable
          style={[
            styles.botonGuardar,
            bloqueado && styles.botonDeshabilitado,
          ]}
          onPress={guardarFuncionario}
          disabled={bloqueado}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBoton}>
              {modoEdicion
                ? 'Guardar cambios'
                : 'Guardar funcionario'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.botonCancelar}
          onPress={() => navigation.goBack()}
          disabled={guardando}
        >
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#183153',
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 22,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 16,
    color: '#183153',
  },
  listaDependencias: {
    gap: 8,
  },
  opcionDependencia: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
  },
  opcionSeleccionada: {
    backgroundColor: '#E8F0FE',
    borderColor: '#1565C0',
  },
  opcionDeshabilitada: {
    opacity: 0.65,
  },
  filaDependencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nombreDependencia: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
  },
  marcaSeleccion: {
    fontSize: 20,
    color: '#64748B',
  },
  textoSeleccionado: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  cargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  textoSecundario: {
    color: '#64748B',
  },
  contenedorError: {
    marginBottom: 8,
  },
  error: {
    color: '#B91C1C',
    marginTop: 10,
    fontSize: 13,
  },
  botonGuardar: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonReintentar: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  botonCancelar: {
    alignItems: 'center',
    padding: 14,
    marginTop: 8,
  },
  textoCancelar: {
    color: '#475569',
    fontSize: 15,
  },
});
