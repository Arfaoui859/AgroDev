import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../../theme/colors';

interface IconTileProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Icon glyph colour. */
  color: string;
  /** Tile background colour (usually the tinted `…Light` variant of `color`). */
  bg: string;
  /** Icon glyph size; defaults to 26. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A 46×46 rounded tile that holds a single tinted icon. The Home season card
 * and academy card and the Services list each rendered this identical square
 * inline; only the icon and its colours vary, so those are the only inputs.
 */
export const IconTile: React.FC<IconTileProps> = ({ icon, color, bg, size = 26, style }) => (
  <View style={[styles.tile, { backgroundColor: bg }, style]}>
    <MaterialCommunityIcons name={icon} size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  tile: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
