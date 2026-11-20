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
import { rowGapXs, rowWrapSm, stackSm } from '../../theme/layout';
import { fieldLabel, labelMedium, primaryBoldText, subtitleMetaBase, subtleCaption, titleLg, titleXl } from '../../theme/typographyStyles';
import { formInput } from '../../theme/formStyles';
import { useLanguage } from '../../context/LanguageContext';
import { BrandMark } from '../ui/BrandMark';
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

// Errors that mean the request never produced a usable answer from Supabase
// Auth: no connectivity, a timeout, or a rejected project key. Anything else is
// a real server response (bad credentials, unconfirmed email, …).
const AUTH_TRANSPORT_ERROR_RE =
  /network request failed|failed to fetch|fetch failed|network ?error|timed? ?out|timeout|econn\w*|enotfound|dns|socket|offline|unreachable|invalid api key/i;

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
  const { t, x, isRtl } = useLanguage();
  const { signIn, signUp, resetPassword, resendConfirmation, isLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const reset = () => {
    setError(null);
    setPassword('');
  };

  // Only a transport-level failure (or a backend that rejects the app's public
  // key) is reported as an unreachable account service. A credential error must
  // reach the user unchanged: labelling every failure a connection problem made
  // a wrong password look like an outage.
  const describeAuthError = (message: string | undefined) => {
    const text = (message ?? '').trim();
    if (!text || AUTH_TRANSPORT_ERROR_RE.test(text)) return x.authErrUnreachable;
    return text;
  };

  const handleSubmit = async () => {
    setError(null);
    setShowResend(false);
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
      } else if (res.needsConfirmation) {
        setError(x.authErrEmailNotConfirmed);
        setShowResend(true);
      } else {
        setError(describeAuthError(res.error));
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
        setError(describeAuthError(res.error));
      }
    } else {
      const res = await resetPassword(trimmedEmail);
      if (res.success) {
        Alert.alert(x.authResetSentTitle, x.authResetSentBody);
        setTab('signin');
      } else {
        setError(describeAuthError(res.error));
      }
    }
  };

  const handleResend = async () => {
    const res = await resendConfirmation(email.trim());
    if (res.success) {
      Alert.alert(x.authConfirmTitle, x.authResendSent);
      setShowResend(false);
    } else {
      setError(describeAuthError(res.error));
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
          <BrandMark size={32} plain />
          <Text style={styles.brandTitle}>{t.appName}</Text>
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
                  setShowResend(false);
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

            {showResend ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleResend}
                style={styles.resendButton}
                accessibilityRole="button"
                accessibilityLabel={x.authResendConfirmation}
              >
                <Text style={styles.resendText}>{x.authResendConfirmation}</Text>
              </TouchableOpacity>
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
  header: stackSm,
  brandRow: rowGapXs,
  brandTitle: titleLg,
  title: titleXl,
  subtitle: subtitleMetaBase,
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
  tabText: labelMedium,
  tabTextActive: primaryBoldText,
  field: stackSm,
  label: fieldLabel,
  input: formInput,
  roleGrid: rowWrapSm,
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
  resendButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: spacing.xs },
  resendText: {
    ...primaryBoldText,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  switchRow: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: spacing.md },
  switchText: subtleCaption,
  switchLink: primaryBoldText,
});
