/**
 * AgriVibe brand contract.
 *
 * The identity is user-facing, so it is pinned here: the display name and
 * tagline in every locale, the Expo app config (name, slug, scheme, package
 * ids and icon/splash wiring), and the on-disk brand assets. A rename that
 * misses one locale or one config key fails this suite instead of shipping a
 * half-rebranded app.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getTranslations } from '../../src/i18n';

const MOBILE_ROOT = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(MOBILE_ROOT, 'assets');

const readAppJson = () => JSON.parse(fs.readFileSync(path.join(MOBILE_ROOT, 'app.json'), 'utf8'));
const readPngSize = (file: string) => {
  const buf = fs.readFileSync(file);
  // PNG IHDR: width/height are big-endian uint32 at offsets 16 and 20.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

describe('AgriVibe brand identity', () => {
  it('uses the AgriVibe name and the official tagline in all three locales', () => {
    expect(getTranslations('ar').appName).toBe('AgriVibe');
    expect(getTranslations('fr').appName).toBe('AgriVibe');
    expect(getTranslations('en').appName).toBe('AgriVibe');

    expect(getTranslations('ar').tagline).toBe('الذكاء وراء الزراعة');
    expect(getTranslations('fr').tagline).toBe('L’intelligence derrière l’agriculture');
    expect(getTranslations('en').tagline).toBe('The Intelligence Behind Agriculture');
  });

  it('no longer ships the previous product name in any locale string', () => {
    for (const lang of ['ar', 'fr', 'en'] as const) {
      const values = Object.values(getTranslations(lang)).join(' ');
      expect(values).not.toMatch(/AgroGrowth/);
    }
  });
});

describe('Expo branding configuration', () => {
  const expo = readAppJson().expo;

  it('carries the AgriVibe name, slug and deep-link scheme', () => {
    expect(expo.name).toBe('AgriVibe');
    expect(expo.slug).toBe('agrivibe-mobile');
    expect(expo.scheme).toBe('agrivibe');
  });

  it('carries the AgriVibe platform identifiers', () => {
    expect(expo.ios.bundleIdentifier).toBe('tn.agrivibe.mobile');
    expect(expo.android.package).toBe('tn.agrivibe.mobile');
  });

  it('wires the AgriVibe icon, adaptive icon and splash assets', () => {
    expect(expo.icon).toBe('./assets/icon.png');
    expect(expo.android.adaptiveIcon.foregroundImage).toBe('./assets/android-icon-foreground.png');
    expect(expo.android.adaptiveIcon.monochromeImage).toBe('./assets/android-icon-monochrome.png');
    expect(expo.web.favicon).toBe('./assets/favicon.png');
    const splash = expo.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen',
    ) as [string, { image: string }];
    expect(splash[1].image).toBe('./assets/splash-icon.png');
  });
});

describe('Brand assets on disk', () => {
  it('ships a square 1024px app icon', () => {
    expect(readPngSize(path.join(ASSETS, 'icon.png'))).toEqual({ width: 1024, height: 1024 });
  });

  it('ships square adaptive-icon layers at 1024px', () => {
    for (const file of [
      'android-icon-foreground.png',
      'android-icon-background.png',
      'android-icon-monochrome.png',
    ]) {
      expect(readPngSize(path.join(ASSETS, file))).toEqual({ width: 1024, height: 1024 });
    }
  });

  it('ships the reusable in-app brand mark', () => {
    const mark = path.join(ASSETS, 'brand', 'agrivibe-mark.png');
    expect(fs.existsSync(mark)).toBe(true);
    const { width, height } = readPngSize(mark);
    expect(width).toBe(height);
  });
});
