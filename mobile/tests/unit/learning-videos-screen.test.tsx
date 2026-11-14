import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { LearningVideosScreen } from '../../src/screens/services/LearningVideosScreen';

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

const renderScreen = () =>
  render(
    <LanguageProvider>
      <LearningVideosScreen onBack={jest.fn()} />
    </LanguageProvider>,
  );

describe('LearningVideosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists curated videos with the publisher title and a YouTube affordance', async () => {
    await renderScreen();
    expect(screen.getByText('تقليم شجرة الزيتون خطوة بخطوة 🫒')).toBeTruthy();
    expect(screen.getByText('المصدر: يوتيوب')).toBeTruthy();
  });

  it('opens the video on youtube.com rather than in-app', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('تقليم شجرة الزيتون خطوة بخطوة 🫒'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=3E2glkdyPxw');
  });

  it('filters the catalogue by category', async () => {
    await renderScreen();
    // Switch to the livestock category; an olive-pruning title must disappear.
    // The label appears on the filter pill (first) and on matching cards, so
    // press the pill.
    fireEvent.press(screen.getAllByText('تربية المواشي')[0]);
    await waitFor(() =>
      expect(screen.queryByText('تقليم شجرة الزيتون خطوة بخطوة 🫒')).toBeNull(),
    );
  });
});
