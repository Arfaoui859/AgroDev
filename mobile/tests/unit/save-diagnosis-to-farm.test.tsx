import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { SaveDiagnosisToFarm } from '../../src/components/projects/SaveDiagnosisToFarm';
import { DiseaseDiagnosisResult } from '../../src/types';

const mockGetFarms = jest.fn();
const mockSave = jest.fn();
jest.mock('../../src/api/client', () => ({
  getFarms: (...args: any[]) => mockGetFarms(...args),
  saveDiseaseDetection: (...args: any[]) => mockSave(...args),
}));

jest.mock('../../src/utils/image', () => ({
  prepareImageForUpload: jest.fn(async (uri: string) => ({ uri, mimeType: 'image/jpeg', fileName: 'plant.jpg' })),
}));

const result: DiseaseDiagnosisResult = {
  id: 'd1',
  diseaseName: 'Olive leaf spot',
  diseaseNameAr: 'تبقع أوراق الزيتون',
  confidence: 87,
  severity: 'medium',
  descriptionAr: 'وصف',
  symptoms: ['spots'],
  treatment: ['copper'],
  prevention: ['prune'],
  meta: { provenance: 'vision-model', isRealData: false, source: 'test' },
  imageUri: 'file:///tmp/leaf.jpg',
  processedAt: '2026-01-01T00:00:00.000Z',
};

const renderCard = () =>
  render(
    <LanguageProvider>
      <SaveDiagnosisToFarm result={result} />
    </LanguageProvider>,
  );

describe('SaveDiagnosisToFarm', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('agrogrowth.language', 'en');
  });

  it('saves the diagnosis to a selected farm and reports success', async () => {
    mockGetFarms.mockResolvedValue({
      data: [
        { id: 'f1', name: 'North Farm', location: 'Tunis', size_hectares: 3 },
        { id: 'f2', name: 'South Farm', location: 'Sfax', size_hectares: 1 },
      ],
      error: null,
      fromCache: false,
      meta: { provenance: 'database', isRealData: false },
    });
    mockSave.mockResolvedValue({ data: { id: 'det1', imageSignedUrl: 'https://x/y.jpg' }, error: null });

    const user = userEvent.setup();
    await renderCard();
    const saveBtn = await screen.findByText('Save to farm record');
    await user.press(saveBtn);

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toMatchObject({
      farmId: 'f1',
      primaryDisease: 'Olive leaf spot',
      confidence: 87,
    });
    expect(await screen.findByText('Diagnosis and image saved to the farm record.')).toBeTruthy();
  });

  it('explains the no-farm case instead of pretending to save', async () => {
    mockGetFarms.mockResolvedValue({ data: [], error: null, fromCache: false, meta: { provenance: 'database', isRealData: false } });
    await renderCard();
    expect(
      await screen.findByText('No farm recorded to save the diagnosis in. Create a farm first.'),
    ).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('surfaces an honest failure without claiming success', async () => {
    mockGetFarms.mockResolvedValue({
      data: [{ id: 'f1', name: 'North Farm', location: 'Tunis', size_hectares: 3 }],
      error: null,
      fromCache: false,
      meta: { provenance: 'database', isRealData: false },
    });
    mockSave.mockResolvedValue({ data: null, error: 'FARM_NOT_FOUND_OR_NOT_OWNED' });

    const user = userEvent.setup();
    await renderCard();
    await user.press(await screen.findByText('Save to farm record'));

    expect(await screen.findByText('FARM_NOT_FOUND_OR_NOT_OWNED')).toBeTruthy();
    expect(screen.queryByText('Diagnosis and image saved to the farm record.')).toBeNull();
  });

  it('always states the diagnosis needs field confirmation', async () => {
    mockGetFarms.mockResolvedValue({ data: [], error: null, fromCache: false, meta: { provenance: 'database', isRealData: false } });
    await renderCard();
    expect(
      await screen.findByText('The visual diagnosis needs field confirmation; saving only records it.'),
    ).toBeTruthy();
  });
});
