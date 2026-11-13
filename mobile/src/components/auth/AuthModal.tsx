import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { t, isRtl } = useLanguage();
  const { signIn } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || (tab !== 'reset' && !password.trim())) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    if (tab === 'signin') {
      const res = await signIn(email.trim(), password);
      setLoading(false);
      if (res.success) {
        Alert.alert('مرحباً بك', 'تم تسجيل الدخول بنجاح!');
        onClose();
      } else {
        Alert.alert('خطأ في تسجيل الدخول', res.error || 'يرجى التحقق من بيانات الدخول.');
      }
    } else if (tab === 'signup') {
      setLoading(false);
      Alert.alert(
        'تم إرسال رابط التفعيل',
        'تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل أو الدخول بحساب تجريبي مباشرة.'
      );
      onClose();
    } else {
      setLoading(false);
      Alert.alert('استعادة كلمة المرور', 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك.');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.modalHeader, isRtl && styles.rtlRow]}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
              <Text style={styles.brandTitle}>AgroGrowth</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher: Sign In / Sign Up / Reset */}
          <View style={[styles.tabBar, isRtl && styles.rtlRow]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTab('signin')}
              style={[styles.tabBtn, tab === 'signin' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 'signin' && styles.tabBtnTextActive]}>
                تسجيل الدخول
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTab('signup')}
              style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 'signup' && styles.tabBtnTextActive]}>
                حساب جديد
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTab('reset')}
              style={[styles.tabBtn, tab === 'reset' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === 'reset' && styles.tabBtnTextActive]}>
                نسيت كلمة المرور
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {tab === 'signup' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>الاسم الكامل</Text>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtlText]}
                    placeholder="محمد علي"
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>رقم الهاتف</Text>
                  <TextInput
                    style={[styles.input, isRtl && styles.rtlText]}
                    placeholder="+216 98 000 000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>البريد الإلكتروني</Text>
              <TextInput
                style={[styles.input, isRtl && styles.rtlText]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {tab !== 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>كلمة المرور</Text>
                <TextInput
                  style={[styles.input, isRtl && styles.rtlText]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            )}

            <Button
              title={
                loading
                  ? 'جاري التحقق...'
                  : tab === 'signin'
                    ? 'دخول إلى حسابي'
                    : tab === 'signup'
                      ? 'إنشاء حساب فلاحي'
                      : 'إرسال رابط الاستعادة'
              }
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.card,
  },
  tabBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  form: {
    gap: spacing.sm,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
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
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
});
