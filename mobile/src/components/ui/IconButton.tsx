import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { roundIconButton } from '../../theme/layout';

interface IconButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  /** Screen-reader label; icon-only buttons have no visible text. */
  accessibilityLabel: string;
  /** Icon glyph size; defaults to 20. */
  size?: number;
  /** Icon colour; defaults to the primary text colour. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}

/**
 * A circular, icon-only control on a subtle surface. Every such button (header
 * back/notifications, modal close) is a ≥48dp touch target with the same
 * chrome, so the size and shape live here and only the glyph and handler vary.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  color = colors.text,
  style,
  activeOpacity = 0.8,
}) => (
  <TouchableOpacity
    activeOpacity={activeOpacity}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={[styles.button, style]}
  >
    <MaterialCommunityIcons name={icon} size={size} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: roundIconButton,
});
