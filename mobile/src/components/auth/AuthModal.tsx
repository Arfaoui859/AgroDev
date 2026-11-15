import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { UserRole } from '../../types';
import { ExtraTranslations } from '../../i18n/extra';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'signin' | 'signup' | 'reset';

const ROLE_OPTIONS: { role: UserRole; labelKey: keyof ExtraTranslations; icon: string }[] = [
  { role: 'farmer', labelKey: 'roleFarmer', icon: 'tractor' },
  { role: 'gardener', labelKey: 'roleGardener', icon: 'flower' },
  { role: 'agronomist', labelKey: 'roleAgronomist', icon: 'school' },
  { role: 'veterinarian', labelKey: 'roleVeterinarian', icon: 'stethoscope' },
  { role: 'company', labelKey: 'roleCompany', icon: 'domain' },
  { role: 'trader', labelKey: 'roleTrader', icon: 'chart-line' },
  { role: 'investor', labelKey: 'roleInvestor', icon: 'bank' },
  { role: 'inspector', labelKey: 'roleInspector', icon: 'clipboard-check-outline' },
  { role: 'government', labelKey: 'roleGovernment', icon: 'office-building' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { x, isRtl } = useLanguage();
  const { signIn, signUp, resetPassword, isLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setPassword('');
  };

  // Distinguish an unreachable/misconfigured auth backend from a genuine
  // credential error: the former is not actionable for the user, so it is
  // replaced with a localised connection message.
  const describeAuthError = (message: string | undefined, fallback: string) => {
    if (!message) return fallback;
    if (/invalid api key|failed to fetch|network request failed|fetch failed|timeout|timed out/i.test(message)) {
      return x.authErrUnreachable;
    }
    return message;
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(x.authErrEmailRequired);
      return;
    }
    if (tab !== 'reset' && password.length < 6) {
      setError(x.authErrPasswordShort);
      return;
    }
    if (tab === 'signup' && !fullName.trim()) {
      setError(x.authErrFullNameRequired);
      return;
    }

    if (tab === 'signin') {
      const res = await signIn(trimmedEmail, password);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(describeAuthError(res.error, x.authErrSignInFailed));
      }
    } else if (tab === 'signup') {
      const res = await signUp({ email: trimmedEmail, password, fullName, phone, role });
      if (res.success) {
        if (res.needsConfirmation) {
          Alert.alert(x.authConfirmTitle, x.authConfirmEmail);
          setTab('signin');
        } else {
          onClose();
          reset();
        }
      } else {
        setError(describeAuthError(res.error, x.authErrSignUpFailed));
      }
    } else {
      const res = await resetPassword(trimmedEmail);
      if (res.success) {
        Alert.alert(x.authResetSentTitle, x.authResetSentBody);
        setTab('signin');
      } else {
        setError(describeAuthError(res.error, x.authErrResetFailed));
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={[styles.header, isRtl && styles.rtlRow]}>
            <View style={[styles.brandRow, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
              <Text style={styles.brandTitle}>AgroGrowth</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={x.close}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, isRtl && styles.rtlText]}>
            {tab === 'signin' ? x.authWelcomeBack : tab === 'signup' ? x.authCreateAccount : x.authReset}
          </Text>
          {tab !== 'reset' ? (
            <Text style={[styles.subtitle, isRtl && styles.rtlText]}>{x.authSubtitle}</Text>
          ) : null}

          <View style={[styles.tabBar, isRtl && styles.rtlRow]}>
            {(['signin', 'signup', 'reset'] as Tab[]).map((item) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => {
                  setTab(item);
                  setError(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item }}
                accessibilityLabel={
                  item === 'signin' ? x.authSignIn : item === 'signup' ? x.authSignUp : x.authReset
                }
                style={[styles.tabBtn, tab === item && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
                  {item === 'signin' ? x.authSignIn : item === 'signup' ? x.authSignUp : x.authReset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {tab === 'signup' ? (
              <>
                <Field label={x.authFullName} isRtl={isRtl}>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtlText]}
                    placeholder={x.authFullNamePlaceholder}
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoComplete="name"
                    accessibilityLabel={x.authFullName}
                  />
                </Field>
                <Field label={x.authPhone} isRtl={isRtl}>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtlText]}
                    placeholder="+216 98 000 000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoComplete="tel"
                    accessibilityLabel={x.authPhone}
                  />
                </Field>
                <Field label={x.authAccountType} isRtl={isRtl}>
                  <View style={[styles.roleGrid, isRtl && styles.rtlRow]}>
                    {ROLE_OPTIONS.map((option) => {
                      const selected = role === option.role;
                      return (
                        <TouchableOpacity
                          key={option.role}
                          activeOpacity={0.85}
                          onPress={() => setRole(option.role)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          accessibilityLabel={x[option.labelKey]}
                          style={[styles.roleChip, isRtl && styles.rtlRow, selected && styles.roleChipSelected]}
                        >
                          <MaterialCommunityIcons
                            name={option.icon as any}
                            size={16}
                            color={selected ? colors.textInverse : colors.primary}
                          />
                          <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                            {x[option.labelKey]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Field>
              </>
            ) : null}

            <Field label={x.authEmail} isRtl={isRtl}>
              <TextInput
                style={[styles.input, isRtl && styles.rtlText]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel={x.authEmail}
              />
            </Field>

            {tab !== 'reset' ? (
              <Field label={x.authPassword} isRtl={isRtl}>
                <TextInput
                  style={[styles.input, isRtl && styles.rtlText]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                  accessibilityLabel={x.authPassword}
                />
              </Field>
            ) : null}

            {error ? (
              <View style={[styles.errorBox, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={tab === 'signin' ? x.authSignInBtn : tab === 'signup' ? x.authSignUpBtn : x.authResetBtn}
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleSubmit}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity
              style={styles.switchRow}
              accessibilityRole="button"
              accessibilityLabel={tab === 'signin' ? x.authSignUp : x.authSignIn}
              onPress={() => {
                setTab(tab === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
            >
              <Text style={styles.switchText}>
                {tab === 'signin' ? x.authNeedAccount : x.authHaveAccount}{' '}
                <Text style={styles.switchLink}>
                  {tab === 'signin' ? x.authSignUp : x.authSignIn}
                </Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const Field: React.FC<{ label: string; isRtl: boolean; children: React.ReactNode }> = ({
  label,
  isRtl,
  children,
}) => (
  <View style={styles.field}>
    <Text style={[styles.label, isRtl && styles.rtlText]}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brandTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  title: {
    fontSize: typography.fontSizes.xl, lineHeight: typography.lineHeights.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 3,
    marginVertical: spacing.md,
  },
  tabBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: { backgroundColor: colors.card },
  tabText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeights.bold },
  field: { marginBottom: spacing.sm },
  label: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
    color: colors.text,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  roleChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  roleChipTextSelected: { color: colors.textInverse },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  errorText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.danger, lineHeight: typography.lineHeights.xs },
  switchRow: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: spacing.md },
  switchText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.xs },
  switchLink: { color: colors.primary, fontWeight: typography.fontWeights.bold },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
