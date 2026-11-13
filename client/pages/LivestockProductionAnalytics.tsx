import { apiFetch } from '@/lib/apiFetch';
import React, { useState, useEffect } from 'react';
import { DataProvenanceBanner } from "@/components/DataProvenanceBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  Activity, 
  Calendar,
  Scale,
  Milk,
  Egg,
  Award,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Download,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
  Star,
  Users,
  Lightbulb,
  Eye,
  Calculator,
  LineChart,
  Trash2
} from 'lucide-react';

interface Animal {
  id: string;
  earTag: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'chicken' | 'turkey' | 'duck';
  breed: string;
  age: number;
  weight: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'quarantine';
  currentLocation: string;
}

interface ProductionRecord {
  id: string;
  animalId: string;
  date: string;
  type: 'milk' | 'eggs' | 'wool' | 'meat' | 'weight_gain';
  quantity: number;
  unit: 'liters' | 'kg' | 'pieces' | 'grams';
  quality: 'A' | 'B' | 'C' | 'Premium' | 'rejected';
  price?: number;
  revenue?: number;
  notes?: string;
  measuredBy?: string;
  temperature?: number;
  fat_content?: number;
  protein_content?: number;
}

interface ProductionMetrics {
  animalId: string;
  totalProduction: number;
  averageDaily: number;
  peakProduction: number;
  currentTrend: 'increasing' | 'decreasing' | 'stable';
  efficiencyScore: number;
  qualityRating: number;
  seasonalVariation: number;
  lastMeasurement: string;
  projectedMonthly: number;
  costPerUnit: number;
  profitability: number;
}

interface ProductionAnalytics {
  overview: {
    totalAnimals: number;
    totalProduction: number;
    averageProductivity: number;
    topPerformers: number;
    revenue: number;
    profitMargin: number;
  };
  trends: {
    dailyTrend: number;
    weeklyTrend: number;
    monthlyTrend: number;
    seasonalPattern: 'peak' | 'declining' | 'stable' | 'improving';
  };
  qualityDistribution: Record<string, number>;
  topProducers: ProductionMetrics[];
  speciesBreakdown: Record<string, {
    totalProduction: number;
    averagePerAnimal: number;
    efficiency: number;
  }>;
}

