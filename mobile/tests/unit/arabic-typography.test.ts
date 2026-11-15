import * as fs from 'fs';
import * as path from 'path';
import { typography } from '../../src/theme/colors';

/**
 * Arabic typography floor.
 *
 * Arabic script has taller ascenders/descenders than Latin, so every text style
 * must pair its `fontSize` with an explicit `lineHeight` (~1.5×) or glyphs clip
 * and the copy is hard to read. This scans the source for a `fontSize:` that is
 * not followed by a `lineHeight` in the same style block.
 */
const SRC = path.join(__dirname, '..', '..', 'src');
const ROOT = path.join(__dirname, '..', '..');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

// The app entry point (App.tsx) also declares text styles, so it is scanned
// alongside src/ — a `fontSize` there without a paired `lineHeight` clips
// Arabic glyphs just the same.
function sourceFiles(): string[] {
  return [...walk(SRC), path.join(ROOT, 'App.tsx')];
}

describe('Arabic typography', () => {
  it('pairs every fontSize with a lineHeight in the source styles', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      if (file.includes('theme/colors')) continue; // token definitions
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (!line.includes('fontSize:')) return;
        const window = lines.slice(index, index + 5).join('\n');
        if (!window.includes('lineHeight')) {
          offenders.push(`${path.relative(SRC, file)}:${index + 1} ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('exposes line heights that are ~1.5x the paired font size', () => {
    // xs->20, sm->21, base->24, lg->27, xl->30 (see theme/colors.ts)
    const pairs: [keyof typeof typography.lineHeights, keyof typeof typography.fontSizes][] = [
      ['xs', 'xs'],
      ['sm', 'sm'],
      ['base', 'base'],
      ['lg', 'lg'],
      ['xl', 'xl'],
    ];
    for (const [lh, fs] of pairs) {
      const ratio = typography.lineHeights[lh] / typography.fontSizes[fs];
      expect(ratio).toBeGreaterThanOrEqual(1.4);
      expect(ratio).toBeLessThanOrEqual(1.6);
    }
  });
});
