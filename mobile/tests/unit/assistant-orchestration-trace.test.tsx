import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AIAssistantScreen } from '../../src/screens/AIAssistantScreen';
import { OrchestrationTrace } from '../../src/types';

const mockChat = jest.fn();

jest.mock('../../src/api/client', () => ({
  chatWithAIAssistant: (...args: any[]) => mockChat(...args),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AIAssistantScreen />
    </LanguageProvider>,
  );

const trace: OrchestrationTrace = {
  plan: [
    { id: 'crop', title: 'توصيات المحاصيل', dependsOn: [] },
    { id: 'agri_news', title: 'الأخبار الفلاحية', dependsOn: [] },
  ],
  steps: [
    {
      id: 'crop',
      title: 'توصيات المحاصيل',
      status: 'ok',
      findings: ['الطماطم مناسبة لمناخك.'],
      dataSource: 'rule-based',
      isRealData: false,
      confidence: 'low',
      dependsOn: [],
      attempts: 1,
      latencyMs: 3,
    },
    {
      id: 'agri_news',
      title: 'الأخبار الفلاحية',
      status: 'ok',
      findings: ['عنوان حقيقي من RSS.'],
      dataSource: 'rss-feeds',
      isRealData: true,
      confidence: 'high',
      dependsOn: [],
      attempts: 1,
      latencyMs: 210,
    },
  ],
  blocked: [],
  startedAt: '2026-01-01T00:00:00.000Z',
  finishedAt: '2026-01-01T00:00:00.250Z',
  concurrency: 4,
  plannedBy: 'llm',
  rejectedPlanIds: [],
};

describe('AIAssistantScreen — orchestration trace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a trace when the server did not return one', async () => {
    mockChat.mockResolvedValueOnce({
      data: { reply: 'جواب بسيط', meta: { provenance: 'rule-based', isRealData: false } },
      error: null,
    });

    const user = require('@testing-library/react-native').userEvent.setup();
    await renderScreen();
    await user.type(screen.getByPlaceholderText('اكتب سؤالك هنا بالعامية التونسية أو الفصحى...'), 'سؤال');
    await user.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(screen.getByText('جواب بسيط')).toBeTruthy());
    expect(screen.queryByText('تنسيق الوكلاء المتعدّدين')).toBeNull();
  });

  it('renders the real multi-agent trace the server returned', async () => {
    mockChat.mockResolvedValueOnce({
      data: {
        reply: 'جواب من الوكلاء',
        meta: { provenance: 'rule-based', isRealData: false },
        orchestration: trace,
      },
      error: null,
    });

    const user = require('@testing-library/react-native').userEvent.setup();
    await renderScreen();
    await user.type(screen.getByPlaceholderText('اكتب سؤالك هنا بالعامية التونسية أو الفصحى...'), 'سؤال');
    await user.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(screen.getByText('جواب من الوكلاء')).toBeTruthy());

    // Collapsed header shows the orchestrator ran (2 of 2 steps ok).
    expect(screen.getByText('تنسيق الوكلاء المتعدّدين')).toBeTruthy();
    expect(screen.getByText('2/2')).toBeTruthy();

    // Expanding reveals the plan, the planner and the per-specialist findings.
    await user.press(screen.getByText('تنسيق الوكلاء المتعدّدين'));
    await waitFor(() => expect(screen.getByText('اختار النموذج اللغوي الخطة')).toBeTruthy());
    expect(screen.getByText('الطماطم مناسبة لمناخك.')).toBeTruthy();
    expect(screen.getByText('عنوان حقيقي من RSS.')).toBeTruthy();
    // Source labels reflect the trace, not a guess.
    expect(screen.getByText('قواعد حتمية')).toBeTruthy();
    expect(screen.getByText('خلاصات RSS حقيقية')).toBeTruthy();
  });

  it('discloses specialists the model proposed but that were dropped', async () => {
    mockChat.mockResolvedValueOnce({
      data: {
        reply: 'جواب',
        meta: { provenance: 'rule-based', isRealData: false },
        orchestration: { ...trace, rejectedPlanIds: ['weather', 'not_real_agent'] },
      },
      error: null,
    });

    const user = require('@testing-library/react-native').userEvent.setup();
    await renderScreen();
    await user.type(screen.getByPlaceholderText('اكتب سؤالك هنا بالعامية التونسية أو الفصحى...'), 'سؤال');
    await user.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(screen.getByText('جواب')).toBeTruthy());
    await user.press(screen.getByText('تنسيق الوكلاء المتعدّدين'));
    await waitFor(() => expect(screen.getByText(/not_real_agent/)).toBeTruthy());
  });
});
