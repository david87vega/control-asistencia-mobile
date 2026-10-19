import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InicioScreen from '../screens/InicioScreen';
import FuncionariosScreen from '../screens/FuncionariosScreen';
import MarcacionesScreen from '../screens/MarcacionesScreen';

import NuevoFuncionarioScreen from '../screens/NuevoFuncionarioScreen';

import RegistrarMarcacionScreen from '../screens/RegistrarMarcacionScreen';

import ReporteAsistenciaScreen from '../screens/ReporteAsistenciaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>

            <Stack.Navigator>

                <Stack.Screen
                    name="Inicio"
                    component={InicioScreen}
                    options={{
                        title: 'Control de Asistencia',
                    }}
                />

                <Stack.Screen
                    name="Funcionarios"
                    component={FuncionariosScreen}
                    options={{
                        title: 'Funcionarios',
                    }}
                />

                <Stack.Screen
                    name="Marcaciones"
                    component={MarcacionesScreen}
                    options={{
                        title: 'Marcaciones',
                    }}
                />

                <Stack.Screen
                    name="NuevoFuncionario"
                    component={NuevoFuncionarioScreen}
                    options={{ title: 'Nuevo funcionario' }}
                />

                <Stack.Screen
                    name="RegistrarMarcacion"
                    component={RegistrarMarcacionScreen}
                    options={{
                        title: 'Registrar marcación',
                    }}
                />

                <Stack.Screen
                    name="ReporteAsistencia"
                    component={ReporteAsistenciaScreen}
                    options={{ title: 'Reporte de asistencia' }}
                />

            </Stack.Navigator>

        </NavigationContainer>
    );
}