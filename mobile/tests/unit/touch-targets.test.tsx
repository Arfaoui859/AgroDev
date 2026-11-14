import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/ui/Header';
import { StateView } from '../../src/components/ui/StateView';
import { Card } from '../../src/components/ui/Card';
import { BottomTabBar } from '../../src/components/ui/BottomTabBar';

// The header reads the signed-in role; only that hook is stubbed.
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'farmer' } }),
}));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

/** Wrap children in the providers the shared controls require. */
const wrap = (children: React.ReactNode) =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LanguageProvider>{children}</LanguageProvider>
    </SafeAreaProvider>,
  );

/**
 * Mobile accessibility floor: every primary interactive control must offer a
 * touch target of at least 48dp. These guard the shared controls (buttons,
 * header language pill, retry control, pressable card, tab bar), which
 * previously rendered below 48dp in places.
 */
describe('touch targets', () => {
  const renderButton = (size: 'sm' | 'md' | 'lg') =>
    wrap(<Button title="Action" onPress={() => {}} size={size} />);

  it.each(['sm', 'md', 'lg'] as const)('renders the %s button at >= 48dp', async (size) => {
    await renderButton(size);
    const style = screen.getByRole('button').props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('renders the header language pill at >= 48dp', async () => {
    await wrap(<Header title="Test" />);
    const pill = screen.getByRole('button', { name: 'لغة التطبيق' });
    const style = pill.props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
  });

  it('renders the state-view retry control at >= 48dp', async () => {
    await wrap(<StateView kind="error" title="Oops" onRetry={() => {}} />);
    const style = screen.getByRole('button').props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('renders a pressable card at >= 48dp', async () => {
    await wrap(
      <Card onPress={() => {}} accessibilityLabel="Pressable card">
        {null}
      </Card>,
    );
    const style = screen.getByRole('button', { name: 'Pressable card' }).props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('renders every bottom tab item at >= 48dp', async () => {
    await wrap(<BottomTabBar activeTab="home" onTabChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(5);
    for (const tab of tabs) {
      const style = Array.isArray(tab.props.style)
        ? Object.assign({}, ...tab.props.style.filter(Boolean))
        : tab.props.style;
      expect(style.minHeight).toBeGreaterThanOrEqual(48);
    }
  });

  it('declares no interactive control with a hard-coded inline size below 48dp', () => {
    // Runtime tests only cover the shared controls that happen to be rendered.
    // This static scan catches a small inline width/height written directly on
    // any Touchable/Pressable across the whole app, which is exactly the kind
    // of regression that slips past component-level tests.
    const srcRoot = path.join(__dirname, '..', '..', 'src');
    const files = [
      ...walk(srcRoot),
      path.join(__dirname, '..', '..', 'App.tsx'),
    ];

    const offenders: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/<(TouchableOpacity|Pressable)\b/g)) {
        const tag = readOpeningTag(text, match.index ?? 0);
        if (!tag || tag.includes('hitSlop')) continue;
        const sizes = [...tag.matchAll(/\b(?:width|height|minWidth|minHeight)\s*[:=]\s*\{?\s*(\d+)\b/g)];
        const smallest = sizes.reduce((min, m) => Math.min(min, Number(m[1])), Infinity);
        if (smallest < 48) {
          const line = text.slice(0, match.index).split('\n').length;
          offenders.push(`${path.relative(srcRoot, file)}:${line} ${match[1]} -> ${smallest}dp`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Read a JSX opening tag from `start`, honouring brace depth so `>` inside
 *  `{...}` expressions does not end the tag early. */
function readOpeningTag(text: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) return text.slice(start, i + 1);
  }
  return null;
}
