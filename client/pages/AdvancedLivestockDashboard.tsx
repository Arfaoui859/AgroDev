import { apiFetch } from '@/lib/apiFetch';
import { asArray } from '@/lib/dashboardData';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Heart, Activity, AlertTriangle, CheckCircle, Bell, Plus, RefreshCw, PieChart, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

/**
 * The shape returned by `GET /api/animals` (see `animalRecord()` in
 * `server/routes/livestock.ts`). Every field is derived from a persisted
 * `livestock_animals` row; nothing is synthesised here.
 */
interface Animal {
  id: string;
  earTag: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: string | null;
  age: number | null;
  weight: number | null;
  healthStatus: string;
  breedingStatus: string;
  lifecycleStatus: string;
  location: string;
  currentValue: number | null;
  currency: string;
  lastHealthCheck: string | null;
  notes: string;
}

/** A row from `GET /api/health-alerts`. */
interface HealthAlert {
  id: string;
  animalId: string;
  earTag: string | null;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  dateCreated: string;
  resolved: boolean;
}

/** Aggregates from `GET /api/livestock-dashboard`, computed from persisted rows. */
interface DashboardData {
  totalAnimals: number;
  bySpecies: Record<string, number>;
  byHealthStatus: Record<string, number>;
  totalValue: number;
  currency: string;
  feedItemsLowStock: number;
}

const SPECIES = [
  { value: 'cattle', label: 'أبقار' },
  { value: 'dairy_cattle', label: 'أبقار حلوب' },
  { value: 'beef_cattle', label: 'أبقار لحم' },
  { value: 'sheep', label: 'أغنام' },
  { value: 'goat', label: 'ماعز' },
  { value: 'poultry', label: 'دواجن' },
  { value: 'camel', label: 'إبل' },
  { value: 'other', label: 'أخرى' },
];

const HEALTH_STATUSES = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'fair', label: 'مقبول' },
  { value: 'poor', label: 'ضعيف' },
  { value: 'sick', label: 'مريض' },
];

const PURPOSES = [
  { value: 'dairy', label: 'حلوب' },
  { value: 'beef', label: 'لحم' },
  { value: 'wool', label: 'صوف' },
  { value: 'meat', label: 'لحم' },
  { value: 'eggs', label: 'بيض' },
  { value: 'breeding', label: 'تناسل' },
  { value: 'mixed', label: 'مختلط' },
  { value: 'other', label: 'أخرى' },
];

const SPECIES_ICON: Record<string, string> = {
  cattle: '🐄',
  dairy_cattle: '🐄',
  beef_cattle: '🐄',
  sheep: '🐑',
  goat: '🐐',
  poultry: '🐔',
  camel: '🐪',
  other: '🐾',
};

const HEALTH_BADGE: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-emerald-100 text-emerald-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  sick: 'bg-red-100 text-red-800',
};

const labelFor = (list: { value: string; label: string }[], value: string) =>
  list.find((x) => x.value === value)?.label ?? value;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AnimalFormState {
  earTag: string;
  species: string;
  gender: string;
  breed: string;
  birthDate: string;
  weight: string;
  healthStatus: string;
  purpose: string;
}

const emptyForm: AnimalFormState = {
  earTag: '',
  species: 'cattle',
  gender: 'female',
  breed: '',
  birthDate: '',
  weight: '',
  healthStatus: 'good',
  purpose: 'other',
};

const AdvancedLivestockDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AnimalFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiFetch('/api/livestock-dashboard');
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success && data.data) {
        setDashboardData(data.data as DashboardData);
      } else {
        setDashboardData(null);
      }
    } catch {
      setDashboardData(null);
    }
  }, []);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSpecies && selectedSpecies !== 'all') params.append('species', selectedSpecies);
      if (selectedStatus && selectedStatus !== 'all') params.append('healthStatus', selectedStatus);
      const response = await apiFetch(`/api/animals?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setAnimals(asArray<Animal>(data.data));
        setLoadError(false);
      } else {
        setAnimals([]);
        setLoadError(true);
      }
    } catch {
      setAnimals([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecies, selectedStatus]);

  const fetchHealthAlerts = useCallback(async () => {
    try {
      const response = await apiFetch('/api/health-alerts');
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setHealthAlerts(asArray<HealthAlert>(data.data));
      } else {
        setHealthAlerts([]);
      }
    } catch {
      setHealthAlerts([]);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
    void fetchAnimals();
    void fetchHealthAlerts();
  }, [fetchDashboardData, fetchAnimals, fetchHealthAlerts]);

  const reloadAll = () => {
    void fetchDashboardData();
    void fetchAnimals();
    void fetchHealthAlerts();
  };

  const createAnimal = async () => {
    if (!form.earTag.trim()) {
      setFormError('رقم العلامة مطلوب.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch('/api/livestock-management/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earTag: form.earTag.trim(),
          species: form.species,
          gender: form.gender,
          breed: form.breed.trim(),
          birthDate: form.birthDate || null,
          weight: form.weight ? Number(form.weight) : null,
          healthStatus: form.healthStatus,
          purpose: form.purpose,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        if (data?.code === 'EAR_TAG_ALREADY_EXISTS') {
          setFormError('رقم العلامة مستعمل مسبقاً.');
        } else {
          setFormError('تعذّر حفظ الحيوان. تحقق من البيانات وحاول مجدداً.');
        }
        return;
      }
      setAddOpen(false);
      setForm(emptyForm);
      reloadAll();
    } catch {
      setFormError('تعذّر الاتصال بالخادم. لم يُحفظ أي شيء.');
    } finally {
      setSaving(false);
    }
  };

  const resolveAlert = async (alert: HealthAlert) => {
    // Alerts derived from an animal's health status carry a synthetic id and
    // have no resolvable row; only real health-event alerts can be resolved.
    if (!UUID_RE.test(alert.id)) return;
    setResolvingId(alert.id);
    try {
      const response = await apiFetch(`/api/livestock-management/health-events/${alert.id}/resolve`, {
        method: 'PATCH',
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        void fetchHealthAlerts();
        void fetchDashboardData();
      }
    } finally {
      setResolvingId(null);
    }
  };

  const healthyCount = animals.filter(
    (a) => a.healthStatus === 'excellent' || a.healthStatus === 'good',
  ).length;
  const sickCount = animals.filter((a) => a.healthStatus === 'sick' || a.healthStatus === 'poor').length;

  const speciesDistribution = Object.entries(dashboardData?.bySpecies ?? {}).map(([species, count]) => ({
    name: labelFor(SPECIES, species),
    value: count,
  }));
  const healthDistribution = Object.entries(dashboardData?.byHealthStatus ?? {}).map(([status, count]) => ({
    name: labelFor(HEALTH_STATUSES, status),
    value: count,
  }));
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#64748b'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة الثروة الحيوانية المتقدمة</h1>
          <p className="text-gray-600">
            مؤشرات وتحليلات مبنية فقط على سجلاتك المخزّنة. لا تُعرض أي أرقام افتراضية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="جميع الأنواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {SPECIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {HEALTH_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={reloadAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة حيوان
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تعذّر تحميل سجلات الثروة الحيوانية. تأكد من تسجيل الدخول ومن تطبيق
            database/livestock-persistence.sql في قاعدة البيانات.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData?.totalAnimals ?? animals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حيوانات سليمة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              {animals.length > 0 ? ((healthyCount / animals.length) * 100).toFixed(1) : 0}% من المعروض
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحتاج متابعة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sickCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {(dashboardData?.totalValue ?? 0).toLocaleString()} {dashboardData?.currency ?? 'TND'}
            </div>
            {(dashboardData?.feedItemsLowStock ?? 0) > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                {dashboardData?.feedItemsLowStock} مادة علف تحت حد إعادة الطلب
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="animals">الحيوانات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع الأنواع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {speciesDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {speciesDistribution.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <span className="font-medium">{entry.name}</span>
                        <span className="font-bold text-lg">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد حيوانات مسجّلة بعد.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  توزيع الحالة الصحية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={healthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد بيانات صحية بعد.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                التنبيهات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthAlerts.length > 0 ? (
                <div className="space-y-3">
                  {healthAlerts.slice(0, 5).map((alert) => (
                    <Alert key={alert.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            {alert.earTag && (
                              <p className="text-sm text-gray-600 mt-1">الحيوان: {alert.earTag}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={alert.severity === 'critical' || alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {alert.severity === 'critical' ? 'حرج' :
                           alert.severity === 'high' ? 'عالي' :
                           alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد تنبيهات صحية حالياً.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Animals Tab */}
        <TabsContent value="animals" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-56 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : animals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <Heart className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-gray-500">
                  لا توجد حيوانات مطابقة. أضف حيواناً أو غيّر عوامل التصفية.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animals.map((animal) => (
                <Card key={animal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{SPECIES_ICON[animal.species] ?? '🐾'}</span>
                        {animal.earTag}
                      </CardTitle>
                      <Badge className={HEALTH_BADGE[animal.healthStatus] ?? 'bg-gray-100 text-gray-800'}>
                        {labelFor(HEALTH_STATUSES, animal.healthStatus)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">النوع</span>
                      <span className="font-medium">{labelFor(SPECIES, animal.species)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">السلالة</span>
                      <span className="font-medium">{animal.breed || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الجنس</span>
                      <span className="font-medium">{animal.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">العمر</span>
                      <span className="font-medium">{animal.age != null ? `${animal.age} سنة` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الوزن</span>
                      <span className="font-medium">{animal.weight != null ? `${animal.weight} كغ` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">آخر فحص</span>
                      <span className="font-medium">
                        {animal.lastHealthCheck
                          ? new Date(animal.lastHealthCheck).toLocaleDateString('ar-TN')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">القيمة</span>
                      <span className="font-medium">
                        {animal.currentValue != null
                          ? `${animal.currentValue.toLocaleString()} ${animal.currency}`
                          : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {healthAlerts.length > 0 ? (
            healthAlerts.map((alert) => (
              <Card key={alert.id} className="border-r-4 border-r-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">{alert.message}</h3>
                        {alert.earTag && (
                          <p className="text-sm text-gray-600 mt-1">الحيوان: {alert.earTag}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {new Date(alert.dateCreated).toLocaleDateString('ar-TN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={alert.severity === 'critical' || alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {alert.severity === 'critical' ? 'حرج' :
                         alert.severity === 'high' ? 'عالي' :
                         alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      {!alert.resolved && UUID_RE.test(alert.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resolvingId === alert.id}
                          onClick={() => void resolveAlert(alert)}
                        >
                          {resolvingId === alert.id ? 'جارٍ الحل…' : 'تم الحل'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <p className="text-gray-500">لا توجد تنبيهات صحية حالياً</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الأنواع</CardTitle>
              </CardHeader>
              <CardContent>
                {speciesDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={speciesDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {speciesDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد بيانات بعد.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الحالة الصحية</CardTitle>
              </CardHeader>
              <CardContent>
                {healthDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={healthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد بيانات بعد.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>اتجاهات الإنتاج</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                تتبّع الإنتاج غير مربوط بمصدر بيانات موثّق بعد. لن نعرض أرقام إنتاج افتراضية.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add animal dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حيوان جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="earTag">رقم العلامة *</Label>
              <Input
                id="earTag"
                value={form.earTag}
                onChange={(e) => setForm((p) => ({ ...p, earTag: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>النوع</Label>
                <Select value={form.species} onValueChange={(v) => setForm((p) => ({ ...p, species: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPECIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الجنس</Label>
                <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">أنثى</SelectItem>
                    <SelectItem value="male">ذكر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="breed">السلالة</Label>
                <Input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthDate">تاريخ الميلاد</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="weight">الوزن (كغ)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>الحالة الصحية</Label>
                <Select value={form.healthStatus} onValueChange={(v) => setForm((p) => ({ ...p, healthStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HEALTH_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>الغرض</Label>
              <Select value={form.purpose} onValueChange={(v) => setForm((p) => ({ ...p, purpose: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={() => void createAnimal()} disabled={saving}>
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedLivestockDashboard;
