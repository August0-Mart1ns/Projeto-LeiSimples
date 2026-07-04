import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'
import LandingScreen from '../screens/LandingScreen'
import LoginScreen from '../screens/LoginScreen'
import CadastroScreen from '../screens/CadastroScreen'
import PainelScreen from '../screens/cidadao/PainelScreen'
import AnaliseScreen from '../screens/cidadao/AnaliseScreen'
import ResultadoScreen from '../screens/cidadao/ResultadoScreen'
import AdvogadosScreen from '../screens/cidadao/AdvogadosScreen'
import PainelAdvogadoScreen from '../screens/advogado/PainelAdvogadoScreen'
import PainelAdminScreen from '../screens/admin/PainelAdminScreen'

const Stack = createNativeStackNavigator()

const screenOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.cream }
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
      <ActivityIndicator color={colors.teal} />
    </View>
  )
}

export default function AppNavigator() {
  const { usuario, carregando } = useAuth()

  if (carregando) return <Loading />

  if (!usuario) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Criar conta' }} />
      </Stack.Navigator>
    )
  }

  if (usuario.tipo === 'advogado') {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="PainelAdvogado" component={PainelAdvogadoScreen} options={{ title: 'Painel do advogado' }} />
      </Stack.Navigator>
    )
  }

  if (usuario.tipo === 'admin') {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="PainelAdmin" component={PainelAdminScreen} options={{ title: 'Admin' }} />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Painel" component={PainelScreen} options={{ title: 'Meus casos' }} />
      <Stack.Screen name="Analise" component={AnaliseScreen} options={{ title: 'Analisar problema' }} />
      <Stack.Screen name="Resultado" component={ResultadoScreen} options={{ title: 'Resultado' }} />
      <Stack.Screen name="Advogados" component={AdvogadosScreen} options={{ title: 'Advogados' }} />
    </Stack.Navigator>
  )
}