const LivestockProductionAnalytics: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [analytics, setAnalytics] = useState<ProductionAnalytics | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [selectedProductionType, setSelectedProductionType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newRecord, setNewRecord] = useState({
    animalId: '',
    type: 'milk' as ProductionRecord['type'],
    quantity: '',
    quality: 'A' as ProductionRecord['quality'],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    temperature: '',
    fat_content: '',
    protein_content: '',
    price: ''
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const unitForType = (type: ProductionRecord['type']): ProductionRecord['unit'] =>
    type === 'milk' ? 'liters' : type === 'eggs' ? 'pieces' : 'kg';

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchAnimals();
      await fetchProductionRecords();
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimals = async () => {
    try {
      const response = await apiFetch('/api/animals');
      const data = await response.json();
      if (data.success) {
        setAnimals(data.data.map((animal: any) => ({
          ...animal,
          age: calculateAge(animal.birthDate)
        })));
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
    }
  };

  // Production records come from the farmer's own persisted rows
  // (/api/livestock-management/production-records). Nothing is generated: an
  // empty herd with no records shows an empty state, never invented litres,
  // egg counts or fat/protein values.
  const fetchProductionRecords = async () => {
    try {
      const response = await apiFetch('/api/livestock-management/production-records');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setProductionRecords(data.data.map((row: any) => ({
          id: row.id,
          animalId: row.animal_id,
          date: row.recorded_at,
          type: row.production_type,
          quantity: Number(row.quantity),
          unit: row.unit,
          quality: row.quality,
          price: row.price_per_unit != null ? Number(row.price_per_unit) : undefined,
          // Revenue is only ever the farmer's own quantity x entered price.
          revenue: row.price_per_unit != null ? Number(row.quantity) * Number(row.price_per_unit) : undefined,
          notes: row.notes || undefined,
          fat_content: row.fat_content != null ? Number(row.fat_content) : undefined,
          protein_content: row.protein_content != null ? Number(row.protein_content) : undefined,
        })));
      } else {
        setProductionRecords([]);
      }
    } catch (error) {
      console.error('Error fetching production records:', error);
      setProductionRecords([]);
    }
  };

  // Analytics are derived only from the caller's own herd and persisted
  // records. Anything that cannot be derived from real data (a productivity
  // score against an "ideal" level, a profit margin without recorded costs,
  // a seasonal trend without enough history) is left out rather than estimated.
  const deriveAnalytics = (records: ProductionRecord[]): ProductionAnalytics | null => {
    if (animals.length === 0 && records.length === 0) return null;
    const totalProduction = records.reduce((sum, r) => sum + r.quantity, 0);
    const revenue = records.reduce((sum, r) => sum + (r.revenue || 0), 0);

    const qualityCounts: Record<string, number> = {};
    for (const r of records) qualityCounts[r.quality] = (qualityCounts[r.quality] || 0) + 1;
    const qualityDistribution: Record<string, number> = {};
    for (const [q, count] of Object.entries(qualityCounts)) {
      qualityDistribution[q] = records.length ? Math.round((count / records.length) * 100) : 0;
    }

    const byAnimal = new Map<string, number>();
    for (const r of records) byAnimal.set(r.animalId, (byAnimal.get(r.animalId) || 0) + r.quantity);
    const topProducers: ProductionMetrics[] = Array.from(byAnimal.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([animalId, total]) => {
        const animalRecords = records.filter(r => r.animalId === animalId);
        const lastDate = animalRecords.map(r => r.date).sort().at(-1) || '';
        const peak = animalRecords.reduce((m, r) => Math.max(m, r.quantity), 0);
        return {
          animalId,
          totalProduction: total,
          averageDaily: animalRecords.length ? total / animalRecords.length : 0,
          peakProduction: peak,
          currentTrend: 'stable',
          efficiencyScore: 0,
          qualityRating: 0,
          seasonalVariation: 0,
          lastMeasurement: lastDate,
          projectedMonthly: 0,
          costPerUnit: 0,
          profitability: 0,
        };
      });

    const speciesBreakdown: ProductionAnalytics['speciesBreakdown'] = {};
    for (const animal of animals) {
      const total = byAnimal.get(animal.id) || 0;
      if (total === 0) continue;
      if (!speciesBreakdown[animal.species]) {
        speciesBreakdown[animal.species] = { totalProduction: 0, averagePerAnimal: 0, efficiency: 0 };
      }
      speciesBreakdown[animal.species].totalProduction += total;
    }
    for (const key of Object.keys(speciesBreakdown)) {
      const count = animals.filter(a => a.species === key).length || 1;
      speciesBreakdown[key].averagePerAnimal = Math.round(speciesBreakdown[key].totalProduction / count);
    }

    return {
      overview: {
        totalAnimals: animals.length,
        totalProduction,
        averageProductivity: 0,
        topPerformers: topProducers.length,
        revenue,
        profitMargin: 0,
      },
      trends: { dailyTrend: 0, weeklyTrend: 0, monthlyTrend: 0, seasonalPattern: 'stable' },
      qualityDistribution,
      topProducers,
      speciesBreakdown,
    };
  };

  // Keep the metrics in step with the persisted records + herd, never with
  // generated numbers.
  useEffect(() => {
    setAnalytics(deriveAnalytics(productionRecords));
  }, [productionRecords, animals]);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  };

  const getSpeciesIcon = (species: string) => {
    const icons = {
      cattle: '🐄',
      sheep: '🐑',
      goat: '🐐',
      chicken: '🐔',
      turkey: '🦃',
      duck: '🦆'
    };
    return icons[species as keyof typeof icons] || '🐾';
  };

  const getSpeciesLabel = (species: string) => {
    const labels = {
      cattle: 'أبقار',
      sheep: 'أغنام',
      goat: 'ماعز',
      chicken: 'دجاج',
      turkey: 'ديك رومي',
      duck: 'بط'
    };
    return labels[species as keyof typeof labels] || species;
  };

  const getProductionTypeIcon = (type: string) => {
    const icons = {
      milk: <Milk className="h-4 w-4 text-blue-600" />,
      eggs: <Egg className="h-4 w-4 text-yellow-600" />,
      wool: <Users className="h-4 w-4 text-purple-600" />,
      meat: <Target className="h-4 w-4 text-red-600" />,
      weight_gain: <Scale className="h-4 w-4 text-green-600" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getProductionTypeLabel = (type: string) => {
    const labels = {
      milk: 'حليب',
      eggs: 'بيض',
      wool: 'صوف',
      meat: 'لحم',
      weight_gain: 'زيادة الوزن'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getQualityColor = (quality: string) => {
    const colors = {
      Premium: 'bg-purple-100 text-purple-800',
      A: 'bg-green-100 text-green-800',
      B: 'bg-yellow-100 text-yellow-800',
      C: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[quality as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleAddRecord = async () => {
    setSaveError(null);
    const quantity = parseFloat(newRecord.quantity);
    if (!newRecord.animalId) {
      setSaveError('اختر الحيوان قبل الحفظ.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setSaveError('أدخل كمية صحيحة أكبر من صفر.');
      return;
    }
    const price = newRecord.price ? parseFloat(newRecord.price) : undefined;
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      setSaveError('أدخل سعراً صحيحاً أو اتركه فارغاً.');
      return;
    }
    try {
      const response = await apiFetch('/api/livestock-management/production-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: newRecord.animalId,
          productionType: newRecord.type,
          quantity,
          unit: unitForType(newRecord.type),
          quality: newRecord.quality,
          recordedAt: newRecord.date,
          pricePerUnit: price,
          fatContent: newRecord.fat_content ? parseFloat(newRecord.fat_content) : undefined,
          proteinContent: newRecord.protein_content ? parseFloat(newRecord.protein_content) : undefined,
          temperature: newRecord.temperature ? parseFloat(newRecord.temperature) : undefined,
          notes: newRecord.notes
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSaveError(data.message || 'تعذّر حفظ سجل الإنتاج. لم يُحفظ أي شيء.');
        return;
      }
      // Re-read from the database so the screen reflects what was persisted.
      await fetchProductionRecords();
      setIsAddDialogOpen(false);
      setNewRecord({
        animalId: '',
        type: 'milk',
        quantity: '',
        quality: 'A',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        temperature: '',
        fat_content: '',
        protein_content: '',
        price: ''
      });
    } catch (error) {
      console.error('Error adding production record:', error);
      setSaveError('تعذّر الاتصال بالخادم. لم يُحفظ أي شيء.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const response = await apiFetch(`/api/livestock-management/production-records/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok || !data.success) return;
      await fetchProductionRecords();
    } catch (error) {
      console.error('Error deleting production record:', error);
    }
  };

  const filteredRecords = productionRecords.filter(record => {
    const animalMatch = !selectedAnimal || record.animalId === selectedAnimal;
    const typeMatch = !selectedProductionType || record.type === selectedProductionType;
    return animalMatch && typeMatch;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <DataProvenanceBanner
        message="تعرض هذه الشاشة سجلات الإنتاج التي أدخلتها أنت (حليب، بيض، نمو الوزن) والمحفوظة في حسابك. لا تُختلق أي قياسات؛ وإذا لم تُسجّل إنتاجاً بعد تظهر حالة فارغة."
      />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليلات الإنتاج الحيواني</h1>
          <p className="text-gray-600">سجلات إنتاج الحليب والبيض ونمو الحيوانات من حسابك</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="جميع الحيوانات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الحيوانات</SelectItem>
              {animals.map(animal => (
                <SelectItem key={animal.id} value={animal.id}>
                  {getSpeciesIcon(animal.species)} {animal.earTag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProductionType} onValueChange={setSelectedProductionType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="نوع الإنتاج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الأنواع</SelectItem>
              <SelectItem value="milk">حليب</SelectItem>
              <SelectItem value="eggs">بيض</SelectItem>
              <SelectItem value="weight_gain">نمو الوزن</SelectItem>
              <SelectItem value="wool">صوف</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="yearly">سنوي</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                تسجيل إنتاج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>تسجيل إنتاج جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحيوان</Label>
                    <Select value={newRecord.animalId} onValueChange={(value) => 
                      setNewRecord({ ...newRecord, animalId: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحيوان" />
                      </SelectTrigger>
                      <SelectContent>
                        {animals.map(animal => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {getSpeciesIcon(animal.species)} {animal.earTag} - {animal.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>نوع الإنتاج</Label>
                    <Select value={newRecord.type} onValueChange={(value: any) => 
                      setNewRecord({ ...newRecord, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milk">حليب</SelectItem>
                        <SelectItem value="eggs">بيض</SelectItem>
                        <SelectItem value="weight_gain">زيادة الوزن</SelectItem>
                        <SelectItem value="wool">صوف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newRecord.quantity}
                      onChange={(e) => setNewRecord({ ...newRecord, quantity: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الجودة</Label>
                    <Select value={newRecord.quality} onValueChange={(value: any) => 
                      setNewRecord({ ...newRecord, quality: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premium">ممتاز</SelectItem>
                        <SelectItem value="A">جيد جداً</SelectItem>
                        <SelectItem value="B">جيد</SelectItem>
                        <SelectItem value="C">مقبول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>السعر لكل وحدة (اختياري)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRecord.price}
                      onChange={(e) => setNewRecord({ ...newRecord, price: e.target.value })}
                      placeholder="اتركه فارغاً إن لم تحدّده"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    />
                  </div>

                  {newRecord.type === 'milk' && (
                    <>
                      <div className="space-y-2">
                        <Label>نسبة الدهون (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newRecord.fat_content}
                          onChange={(e) => setNewRecord({ ...newRecord, fat_content: e.target.value })}
                          placeholder="3.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>نسبة البروتين (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newRecord.protein_content}
                          onChange={(e) => setNewRecord({ ...newRecord, protein_content: e.target.value })}
                          placeholder="3.2"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>

                {saveError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleAddRecord} className="flex-1">
                    تسجيل الإنتاج
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics — every value is derived from the farmer's own records. */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإنتاج</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.overview.totalProduction.toFixed(1)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                مجموع الكميات المسجّلة (لتر/كيلو/قطعة)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد السجلات</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {productionRecords.length}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                سجل إنتاج محفوظ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حيوانات منتِجة</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.overview.topPerformers}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                لديها سجلات إنتاج
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات المسجّلة</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.overview.revenue > 0 ? formatCurrency(analytics.overview.revenue) : '—'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                الكمية × السعر الذي أدخلته
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الإنتاج</CardTitle>
              <Target className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {productionRecords.length
                  ? (analytics.overview.totalProduction / productionRecords.length).toFixed(1)
                  : '—'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                لكل سجل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آخر تسجيل</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {productionRecords.length
                  ? new Date(
                      productionRecords.map(r => r.date).sort().at(-1) as string
                    ).toLocaleDateString('ar-TN')
                  : '—'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                تاريخ آخر سجل إنتاج
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!analytics && !loading && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Activity className="mx-auto h-10 w-10 mb-3 text-gray-300" />
            <p>لا توجد حيوانات أو سجلات إنتاج بعد. أضف حيوانات ثم سجّل إنتاجك لتظهر التحليلات.</p>
          </CardContent>
        </Card>
      )}


      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="performers">أفضل المنتجين</TabsTrigger>
          <TabsTrigger value="records">سجلات الإنتاج</TabsTrigger>
          <TabsTrigger value="quality">تحليل الجودة</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Species Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  الإنتاج حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.speciesBreakdown).map(([species, data]) => (
                      <div key={species} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getSpeciesIcon(species)}</span>
                          <span className="font-medium">{getSpeciesLabel(species)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.totalProduction}</div>
                          <div className="text-sm text-gray-600">
                            بمعدل {data.averagePerAnimal}/حيوان
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  توزيع الجودة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-3">
                    {Object.entries(analytics.qualityDistribution).map(([quality, percentage]) => (
                      <div key={quality} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getQualityColor(quality)}>
                            {quality === 'Premium' ? 'ممتاز' : quality}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-sm font-medium w-8">{percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Production Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                اتجاهات الإنتاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-4">
                  {(() => {
                    // Honest period-over-period comparison. Only shown when the
                    // farmer has records in both windows; otherwise we say so
                    // rather than estimate a trend.
                    const days = (n: number) => {
                      const cutoff = new Date();
                      cutoff.setDate(cutoff.getDate() - n);
                      return cutoff.toISOString().slice(0, 10);
                    };
                    const recent = productionRecords.filter(r => r.date >= days(7));
                    const prior = productionRecords.filter(r => r.date >= days(14) && r.date < days(7));
                    const sum = (rs: ProductionRecord[]) => rs.reduce((s, r) => s + r.quantity, 0);
                    if (recent.length === 0 && prior.length === 0) {
                      return (
                        <p className="text-sm text-gray-500">
                          لا توجد سجلات إنتاج كافية بعد لحساب اتجاه زمني. سجّل إنتاجك لعدة أيام ليظهر الاتجاه.
                        </p>
                      );
                    }
                    const recentTotal = sum(recent);
                    const priorTotal = sum(prior);
                    const change = priorTotal > 0 ? ((recentTotal - priorTotal) / priorTotal) * 100 : null;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{recentTotal.toFixed(1)}</div>
                          <p className="text-sm text-gray-600">إنتاج آخر 7 أيام</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{priorTotal.toFixed(1)}</div>
                          <p className="text-sm text-gray-600">إنتاج الأسبوع السابق</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className={`text-2xl font-bold ${change != null && change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '—'}
                          </div>
                          <p className="text-sm text-gray-600">
                            {change != null ? 'التغيّر' : 'لا بيانات كافية للمقارنة'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="performers" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              أفضل الحيوانات المنتجة
            </h2>

            {analytics && analytics.topProducers.length === 0 && (
              <p className="text-sm text-gray-500">لا توجد سجلات إنتاج بعد لترتيب الحيوانات.</p>
            )}
            
            {analytics && analytics.topProducers.map((producer, index) => {
              const animal = animals.find(a => a.id === producer.animalId);
              
              return (
                <Card key={producer.animalId} className="border-2 border-yellow-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                          {index + 1}
                        </div>
                        {animal && (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getSpeciesIcon(animal.species)}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{animal.earTag}</h3>
                              <p className="text-sm text-gray-600">
                                {getSpeciesLabel(animal.species)} - {animal.breed}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {producer.totalProduction.toFixed(1)}
                          </div>
                          <p className="text-xs text-gray-600">إجمالي الإنتاج المسجّل</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {producer.totalProduction.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-600">إجمالي الإنتاج</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {producer.averageDaily.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-600">متوسط لكل سجل</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {producer.peakProduction.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-600">أعلى كمية مسجّلة</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      آخر تسجيل: {producer.lastMeasurement ? new Date(producer.lastMeasurement).toLocaleDateString('ar-TN') : '—'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Production Records Tab */}
        <TabsContent value="records" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              سجلات الإنتاج الحديثة
            </h2>
            
                        {filteredRecords.length === 0 && (
              <p className="text-sm text-gray-500">
                لا توجد سجلات إنتاج محفوظة بعد. استخدم زر «تسجيل إنتاج» لإضافة أول سجل.
              </p>
            )}

            {filteredRecords.slice(0, 20).map((record) => {
              const animal = animals.find(a => a.id === record.animalId);

              return (
                <Card key={record.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getProductionTypeIcon(record.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {animal ? `${animal.earTag} - ${getSpeciesIcon(animal.species)}` : 'حيوان غير معروف'}
                            </span>
                            <Badge className={getQualityColor(record.quality)}>
                              {record.quality === 'Premium' ? 'ممتاز' : record.quality}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {getProductionTypeLabel(record.type)} - {new Date(record.date).toLocaleDateString('ar-TN')}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {record.quantity.toFixed(1)} {record.unit}
                          </div>
                          {record.revenue != null && (
                            <p className="text-sm text-green-600">
                              {formatCurrency(record.revenue)}
                            </p>
                          )}
                          {record.fat_content != null && (
                            <p className="text-xs text-gray-600">
                              دهون: {record.fat_content.toFixed(1)}%
                              {record.protein_content != null ? ` | بروتين: ${record.protein_content.toFixed(1)}%` : ''}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف السجل"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Quality Analysis Tab */}
        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                تحليل شامل للجودة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Star className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>قريباً - تحليلات متقدمة لجودة الإنتاج</p>
                <p className="text-sm">تحليل المحتوى الغذائي والمعايير الدولية</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                اتجاهات الإنتاج التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <LineChart className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>قريباً - رسوم بيانية تفاعلية للاتجاهات</p>
                <p className="text-sm">تحليل زمني متقدم وتوقعات مستقبلية</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LivestockProductionAnalytics;
