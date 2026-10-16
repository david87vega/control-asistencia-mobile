import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>

      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>
          Control de Asistencia
        </Text>

        <Text style={styles.subtitle}>
          Gestión institucional de funcionarios
        </Text>
      </View>

      <View style={styles.content}>

        <Text style={styles.welcome}>
          Bienvenido
        </Text>

        <Text style={styles.description}>
          Consulte funcionarios y marcaciones diarias
          desde su dispositivo móvil.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => alert('Próximamente')}
        >
          <Text style={styles.buttonText}>
            INGRESAR
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  header: {
    backgroundColor: '#1E3A5F',
    paddingTop: 70,
    paddingBottom: 35,
    paddingHorizontal: 25,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#D9E4F0',
    fontSize: 16,
    marginTop: 8,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },

  button: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

});