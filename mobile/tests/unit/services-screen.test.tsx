import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ServicesScreen } from '../../src/screens/ServicesScreen';

const renderScreen = (onSelectService = jest.fn()) =>
  render(
    <LanguageProvider>
      <ServicesScreen onSelectService={onSelectService} />
    </LanguageProvider>,
  );

describe('ServicesScreen', () => {
  it('lists services for the default Arabic UI', async () => {
    await renderScreen();
    expect(screen.getByText('تحليل التربة والتسميد')).toBeTruthy();
    expect(screen.getByText('كاشف أمراض النبات بالصورة')).toBeTruthy();
  });

  it('shows an honest empty state when the search matches nothing', async () => {
    await renderScreen();
    const input = screen.getByPlaceholderText('ابحث عن خدمة، تشخيص، أو تحليل...');
    fireEvent.changeText(input, 'zzzz-not-a-service');
    await waitFor(() => expect(screen.getByText('لا توجد بيانات لعرضها')).toBeTruthy());
  });

  it('opens a service when its card is pressed', async () => {
    const onSelect = jest.fn();
    await renderScreen(onSelect);
    fireEvent.press(screen.getByText('تحليل التربة والتسميد'));
    expect(onSelect).toHaveBeenCalledWith('soil');
  });

  it('exposes the curated learning-videos catalogue as a service', async () => {
    const onSelect = jest.fn();
    await renderScreen(onSelect);
    fireEvent.press(screen.getByText('تعلّم من الميدان'));
    expect(onSelect).toHaveBeenCalledWith('learning');
  });

  it('exposes the agricultural-projects tracker as a service', async () => {
    const onSelect = jest.fn();
    await renderScreen(onSelect);
    fireEvent.press(screen.getByText('مشاريعي الزراعية'));
    expect(onSelect).toHaveBeenCalledWith('projects');
  });
});
