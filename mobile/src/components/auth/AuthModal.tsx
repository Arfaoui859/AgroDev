import React, { useState } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { formInput } from '../../theme/formStyles';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { IconChip } from '../ui/IconChip';
import { ModalSheet } from '../ui/ModalSheet';
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
    <ModalSheet
      visible={visible}
      onClose={onClose}
      closeLabel={x.close}
      keyboardAvoiding
      sheetStyle={styles.sheet}
      headerStyle={styles.header}
      header={
        <View style={[styles.brandRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
          <Text style={styles.brandTitle}>AgroGrowth</Text>
        </View>
      }
    >

          <Text style={[styles.title, isRtl && rtlStyles.rtlText]}>
            {tab === 'signin' ? x.authWelcomeBack : tab === 'signup' ? x.authCreateAccount : x.authReset}
          </Text>
          {tab !== 'reset' ? (
            <Text style={[styles.subtitle, isRtl && rtlStyles.rtlText]}>{x.authSubtitle}</Text>
          ) : null}

          <View style={[styles.tabBar, isRtl && rtlStyles.rtlRow]}>
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
                    style={[styles.input, isRtl && rtlStyles.rtlText]}
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
                    style={[styles.input, isRtl && rtlStyles.rtlText]}
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
                  <View style={[styles.roleGrid, isRtl && rtlStyles.rtlRow]}>
                    {ROLE_OPTIONS.map((option) => (
                      <IconChip
                        key={option.role}
                        icon={option.icon as any}
                        label={x[option.labelKey]}
                        selected={role === option.role}
                        onPress={() => setRole(option.role)}
                      />
                    ))}
                  </View>
                </Field>
              </>
            ) : null}

            <Field label={x.authEmail} isRtl={isRtl}>
              <TextInput
                style={[styles.input, isRtl && rtlStyles.rtlText]}
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
                  style={[styles.input, isRtl && rtlStyles.rtlText]}
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
              <View style={[styles.errorBox, isRtl && rtlStyles.rtlRow]}>
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
    </ModalSheet>
  );
};

const Field: React.FC<{ label: string; isRtl: boolean; children: React.ReactNode }> = ({
  label,
  isRtl,
  children,
}) => (
  <View style={styles.field}>
    <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  // Auth sheet is taller and more padded than the default ModalSheet chrome.
  sheet: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    maxHeight: '92%',
  },
  header: { marginBottom: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brandTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
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
    marginBottom: spacing.xs,
  },
  input: formInput,
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
});
