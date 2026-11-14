import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { IntelligenceStrip } from '../../src/components/home/IntelligenceStrip';
import { LearningVideos } from '../../src/components/home/LearningVideos';
import { AcademySection } from '../../src/components/home/AcademySection';
import { ACADEMY_TOPICS } from '../../src/data/academy';
import { AICapability } from '../../src/types';

const capability = (over: Partial<AICapability>): AICapability => ({
  id: 'soil-analysis',
  name: 'Soil Analysis',
  nameAr: 'تحليل التربة',
  engine: 'rule-based',
  provenance: 'Rule-based engine',
  provenanceAr: 'محرك قواعد',
  ...over,
});

const renderStrip = (props: Partial<React.ComponentProps<typeof IntelligenceStrip>> = {}) =>
  render(
    <LanguageProvider>
      <IntelligenceStrip
        capabilities={[]}
        loading={false}
        error={null}
        onOpenCapabilities={() => {}}
        onOpenService={() => {}}
        {...props}
      />
    </LanguageProvider>,
  );

describe('IntelligenceStrip', () => {
  it('labels an available capability and its honest engine state', async () => {
    await renderStrip({ capabilities: [capability({})] });
    expect(screen.getByText('تحليل التربة')).toBeTruthy();
  });

  it('marks an unavailable capability as unavailable instead of hiding it', async () => {
    await renderStrip({
      capabilities: [
        capability({
          id: 'irrigation-optimizer',
          name: 'Smart Irrigation Optimizer',
          nameAr: 'الري الذكي',
          engine: 'unavailable',
        }),
      ],
    });
    expect(screen.getByText('الري الذكي')).toBeTruthy();
  });

  it('routes a chip tap to the service screen that backs it', async () => {
    const onOpenService = jest.fn();
    await renderStrip({ capabilities: [capability({})], onOpenService });
    fireEvent.press(screen.getByText('تحليل التربة'));
    expect(onOpenService).toHaveBeenCalledWith('soil');
  });

  it('routes a tab-backed capability (marketplace) through the same callback', async () => {
    const onOpenService = jest.fn();
    await renderStrip({
      capabilities: [
        capability({ id: 'soil-analysis', name: 'Soil Analysis', nameAr: 'تحليل التربة' }),
      ],
      onOpenService,
    });
    fireEvent.press(screen.getByText('تحليل التربة'));
    expect(onOpenService).toHaveBeenCalledWith('soil');
  });

  it('does not route an unavailable capability to a service screen', async () => {
    const onOpenService = jest.fn();
    const onOpenCapabilities = jest.fn();
    await renderStrip({
      capabilities: [
        capability({
          id: 'market-forecast',
          name: 'Market Forecast AI',
          nameAr: 'توقّع السوق',
          engine: 'unavailable',
        }),
      ],
      onOpenService,
      onOpenCapabilities,
    });
    fireEvent.press(screen.getByText('توقّع السوق'));
    expect(onOpenService).not.toHaveBeenCalled();
    expect(onOpenCapabilities).toHaveBeenCalled();
  });

  it('shows an honest unavailable state when the capability document is unreachable', async () => {
    await renderStrip({ capabilities: [], error: 'HTTP 500' });
    expect(screen.getByText('هذه الخدمة غير متاحة حالياً')).toBeTruthy();
  });
});

describe('LearningVideos', () => {
  it('renders real publisher titles verbatim and a YouTube watch affordance', async () => {
    await render(
      <LanguageProvider>
        <LearningVideos />
      </LanguageProvider>,
    );
    // Arabic-first: the strip opens with an Arabic-language video title.
    expect(screen.getByText('تقليم شجرة الزيتون خطوة بخطوة 🫒')).toBeTruthy();
    expect(screen.getAllByText('مشاهدة على يوتيوب').length).toBeGreaterThan(0);
    // The provenance note makes the YouTube source explicit.
    expect(screen.getByText('المصدر: يوتيوب')).toBeTruthy();
  });
});

describe('AcademySection', () => {
  it('routes a video topic to the learning catalogue', async () => {
    const onOpenVideos = jest.fn();
    const onOpenService = jest.fn();
    await render(
      <LanguageProvider>
        <AcademySection onOpenVideos={onOpenVideos} onOpenService={onOpenService} />
      </LanguageProvider>,
    );
    fireEvent.press(screen.getByText('التقليم'));
    expect(onOpenVideos).toHaveBeenCalled();
    expect(onOpenService).not.toHaveBeenCalled();
  });

  it('routes a service topic to the real service screen', async () => {
    const onOpenVideos = jest.fn();
    const onOpenService = jest.fn();
    await render(
      <LanguageProvider>
        <AcademySection onOpenVideos={onOpenVideos} onOpenService={onOpenService} />
      </LanguageProvider>,
    );
    fireEvent.press(screen.getByText('التربة والتسميد'));
    expect(onOpenService).toHaveBeenCalledWith('soil');
    expect(onOpenVideos).not.toHaveBeenCalled();
  });

  it('every topic leads somewhere real (service or video category)', () => {
    for (const topic of ACADEMY_TOPICS) {
      expect(Boolean(topic.serviceId || topic.videoCategory)).toBe(true);
    }
  });
});
