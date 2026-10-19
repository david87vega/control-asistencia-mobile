
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
    listarFuncionarios,
    cambiarEstadoFuncionario,
} from '../services/api';

export default function FuncionariosScreen({ navigation }) {
    const [funcionarios, setFuncionarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
    const [error, setError] = useState('');

    const cargarFuncionarios = useCallback(async (refrescar = false) => {
        if (refrescar) {
            setActualizando(true);
        } else {
            setCargando(true);
        }

        setError('');

        try {
            // false permite incluir funcionarios activos e inactivos.
            const datos = await listarFuncionarios(false);
            setFuncionarios(datos);
        } catch (e) {
            setError(
                e.message || 'No fue posible cargar los funcionarios.'
            );
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarFuncionarios();
        }, [cargarFuncionarios])
    );

    function confirmarCambioEstado(funcionario) {
        const nuevoEstado = !funcionario.activo;

        Alert.alert(
            nuevoEstado ? 'Activar funcionario' : 'Desactivar funcionario',
            nuevoEstado
                ? `¿Deseás activar a ${funcionario.nombre} ${funcionario.apellido}?`
                : `¿Deseás desactivar a ${funcionario.nombre} ${funcionario.apellido}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: nuevoEstado ? 'Activar' : 'Desactivar',
                    style: nuevoEstado ? 'default' : 'destructive',
                    onPress: () => ejecutarCambioEstado(
                        funcionario,
                        nuevoEstado
                    ),
                },
            ]
        );
    }

    async function ejecutarCambioEstado(funcionario, nuevoEstado) {
        setCambiandoEstadoId(funcionario.id);
        setError('');

        try {
            await cambiarEstadoFuncionario(
                funcionario.id,
                nuevoEstado
            );

            await cargarFuncionarios(true);

            Alert.alert(
                'Operación exitosa',
                nuevoEstado
                    ? 'El funcionario fue activado correctamente.'
                    : 'El funcionario fue desactivado correctamente.'
            );
        } catch (e) {
            setError(
                e.message || 'No fue posible cambiar el estado.'
            );
        } finally {
            setCambiandoEstadoId(null);
        }
    }

    const cantidadActivos = funcionarios.filter(
        (funcionario) => funcionario.activo
    ).length;

    if (cargando) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.mensaje}>
                    Cargando funcionarios...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.contenedor}>
            <Text style={styles.titulo}>Funcionarios</Text>

            <Text style={styles.subtitulo}>
                {cantidadActivos} activo(s) de {funcionarios.length} funcionario(s)
            </Text>

            <Pressable
                style={styles.botonNuevo}
                onPress={() => navigation.navigate('NuevoFuncionario')}
            >
                <Text style={styles.textoBotonPrincipal}>
                    + Nuevo funcionario
                </Text>
            </Pressable>

            {error ? (
                <Text style={styles.error}>{error}</Text>
            ) : null}

            <FlatList
                data={funcionarios}
                keyExtractor={(item) => String(item.id)}
                refreshControl={
                    <RefreshControl
                        refreshing={actualizando}
                        onRefresh={() => cargarFuncionarios(true)}
                    />
                }
                ListEmptyComponent={
                    !error ? (
                        <Text style={styles.mensaje}>
                            No hay funcionarios para mostrar.
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => {
                    const estaCambiando =
                        cambiandoEstadoId === item.id;

                    return (
                        <View
                            style={[
                                styles.tarjeta,
                                !item.activo && styles.tarjetaInactiva,
                            ]}
                        >
                            <Text style={styles.nombre}>
                                {item.nombre} {item.apellido}
                            </Text>

                            <Text style={styles.detalle}>
                                Cédula: {item.cedula}
                            </Text>

                            <Text style={styles.detalle}>
                                Dependencia: {item.dependenciaNombre}
                            </Text>

                            <Text
                                style={[
                                    styles.estado,
                                    item.activo
                                        ? styles.estadoActivo
                                        : styles.estadoInactivo,
                                ]}
                            >
                                {item.activo ? 'Activo' : 'Inactivo'}
                            </Text>

                            <View style={styles.acciones}>
                                <Pressable
                                    style={styles.botonEditar}
                                    onPress={() =>
                                        navigation.navigate(
                                            'NuevoFuncionario',
                                            {
                                                funcionarioId: item.id,
                                            }
                                        )
                                    }
                                >
                                    <Text style={styles.textoBotonAccion}>
                                        Editar
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.botonEstado,
                                        item.activo
                                            ? styles.botonDesactivar
                                            : styles.botonActivar,
                                        estaCambiando &&
                                            styles.botonDeshabilitado,
                                    ]}
                                    disabled={estaCambiando}
                                    onPress={() =>
                                        confirmarCambioEstado(item)
                                    }
                                >
                                    {estaCambiando ? (
                                        <ActivityIndicator
                                            color="#FFFFFF"
                                            size="small"
                                        />
                                    ) : (
                                        <Text style={styles.textoBotonAccion}>
                                            {item.activo
                                                ? 'Desactivar'
                                                : 'Activar'}
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#F4F6F8',
        padding: 16,
    },
    centrado: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F6F8',
    },
    titulo: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#183153',
        marginBottom: 4,
    },
    subtitulo: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    tarjetaInactiva: {
        borderWidth: 1,
        borderColor: '#FCA5A5',
        opacity: 0.9,
    },
    nombre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#183153',
        marginBottom: 8,
    },
    detalle: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 4,
    },
    estado: {
        fontWeight: '600',
        marginTop: 8,
    },
    estadoActivo: {
        color: '#15803D',
    },
    estadoInactivo: {
        color: '#B91C1C',
    },
    mensaje: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 12,
    },
    error: {
        color: '#B91C1C',
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    botonNuevo: {
        backgroundColor: '#1565C0',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 16,
    },
    textoBotonPrincipal: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    acciones: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    botonEditar: {
        flex: 1,
        backgroundColor: '#1565C0',
        padding: 11,
        borderRadius: 8,
        alignItems: 'center',
    },
    botonEstado: {
        flex: 1,
        padding: 11,
        borderRadius: 8,
        alignItems: 'center',
    },
    botonDesactivar: {
        backgroundColor: '#B91C1C',
    },
    botonActivar: {
        backgroundColor: '#15803D',
    },
    botonDeshabilitado: {
        opacity: 0.6,
    },
    textoBotonAccion: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
