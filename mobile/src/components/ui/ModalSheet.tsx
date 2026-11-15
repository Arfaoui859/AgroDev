import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing } from '../../theme/colors';
import { flex1 } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { IconButton } from './IconButton';

interface ModalSheetProps {
  visible: boolean;
  /** Dismissal handler; also wired to the Android hardware back button. */
  onClose: () => void;
  /** Header row's leading content (a title block or a brand row). */
  header: React.ReactNode;
  /** Accessible label for the close button. */
  closeLabel: string;
  /** Per-sheet geometry (padding, max height); the chrome itself is shared. */
  sheetStyle?: StyleProp<ViewStyle>;
  /** Per-sheet header spacing; the row itself is shared. */
  headerStyle?: StyleProp<ViewStyle>;
  /** Lift the sheet above the keyboard for form-heavy sheets. */
  keyboardAvoiding?: boolean;
  children: React.ReactNode;
}

/**
 * The bottom-sheet chrome shared by the onboarding persona picker and the auth
 * modal: a scrim overlay, a card sheet with rounded top corners, a header row
 * with a leading slot and a close button. The two sheets differ only in their
 * padding/max-height and their header content, which are parameters here.
 */
export const ModalSheet: React.FC<ModalSheetProps> = ({
  visible,
  onClose,
  header,
  closeLabel,
  sheetStyle,
  headerStyle,
  keyboardAvoiding = false,
  children,
}) => {
  const { isRtl } = useLanguage();

  const overlay = (
    <View style={[styles.overlay, keyboardAvoiding && styles.overlayGrow]}>
      <View style={[styles.sheet, sheetStyle]}>
        <View style={[styles.headerRow, headerStyle, isRtl && rtlStyles.rtlRow]}>
          <View style={styles.headerLeading}>{header}</View>
          <IconButton
            icon="close"
            size={22}
            color={colors.textSecondary}
            onPress={onClose}
            accessibilityLabel={closeLabel}
          />
        </View>
        {children}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          {overlay}
        </KeyboardAvoidingView>
      ) : (
        overlay
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  overlayGrow: flex1,
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeading: flex1,
});
