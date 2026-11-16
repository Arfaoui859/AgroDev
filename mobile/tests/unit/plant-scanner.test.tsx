import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { PlantScanner } from '../../src/components/scanner/PlantScanner';
import { DiseaseDiagnosisResult } from '../../src/types';

// Camera permission is granted by default so the capture UI renders; individual
// tests flip `granted` to exercise the denied branch.
const mockPermission = { granted: true, status: 'granted', canAskAgain: true, expires: 'never' as const };
const mockRequestPermission = jest.fn(async () => mockPermission);
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [mockPermission, mockRequestPermission],
}));

const mockRequestMediaLibraryPermissions = jest.fn(async () => ({ granted: true }));
const mockLaunchImageLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestMediaLibraryPermissions(),
  launchImageLibraryAsync: () => mockLaunchImageLibrary(),
}));

// Skip the real downscale/re-encode; return the picked URI untouched.
jest.mock('../../src/utils/image', () => ({
  prepareImageForUpload: jest.fn(async (uri: string) => ({
    uri,
    mimeType: 'image/jpeg',
    fileName: 'plant_test.jpg',
  })),
}));

const result: DiseaseDiagnosisResult = {
  id: 'd1',
  diseaseName: 'Olive leaf spot',
  diseaseNameAr: 'تبقع أوراق الزيتون',
  confidence: 87,
  severity: 'medium',
  descriptionAr: 'وصف',
  symptoms: ['spots'],
  treatment: ['apply copper'],
  prevention: ['prune'],
  meta: { provenance: 'vision-model', isRealData: false, source: 'test-model' },
  processedAt: '2026-01-01T00:00:00.000Z',
};

const renderScanner = (onSubmit: jest.Mock, onClose = jest.fn()) =>
  render(
    <LanguageProvider>
      <PlantScanner onSubmit={onSubmit} onClose={onClose}
        cropOptions={[{ id: 'olive', label: 'Olive' }]} selectedCrop="olive" onSelectCrop={jest.fn()}
        partOptions={[{ id: 'leaf', label: 'Leaf' }]} selectedPart="leaf" onSelectPart={jest.fn()}
        cropTitle="Crop" partTitle="Affected part" />
    </LanguageProvider>,
  );

describe('PlantScanner camera/gallery workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermission.granted = true;
    mockRequestMediaLibraryPermissions.mockResolvedValue({ granted: true });
  });

  it('picks from the gallery, reviews, and renders the real diagnosis', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(async () => ({ data: result, error: null, unavailable: false }));
    mockLaunchImageLibrary.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///gallery/leaf.jpg' }] });

    await renderScanner(onSubmit);

    await user.press(screen.getByTestId('scanner-gallery'));
    await waitFor(() => expect(screen.getByText('مراجعة صورة النبات')).toBeTruthy());

    await user.press(screen.getByText('تأكيد وتحليل بالذكاء الاصطناعي'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      uri: 'file:///gallery/leaf.jpg',
      mimeType: 'image/jpeg',
      fileName: 'plant_test.jpg',
    });

    // The honest result (localised name, confidence, provenance badge) is shown.
    await waitFor(() => expect(screen.getByText('تبقع أوراق الزيتون')).toBeTruthy());
    expect(screen.getByText(/87/)).toBeTruthy();
    expect(screen.getByText('نموذج رؤية')).toBeTruthy();
  });

  it('shows an honest unavailable state when the vision back-end is not configured', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(async () => ({ data: null, error: 'not configured', unavailable: true }));
    mockLaunchImageLibrary.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///gallery/leaf.jpg' }] });

    await renderScanner(onSubmit);
    await user.press(screen.getByTestId('scanner-gallery'));
    await waitFor(() => expect(screen.getByText('مراجعة صورة النبات')).toBeTruthy());
    await user.press(screen.getByText('تأكيد وتحليل بالذكاء الاصطناعي'));

    await waitFor(() => expect(screen.getByText('خدمة تحليل الصور غير مُهيّأة')).toBeTruthy());
    // No fabricated diagnosis is rendered.
    expect(screen.queryByText('تبقع أوراق الزيتون')).toBeNull();
  });

  it('does not open the gallery when media-library permission is denied, and says so', async () => {
    const user = userEvent.setup();
    mockRequestMediaLibraryPermissions.mockResolvedValue({ granted: false });
    const onSubmit = jest.fn();

    await renderScanner(onSubmit);
    await user.press(screen.getByTestId('scanner-gallery'));

    await waitFor(() => expect(mockRequestMediaLibraryPermissions).toHaveBeenCalled());
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    // The denial is surfaced on the capture screen, not silently dropped.
    expect(screen.getByText('يرجى منح إذن الوصول إلى معرض الصور')).toBeTruthy();
  });

  it('offers a gallery fallback when camera permission is denied', async () => {
    mockPermission.granted = false;
    const onSubmit = jest.fn();
    await renderScanner(onSubmit);

    await waitFor(() => expect(screen.getByText('منح إذن الكاميرا')).toBeTruthy());
    expect(screen.getByText('اختيار من المعرض')).toBeTruthy();
  });
});
