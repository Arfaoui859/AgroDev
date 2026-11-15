import { StyleSheet } from 'react-native';

/**
 * Direction helpers shared by every screen.
 *
 * The app flips direction at runtime with `row-reverse` / `textAlign` instead of
 * `I18nManager.forceRTL` (see LanguageContext), so almost every file needs these
 * two rules. They live here so there is a single definition to change.
 *
 * Apply `rtlRow` to a `flexDirection: 'row'` container and `rtlText` to a
 * `Text` style when the language is right-to-left.
 */
export const rtlStyles = StyleSheet.create({
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
