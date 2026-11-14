import {
  LEARNING_VIDEOS,
  VIDEO_CATEGORIES,
  featuredVideos,
  videoThumbnailUrl,
  videoWatchUrl,
} from '../../src/data/agriculturalVideos';

describe('curated agricultural videos', () => {
  it('contains only well-formed, unique entries', () => {
    const ids = new Set<string>();
    for (const video of LEARNING_VIDEOS) {
      expect(video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(ids.has(video.id)).toBe(false);
      ids.add(video.id);
      expect(video.title.trim().length).toBeGreaterThan(0);
      expect(video.channel.trim().length).toBeGreaterThan(0);
      expect(video.durationSeconds).toBeGreaterThan(0);
      expect(VIDEO_CATEGORIES).toContain(video.category);
      expect(['ar', 'en']).toContain(video.language);
    }
    expect(LEARNING_VIDEOS.length).toBeGreaterThanOrEqual(20);
  });

  it('covers every declared category at least once', () => {
    for (const category of VIDEO_CATEGORIES) {
      expect(LEARNING_VIDEOS.some((v) => v.category === category)).toBe(true);
    }
  });

  it('builds the public YouTube URLs from the id', () => {
    expect(videoThumbnailUrl('pTE29_FkEX4')).toBe('https://i.ytimg.com/vi/pTE29_FkEX4/hqdefault.jpg');
    expect(videoWatchUrl('pTE29_FkEX4')).toBe('https://www.youtube.com/watch?v=pTE29_FkEX4');
  });

  describe('featuredVideos', () => {
    it('prefers the caller language and returns a category-diverse, bounded set', () => {
      const ar = featuredVideos('ar', 8);
      expect(ar.length).toBe(8);
      expect(ar[0].language).toBe('ar');
      // De-duplication: no category repeats while unused categories remain.
      const categories = ar.map((v) => v.category);
      expect(new Set(categories).size).toBeGreaterThanOrEqual(6);

      const en = featuredVideos('en', 8);
      expect(en[0].language).toBe('en');
    });

    it('never returns an empty strip for a language with no native videos', () => {
      const fr = featuredVideos('fr', 6);
      expect(fr.length).toBe(6);
    });

    it('honours the limit', () => {
      expect(featuredVideos('en', 3)).toHaveLength(3);
    });
  });
});
