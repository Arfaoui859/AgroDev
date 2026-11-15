/**
 * `chatWithAIAssistant` surfaces the server's real multi-agent orchestration
 * trace. The gateway returns it for every turn; these tests lock in that the
 * client maps it faithfully and survives a partial/malformed payload.
 */
import { chatWithAIAssistant } from '../../src/api/client';

jest.mock('../../src/api/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(async () => ({ data: { session: null } })) } },
}));

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('chatWithAIAssistant — orchestration trace', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('maps the orchestration trace returned by the gateway', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        answer: 'جواب',
        dataSource: 'rule-based',
        isRealData: false,
        plannedBy: 'llm',
        orchestrationTrace: {
          plan: [{ id: 'crop', title: 'Crops', dependsOn: [] }],
          steps: [
            {
              id: 'crop',
              title: 'Crops',
              status: 'ok',
              findings: ['Tomato fits.'],
              dataSource: 'rule-based',
              isRealData: false,
              confidence: 'low',
              dependsOn: [],
              attempts: 1,
              latencyMs: 2,
            },
          ],
          blocked: [],
          startedAt: '2026-01-01T00:00:00.000Z',
          finishedAt: '2026-01-01T00:00:00.010Z',
          concurrency: 4,
          plannedBy: 'llm',
          rejectedPlanIds: [],
        },
      }),
    );

    const res = await chatWithAIAssistant('سؤال', 'ar');

    expect(res.error).toBeNull();
    expect(res.data?.orchestration?.plannedBy).toBe('llm');
    expect(res.data?.orchestration?.steps).toHaveLength(1);
    expect(res.data?.orchestration?.steps[0]).toMatchObject({
      id: 'crop',
      status: 'ok',
      dataSource: 'rule-based',
      isRealData: false,
      findings: ['Tomato fits.'],
    });
    expect(res.data?.plannedBy).toBe('llm');
  });

  it('omits the trace entirely when the server returned none', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ answer: 'جواب', dataSource: 'rule-based', isRealData: false }),
    );

    const res = await chatWithAIAssistant('سؤال', 'ar');
    expect(res.data?.orchestration).toBeUndefined();
    expect(res.data?.plannedBy).toBeNull();
  });

  it('never throws on a malformed trace payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        answer: 'جواب',
        dataSource: 'rule-based',
        isRealData: false,
        // steps is not an array → the whole trace is dropped, not rendered half-built.
        orchestrationTrace: { plan: 'nope', steps: null },
      }),
    );

    const res = await chatWithAIAssistant('سؤال', 'ar');
    expect(res.data?.reply).toBe('جواب');
    expect(res.data?.orchestration).toBeUndefined();
  });

  it('normalises a partial step without crashing the renderer', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        answer: 'جواب',
        dataSource: 'rule-based',
        isRealData: false,
        orchestrationTrace: {
          plan: [],
          // Missing title/findings/confidence — every field must be defaulted.
          steps: [{ id: 'weather' }],
        },
      }),
    );

    const res = await chatWithAIAssistant('سؤال', 'ar');
    const step = res.data?.orchestration?.steps[0];
    expect(step).toMatchObject({
      id: 'weather',
      title: 'weather',
      findings: [],
      confidence: 'unknown',
      attempts: 0,
      latencyMs: 0,
      isRealData: false,
    });
  });
});
