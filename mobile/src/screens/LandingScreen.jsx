import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme'

const etapas = [
  ['Área provável', 'Direito do consumidor ou bancário'],
  ['Separar documentos', 'Extratos, contrato, prints e protocolos'],
  ['Proximo passo', 'Organizar o caso antes do atendimento']
]

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.glow} />

          <View style={styles.topbar}>
            <Text style={styles.logo}>
              Lei<Text style={styles.logoAccent}>Simples</Text>
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Orientação inicial, simples e segura</Text>
          </View>

          <Text style={styles.title}>Entenda seu problema jurídico sem complicação.</Text>
          <Text style={styles.subtitle}>
            O LeiSimples ajuda você a organizar o que aconteceu, separar documentos e encontrar o próximo passo com
            mais clareza.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Começar minha triagem</Text>
            <Text style={styles.primaryButtonIcon}>-&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.secondaryButtonText}>Criar conta grátis</Text>
          </TouchableOpacity>

          <View style={styles.preview}>
            <View style={styles.previewInner}>
              <View style={styles.previewHeader}>
                <View style={styles.scaleIcon}>
                  <Text style={styles.scaleIconText}>LS</Text>
                </View>
                <View style={styles.previewTitleBox}>
                  <Text style={styles.previewEyebrow}>Exemplo de triagem</Text>
                  <Text style={styles.previewTitle}>Cobrança que não reconheço</Text>
                </View>
              </View>

              <View style={styles.stepList}>
                {etapas.map(([titulo, texto]) => (
                  <View key={titulo} style={styles.stepCard}>
                    <View style={styles.stepCheck} />
                    <View style={styles.stepTextBox}>
                      <Text style={styles.stepTitle}>{titulo}</Text>
                      <Text style={styles.stepText}>{texto}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.notice}>
                <View style={styles.noticeIcon} />
                <Text style={styles.noticeText}>
                  A triagem não substitui advogado. Ela ajuda você a chegar mais preparado.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.trustStrip}>
          {['Linguagem simples', 'Casos organizados', 'Advogados verificados'].map((item) => (
            <View key={item} style={styles.trustItem}>
              <View style={styles.trustIcon} />
              <Text style={styles.trustText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.howSection}>
          <Text style={styles.sectionLabel}>COMO FUNCIONA</Text>
          <Text style={styles.sectionTitle}>Poucos passos, sem termos jurídicos</Text>
          <Text style={styles.sectionText}>A experiência foi pensada para quem não sabe por onde começar.</Text>

          {[
            ['1', 'Conte com calma', 'Escreva do seu jeito, sem precisar conhecer leis ou palavras difíceis.'],
            ['2', 'Receba um resumo', 'O sistema organiza área provável, próximos passos e documentos importantes.'],
            ['3', 'Procure ajuda', 'Com o caso organizado, fica mais fácil pedir atendimento jurídico.']
          ].map(([numero, titulo, texto]) => (
            <View key={numero} style={styles.howCard}>
              <Text style={styles.howNumber}>{numero}</Text>
              <Text style={styles.howTitle}>{titulo}</Text>
              <Text style={styles.howText}>{texto}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy
  },
  page: {
    flex: 1,
    backgroundColor: colors.cream
  },
  content: {
    backgroundColor: colors.cream
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.navy,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(26, 138, 114, 0.22)'
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 54
  },
  logo: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800'
  },
  logoAccent: {
    color: colors.tealLight
  },
  loginButton: {
    backgroundColor: colors.tealLight,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10
  },
  loginButtonText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800'
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 28
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tealLight
  },
  badgeText: {
    color: colors.tealLight,
    fontSize: 13
  },
  title: {
    color: colors.white,
    fontSize: 40,
    lineHeight: 45,
    fontWeight: '400',
    marginBottom: 24
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 18,
    lineHeight: 29,
    marginBottom: 34
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  primaryButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800'
  },
  primaryButtonIcon: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 42
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800'
  },
  preview: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 20
  },
  previewInner: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamDark,
    borderRadius: 22,
    padding: 18
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18
  },
  scaleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scaleIconText: {
    color: colors.white,
    fontWeight: '900'
  },
  previewTitleBox: {
    flex: 1
  },
  previewEyebrow: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 3
  },
  previewTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23
  },
  stepList: {
    gap: 12
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamDark,
    borderRadius: 18,
    padding: 16
  },
  stepCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.teal,
    marginTop: 2
  },
  stepTextBox: {
    flex: 1
  },
  stepTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5
  },
  stepText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  notice: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 16,
    marginTop: 20
  },
  noticeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.tealLight,
    marginTop: 2
  },
  noticeText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 22
  },
  trustStrip: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 14
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  trustIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.teal
  },
  trustText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800'
  },
  howSection: {
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 42
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 14
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '500',
    marginBottom: 12
  },
  sectionText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18
  },
  howCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamDark,
    borderRadius: 20,
    padding: 22,
    marginTop: 14
  },
  howNumber: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 34
  },
  howTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 9
  },
  howText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23
  }
})
