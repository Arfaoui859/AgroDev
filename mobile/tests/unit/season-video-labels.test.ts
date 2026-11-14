import { seasonForMonth, seasonLabel, seasonTip } from '../../src/utils/season';
import { getExtra } from '../../src/i18n/extra';
import { formatVideoDuration, videoCategoryLabel, videoLanguageLabel } from '../../src/utils/videoLabels';

describe('seasonForMonth', () => {
  it('maps northern-hemisphere months to the four seasons', () => {
    expect(seasonForMonth(11)).toBe('winter');
    expect(seasonForMonth(0)).toBe('winter');
    expect(seasonForMonth(1)).toBe('winter');
    expect(seasonForMonth(2)).toBe('spring');
    expect(seasonForMonth(4)).toBe('spring');
    expect(seasonForMonth(5)).toBe('summer');
    expect(seasonForMonth(7)).toBe('summer');
    expect(seasonForMonth(8)).toBe('autumn');
    expect(seasonForMonth(10)).toBe('autumn');
  });

  it('resolves a non-empty localised label and tip for every season and language', () => {
    for (const language of ['ar', 'fr', 'en'] as const) {
      const x = getExtra(language);
      for (const month of [0, 3, 6, 9]) {
        const season = seasonForMonth(month);
        expect(seasonLabel(season, x).length).toBeGreaterThan(0);
        expect(seasonTip(season, x).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('video labels', () => {
  const x = getExtra('ar');

  it('localises the category chip', () => {
    expect(videoCategoryLabel('pruning', x)).toBe(x.videoCatPruning);
    expect(videoCategoryLabel('livestock', x)).toBe(x.videoCatLivestock);
  });

  it('labels the spoken language without translating the title', () => {
    expect(videoLanguageLabel('ar', x)).toBe(x.videoLanguageArabic);
    expect(videoLanguageLabel('en', x)).toBe(x.videoLanguageEnglish);
  });

  it('formats duration in whole minutes and never reports zero', () => {
    expect(formatVideoDuration(162, x)).toBe(`3 ${x.videoDurationMinutes}`);
    expect(formatVideoDuration(10, x)).toBe(`1 ${x.videoDurationMinutes}`);
    expect(formatVideoDuration(0, x)).toBe(`1 ${x.videoDurationMinutes}`);
    expect(formatVideoDuration(Number.NaN, x)).toBe(`1 ${x.videoDurationMinutes}`);
  });
});
