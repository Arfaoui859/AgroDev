/**
 * Curated agricultural learning videos.
 *
 * Every entry below is a real, publicly available YouTube video whose id,
 * title, channel and duration were verified against the YouTube oEmbed / watch
 * pages before being committed. Nothing here is generated: titles and channel
 * names are reproduced verbatim (including the publisher's own emoji) so the
 * user can confirm the source.
 *
 * This is a static editorial selection, not a live feed — it never claims to be
 * personalised or up to date. Thumbnails are served from YouTube's public
 * `i.ytimg.com` CDN; playback always opens on youtube.com so the platform's
 * terms of service apply and no video is re-hosted.
 */

export type VideoCategory =
  | 'pruning'
  | 'irrigation'
  | 'soil-prep'
  | 'composting'
  | 'plant-protection'
  | 'vegetable-growing'
  | 'livestock'
  | 'greenhouse'
  | 'harvest';

export type VideoLanguage = 'ar' | 'en';

export interface LearningVideo {
  /** YouTube video id — used for the thumbnail and the watch link. */
  id: string;
  /** Publisher's own title, verbatim. Never translated. */
  title: string;
  /** Publisher's channel name, verbatim. */
  channel: string;
  /** Duration in seconds, as reported by YouTube. */
  durationSeconds: number;
  category: VideoCategory;
  /** Language the video is spoken in. */
  language: VideoLanguage;
}

/** Thumbnail URL for a video id (YouTube's public image CDN). */
export function videoThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Canonical watch URL — playback happens on YouTube, never in-app. */
export function videoWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  'pruning',
  'irrigation',
  'soil-prep',
  'composting',
  'plant-protection',
  'vegetable-growing',
  'livestock',
  'greenhouse',
  'harvest',
];

