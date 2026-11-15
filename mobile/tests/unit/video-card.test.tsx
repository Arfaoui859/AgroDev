import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { VideoCard } from '../../src/components/ui/VideoCard';
import { LearningVideo } from '../../src/data/agriculturalVideos';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

const video: LearningVideo = {
  id: '3E2glkdyPxw',
  title: 'تقليم شجرة الزيتون خطوة بخطوة',
  channel: 'مختصر الزراعة - Agri Brief',
  durationSeconds: 600,
  category: 'pruning',
  language: 'ar',
};

/**
 * VideoCard renders a curated YouTube video. Its publisher's title and channel
 * must appear verbatim (never translated), and pressing it must call back so the
 * caller opens youtube.com — the card itself never embeds playback.
 */
describe('VideoCard', () => {
  it('shows the verbatim title and channel', async () => {
    await wrap(<VideoCard video={video} onPress={jest.fn()} />);
    expect(screen.getByText('تقليم شجرة الزيتون خطوة بخطوة')).toBeTruthy();
    expect(screen.getByText('مختصر الزراعة - Agri Brief')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await wrap(<VideoCard video={video} variant="strip" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
