import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.page,
    backgroundColor: colors.cream
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.radius,
    padding: 18,
    marginBottom: 14
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    color: colors.text
  },
  button: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4
  },
  buttonDark: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700'
  },
  error: {
    color: colors.danger,
    marginBottom: 8
  }
})