export const LEARNING_VIDEOS: LearningVideo[] = [
  {
    id: 'pTE29_FkEX4',
    title: 'How to prune an olive tree: the complete professional guide',
    channel: 'ColtivoBio',
    durationSeconds: 1350,
    category: 'pruning',
    language: 'en',
  },
  {
    id: '1Ih9cEr0w8s',
    title: 'Olive Tree Pruning Guide | How We Prune for the Next Generation',
    channel: 'Artisan Epic Garden',
    durationSeconds: 162,
    category: 'pruning',
    language: 'en',
  },
  {
    id: '2JvOW0GZf0E',
    title: '40 Years of Pruning: Why I Stopped Following the Books',
    channel: 'The Gardening Standard',
    durationSeconds: 822,
    category: 'pruning',
    language: 'en',
  },
  {
    id: '19Kz-snPZSQ',
    title: 'The basics of pruning a grapevine part 1: Introduction to pruning',
    channel: 'The_AWRI',
    durationSeconds: 288,
    category: 'pruning',
    language: 'en',
  },
  {
    id: '3E2glkdyPxw',
    title: 'تقليم شجرة الزيتون خطوة بخطوة 🫒',
    channel: 'مختصر الزراعة - Agri Brief',
    durationSeconds: 613,
    category: 'pruning',
    language: 'ar',
  },
  {
    id: '-y6KSrhVAMA',
    title: 'طريقة التقليم الصحيحة لشجرة الزيتون',
    channel: 'شتلة وحرفة',
    durationSeconds: 487,
    category: 'pruning',
    language: 'ar',
  },
  {
    id: '2nrGBAtuBLU',
    title: 'أفضل كمبوست و تقليم أشجار الزيتون من سرابيوم صحراوي.',
    channel: 'إستشاري زراعي أحمد أسامة علوان',
    durationSeconds: 33,
    category: 'pruning',
    language: 'ar',
  },
  {
    id: '-YDnX9dA2a8',
    title: 'What is Drip Irrigation?',
    channel: 'Drip Depot',
    durationSeconds: 91,
    category: 'irrigation',
    language: 'en',
  },
  {
    id: '0Wh8nLEPFFk',
    title: 'Rain Bird Drip Line Setup | Must-Have Parts for Drip Irrigation',
    channel: 'Big Frog Supply',
    durationSeconds: 18,
    category: 'irrigation',
    language: 'en',
  },
  {
    id: '-4hTc8-c9kY',
    title: 'تركيب شبكة ري ، الري الذكي . ري بالتنقيط ، شبكة الري بالتقطير',
    channel: 'Q8organic',
    durationSeconds: 44,
    category: 'irrigation',
    language: 'ar',
  },
  {
    id: '77kQPIx-sIQ',
    title: 'Testing Soil Texture - Mason Jar Soil Test',
    channel: 'Growit Buildit',
    durationSeconds: 549,
    category: 'soil-prep',
    language: 'en',
  },
  {
    id: '10B3OLinEjg',
    title: 'Understanding Soil pH | Secrets to Thriving Plants',
    channel: 'AgXplore',
    durationSeconds: 48,
    category: 'soil-prep',
    language: 'en',
  },
  {
    id: '-yxU3wq1Nzc',
    title: 'كيفية تجهيز الارض الجديده او القديمه لزراعة جميع انواع الخضروات العضويه',
    channel: 'المزرعة السعيدة مهندس / محمد طه',
    durationSeconds: 497,
    category: 'soil-prep',
    language: 'ar',
  },
  {
    id: '-Zw1NDa5T9w',
    title: 'أتعرف كيفية تجهيز أرضك لزراعة الطماطم',
    channel: 'BASF Agricultural Solutions (EG)',
    durationSeconds: 138,
    category: 'soil-prep',
    language: 'ar',
  },
  {
    id: '0MdwKhDF5bE',
    title: 'How to get started with composting',
    channel: 'Maze Products',
    durationSeconds: 97,
    category: 'composting',
    language: 'en',
  },
  {
    id: '05jD_WvsZb0',
    title:
      'أصنع سماد منشط لنمو الاشجار في أسرع وقت🌳 ... The best fertilizer to stimulate the growth of trees🌴🌳',
    channel: 'نصائح زراعية agricultural advice',
    durationSeconds: 261,
    category: 'composting',
    language: 'ar',
  },
  {
    id: '-4zznSRAE_U',
    title: 'Integrated Pest Management',
    channel: 'Learning Agri with AL',
    durationSeconds: 2117,
    category: 'plant-protection',
    language: 'en',
  },
  {
    id: '02Mx7s8gIig',
    title: 'GCSE Biology Revision "Plant diseases 2" (Triple)',
    channel: 'Freesciencelessons',
    durationSeconds: 163,
    category: 'plant-protection',
    language: 'en',
  },
  {
    id: '496lZjgQZ-4',
    title: '9 Tomato Growing Tips (That Actually Work)',
    channel: 'Epic Gardening',
    durationSeconds: 777,
    category: 'vegetable-growing',
    language: 'en',
  },
  {
    id: '4xc0jfJJozY',
    title: 'وثائقي | ما مدى أخلاقية واستدامة زراعة الطماطم؟ | وثائقية دي دبليو',
    channel: 'DW Documentary وثائقية دي دبليو',
    durationSeconds: 1556,
    category: 'vegetable-growing',
    language: 'ar',
  },
  {
    id: '0eNuqjwmZmY',
    title: 'Modernizing Calf Feeding Techniques',
    channel: 'Cow Factory',
    durationSeconds: 10,
    category: 'livestock',
    language: 'en',
  },
  {
    id: '2YjpwVO6MOg',
    title: 'تربية الأغنام بدون رعي',
    channel: 'مزرعة الخليل -Ferme Elkhalil',
    durationSeconds: 282,
    category: 'livestock',
    language: 'ar',
  },
  {
    id: '00iezLcDWdA',
    title: 'ابقار الهولشتاين',
    channel: 'زاوية الحيوانات',
    durationSeconds: 15,
    category: 'livestock',
    language: 'ar',
  },
  {
    id: '-J44Ips4krI',
    title: 'How to Build a Greenhouse on Uneven Ground',
    channel: 'Rimol Greenhouse Systems',
    durationSeconds: 148,
    category: 'greenhouse',
    language: 'en',
  },
  {
    id: '-hpd2YdqIHg',
    title: 'How to frame a pallet Greenhouse #dirtbag #pallet #greenhouse #diy',
    channel: 'Dirtbag America',
    durationSeconds: 94,
    category: 'greenhouse',
    language: 'en',
  },
  {
    id: '07j-GO-i-7g',
    title: 'This Combine Harvester Unloads 10 Tons of Wheat in Just 60 Seconds!',
    channel: 'ARKANAKA',
    durationSeconds: 34,
    category: 'harvest',
    language: 'en',
  },
];

/**
 * Pick a small, language-aware, category-diverse set for the Home carousel:
 * prefer videos in the caller's language, then fill with the rest so the strip
 * is never empty for a French/English reader.
 */
export function featuredVideos(language: string, limit = 8): LearningVideo[] {
  const preferred: VideoLanguage = language === 'ar' ? 'ar' : 'en';
  const inLanguage = LEARNING_VIDEOS.filter((v) => v.language === preferred);
  const others = LEARNING_VIDEOS.filter((v) => v.language !== preferred);

  // De-duplicate by category so the strip shows variety before depth.
  const seen = new Set<VideoCategory>();
  const diverse: LearningVideo[] = [];
  for (const video of [...inLanguage, ...others]) {
    if (diverse.length >= limit) break;
    if (seen.has(video.category) && diverse.length < Math.min(limit, VIDEO_CATEGORIES.length)) {
      continue;
    }
    seen.add(video.category);
    diverse.push(video);
  }
  return diverse.slice(0, limit);
}
