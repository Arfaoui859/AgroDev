import {
  diagnosePlantDisease,
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  getProjectExpenses,
  createProjectExpense,
  createProjectRevenue,
  getProjectFinancialSummary,
  setApiBaseUrl,
  saveDiseaseDetection,
} from '../../src/api/client';
import { setActiveLanguage } from '../../src/i18n';

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null } })),
      refreshSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    },
  },
}));

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('project API client', () => {
  beforeEach(() => {
    setApiBaseUrl('http://test.local');
    setActiveLanguage('en');
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('plant disease endpoint contract', () => {
    it('posts multipart image and crop context to the clean capability URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({
        disease_detection: { primary_disease: { disease: 'leaf_spot', disease_name_ar: 'تبقع الأوراق', probability: 0.8 } },
        severity_assessment: { severity_level: 'medium' },
        treatment_plan: { immediate_treatment: [], prevention_measures: [] },
        provenance: { source: 'vision-model', verified: true },
      }));
      const result = await diagnosePlantDisease({ imageUri: 'file:///leaf.jpg', cropType: 'olive', plantPart: 'leaves', symptoms: 'spots' });
      expect(result.data?.plantType).toBe('olive');
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://test.local/api/ai/plant-disease-detection');
      expect(init.method).toBe('POST');
      expect((init.body as FormData).get('plant_type')).toBe('olive');
      expect((init.body as FormData).get('plant_part')).toBe('leaves');
      expect((init.body as FormData).get('symptoms')).toBe('spots');
    });
  });

  describe('getProjectTasks', () => {
    it('reads persisted tasks and labels them as stored records', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [{ id: 't1', farm_id: 'f1', title: 'Till', status: 'pending', task_type: 'general', priority: 'medium', description: '', due_date: null, completed_at: null }],
          provenance: { source: 'supabase.farm_tasks', persisted: true },
        }),
      );
      const res = await getProjectTasks({ farmId: 'f1' });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].title).toBe('Till');
      expect(res.roleBlocked).toBe(false);
      expect(res.meta.provenance).toBe('database');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test.local/api/farm-operations/tasks?farm_id=f1',
        expect.anything(),
      );
    });

    it('treats a 403 as an honest role-blocked state, not an error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: false, error: 'Forbidden' }, 403),
      );
      const res = await getProjectTasks();
      expect(res.roleBlocked).toBe(true);
      expect(res.error).toBeNull();
      expect(res.data).toEqual([]);
    });
  });

  describe('createProjectTask', () => {
    it('posts the farm-scoped task and returns the persisted row', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 't2', farm_id: 'f1', title: 'Irrigate', status: 'pending', task_type: 'irrigation', priority: 'high', description: '', due_date: '2026-12-01', completed_at: null } }, 201),
      );
      const res = await createProjectTask({ farm_id: 'f1', title: 'Irrigate', task_type: 'irrigation', priority: 'high' });
      expect(res.data?.id).toBe('t2');
      expect(res.error).toBeNull();
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://test.local/api/farm-operations/tasks');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toMatchObject({ farm_id: 'f1', title: 'Irrigate' });
    });

    it('flags a role-blocked create', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ success: false }, 403));
      const res = await createProjectTask({ farm_id: 'f1', title: 'x' });
      expect(res.roleBlocked).toBe(true);
      expect(res.data).toBeNull();
    });
  });

  describe('updateProjectTask', () => {
    it('PUTs the status change to the task endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 't1', status: 'completed' } }),
      );
      const res = await updateProjectTask('t1', { title: 'Till', status: 'completed' });
      expect(res.data?.status).toBe('completed');
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://test.local/api/farm-operations/tasks/t1');
      expect(init.method).toBe('PUT');
    });
  });

  describe('finance', () => {
    it('unwraps the expenses envelope', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { expenses: [{ id: 'e1', amount: 50, category: 'seeds' }], totalExpenses: 50, categoryTotals: { seeds: 50 } },
          provenance: { source: 'supabase.farm_expenses', persisted: true },
        }),
      );
      const res = await getProjectExpenses();
      expect(res.data.totalExpenses).toBe(50);
      expect(res.data.expenses).toHaveLength(1);
    });

    it('posts an expense with the required amount/date/category', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 'e2', amount: 20, category: 'labor' } }, 201),
      );
      const res = await createProjectExpense({ amount: 20, date: '2026-11-01', category: 'labor', farm_id: 'f1' });
      expect(res.data?.id).toBe('e2');
      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(init.body)).toMatchObject({ amount: 20, date: '2026-11-01', category: 'labor' });
    });

    it('posts a revenue', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 'r1', amount: 900, currency: 'TND' } }, 201),
      );
      const res = await createProjectRevenue({ amount: 900, date: '2026-11-05', buyer: 'Souk' });
      expect(res.data?.id).toBe('r1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://test.local/api/revenues');
    });

    it('returns the server-computed summary untouched', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { totalExpenses: 100, grossRevenue: 500, salesCosts: 20, totalRevenue: 480, netProfit: 380, categoryBreakdown: {}, expenseCount: 1, revenueCount: 1 },
        }),
      );
      const res = await getProjectFinancialSummary('farm-123');
      expect(res.data?.netProfit).toBe(380);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('http://test.local/api/financial-summary?farm_id=farm-123');
      expect(res.meta.provenance).toBe('database');
    });

    it('flags a role-blocked finance read', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ success: false }, 403));
      const res = await getProjectFinancialSummary();
      expect(res.roleBlocked).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('offline honesty', () => {
    it('never fabricates tasks when the network fails and no cache exists', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));
      const res = await getProjectTasks();
      expect(res.data).toEqual([]);
      expect(res.error).toBeTruthy();
    });
  });

  describe('saveDiseaseDetection', () => {
    it('posts the farm-scoped evidence and returns the stored id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 'det1', image_signed_url: 'https://x/y.jpg' } }, 201),
      );
      const res = await saveDiseaseDetection({
        imageUri: 'file:///tmp/leaf.jpg',
        farmId: 'f1',
        primaryDisease: 'Olive leaf spot',
        severityLevel: 'medium',
        confidence: 87,
      });
      expect(res.data?.id).toBe('det1');
      expect(res.error).toBeNull();
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://test.local/api/assistant/actions/disease-detections');
      expect(init.method).toBe('POST');
      const body = init.body as FormData;
      expect(body.get('farm_id')).toBe('f1');
      expect(body.get('primary_disease')).toBe('Olive leaf spot');
      // UI percents are converted to the server's 0..1 confidence.
      expect(body.get('disease_confidence')).toBe('0.87');
    });

    it('returns an honest error and no data when the server refuses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse({ success: false, code: 'FARM_NOT_FOUND_OR_NOT_OWNED' }, 404),
      );
      const res = await saveDiseaseDetection({ imageUri: 'file:///a.jpg', farmId: 'f1', primaryDisease: 'x' });
      expect(res.data).toBeNull();
      expect(res.error).toBeTruthy();
    });
  });
});