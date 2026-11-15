import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme/colors';

/**
 * The AgriVibe emblem (bronze/copper disc with the green leaf-and-circuit
 * identity). Rendered from the same derived asset that ships as the app icon,
 * so the in-app mark and the launcher icon can never drift apart.
 *
 * `plain` renders the emblem on its own; the default adds the brand-green
 * tile that the launcher icon uses, which keeps the mark legible on the app's
 * light surfaces.
 */
interface BrandMarkProps {
  size?: number;
  plain?: boolean;
  style?: StyleProp<ViewStyle>;
}

const MARK = require('../../../assets/brand/agrivibe-mark.png');

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 40, plain = false, style }) => {
  const image: StyleProp<ImageStyle> = { width: size, height: size, resizeMode: 'contain' };
  if (plain) {
    return <Image source={MARK} style={[image, style as StyleProp<ImageStyle>]} accessible accessibilityRole="image" />;
  }
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.28 },
        style,
      ]}
    >
      <Image source={MARK} style={[image, { width: size * 0.82, height: size * 0.82 }]} accessible accessibilityRole="image" />
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDeep,
    borderRadius: radius.md,
  },
});
