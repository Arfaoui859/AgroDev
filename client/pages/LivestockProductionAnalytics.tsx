import React, { useState, useEffect } from 'react';
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
  LineChart
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
    protein_content: ''
  });

  useEffect(() => {
    fetchAnimals();
    generateMockProductionData();
  }, [selectedAnimal, selectedProductionType, selectedPeriod]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/animals');
      const data = await response.json();
      
      if (data.success) {
        const animalsWithAge = data.data.map((animal: any) => ({
          ...animal,
          age: calculateAge(animal.birthDate)
        }));
        setAnimals(animalsWithAge);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockProductionData = () => {
    // Mock production records
    const mockRecords: ProductionRecord[] = [];
    const now = new Date();
    
    animals.slice(0, 5).forEach((animal, animalIdx) => {
      for (let dayBack = 0; dayBack < 30; dayBack++) {
        const recordDate = new Date(now);
        recordDate.setDate(now.getDate() - dayBack);
        
        if (animal.species === 'cattle' && animal.status === 'lactating') {
          mockRecords.push({
            id: `${animal.id}-milk-${dayBack}`,
            animalId: animal.id,
            date: recordDate.toISOString().split('T')[0],
            type: 'milk',
            quantity: 18 + Math.random() * 12 - 6, // 12-30 liters
            unit: 'liters',
            quality: ['A', 'A', 'A', 'B', 'Premium'][Math.floor(Math.random() * 5)] as any,
            price: 0.85,
            revenue: (18 + Math.random() * 12 - 6) * 0.85,
            fat_content: 3.2 + Math.random() * 0.8,
            protein_content: 3.1 + Math.random() * 0.6
          });
        }
        
        if (animal.species === 'chicken') {
          mockRecords.push({
            id: `${animal.id}-eggs-${dayBack}`,
            animalId: animal.id,
            date: recordDate.toISOString().split('T')[0],
            type: 'eggs',
            quantity: Math.floor(Math.random() * 2), // 0-1 eggs per day
            unit: 'pieces',
            quality: ['A', 'A', 'B', 'Premium'][Math.floor(Math.random() * 4)] as any,
            price: 0.4,
            revenue: Math.floor(Math.random() * 2) * 0.4
          });
        }
        
        // Weight gain records (weekly)
        if (dayBack % 7 === 0) {
          mockRecords.push({
            id: `${animal.id}-weight-${dayBack}`,
            animalId: animal.id,
            date: recordDate.toISOString().split('T')[0],
            type: 'weight_gain',
            quantity: 0.5 + Math.random() * 2, // 0.5-2.5 kg per week
            unit: 'kg',
            quality: 'A',
            notes: 'نمو طبيعي'
          });
        }
      }
    });
    
    setProductionRecords(mockRecords);
    
    // Generate analytics
    const mockAnalytics: ProductionAnalytics = {
      overview: {
        totalAnimals: animals.length,
        totalProduction: mockRecords.reduce((sum, record) => sum + record.quantity, 0),
        averageProductivity: 87,
        topPerformers: Math.floor(animals.length * 0.3),
        revenue: mockRecords.reduce((sum, record) => sum + (record.revenue || 0), 0),
        profitMargin: 35.2
      },
      trends: {
        dailyTrend: 2.3,
        weeklyTrend: 5.7,
        monthlyTrend: 12.1,
        seasonalPattern: 'improving'
      },
      qualityDistribution: {
        'Premium': 15,
        'A': 65,
        'B': 18,
        'C': 2
      },
      topProducers: animals.slice(0, 3).map((animal, idx) => ({
        animalId: animal.id,
        totalProduction: 450 + idx * 50,
        averageDaily: 18 + idx * 2,
        peakProduction: 28 + idx * 3,
        currentTrend: ['increasing', 'stable', 'increasing'][idx] as any,
        efficiencyScore: 88 + idx * 4,
        qualityRating: 4.2 + idx * 0.3,
        seasonalVariation: 15 - idx * 2,
        lastMeasurement: new Date().toISOString().split('T')[0],
        projectedMonthly: 540 + idx * 60,
        costPerUnit: 0.45 - idx * 0.05,
        profitability: 42 + idx * 8
      })),
      speciesBreakdown: {
        cattle: { totalProduction: 1200, averagePerAnimal: 400, efficiency: 85 },
        chicken: { totalProduction: 450, averagePerAnimal: 90, efficiency: 78 },
        sheep: { totalProduction: 120, averagePerAnimal: 60, efficiency: 72 }
      }
    };
    
    setAnalytics(mockAnalytics);
  };

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
      sheep: 'أغن��م',
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
    try {
      const recordData = {
        ...newRecord,
        quantity: parseFloat(newRecord.quantity),
        temperature: newRecord.temperature ? parseFloat(newRecord.temperature) : undefined,
        fat_content: newRecord.fat_content ? parseFloat(newRecord.fat_content) : undefined,
        protein_content: newRecord.protein_content ? parseFloat(newRecord.protein_content) : undefined,
        revenue: parseFloat(newRecord.quantity) * (newRecord.type === 'milk' ? 0.85 : 0.4)
      };

      // Add to mock data
      const newProductionRecord: ProductionRecord = {
        ...recordData,
        id: Date.now().toString(),
        price: newRecord.type === 'milk' ? 0.85 : 0.4,
        unit: newRecord.type === 'milk' ? 'liters' : newRecord.type === 'eggs' ? 'pieces' : 'kg'
      } as ProductionRecord;

      setProductionRecords([newProductionRecord, ...productionRecords]);
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
        protein_content: ''
      });
    } catch (error) {
      console.error('Error adding production record:', error);
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليلات الإنتاج الحيواني</h1>
          <p className="text-gray-600">مراقبة شاملة لإنتاج الحليب والبيض ونمو الحيوانات</p>
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

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإنتاج</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.overview.totalProduction.toFixed(0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                لتر/كيلو/قطعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الإنتاجية</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.overview.averageProductivity}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                من المستوى المثالي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أفضل المنتجين</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.overview.topPerformers}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                حيوان متميز
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(analytics.overview.revenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                إجمالي الشهر
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {analytics.overview.profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                معدل الربحية
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاتجاه الشهري</CardTitle>
              <LineChart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                +{analytics.trends.monthlyTrend.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                نمو الإنتاج
              </p>
            </CardContent>
          </Card>
        </div>
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
                            {data.averagePerAnimal}/حيوان | {data.efficiency}% كفاءة
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{analytics.trends.dailyTrend}%
                    </div>
                    <p className="text-sm text-gray-600">الاتجاه اليومي</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      +{analytics.trends.weeklyTrend}%
                    </div>
                    <p className="text-sm text-gray-600">الاتجاه الأسبوعي</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      +{analytics.trends.monthlyTrend}%
                    </div>
                    <p className="text-sm text-gray-600">الاتجاه الشهري</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.trends.seasonalPattern === 'improving' ? 'تحسن' :
                       analytics.trends.seasonalPattern === 'peak' ? 'ذروة' :
                       analytics.trends.seasonalPattern === 'declining' ? 'انخفاض' : 'مستقر'}
                    </div>
                    <p className="text-sm text-gray-600">النمط الموسمي</p>
                  </div>
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
                        {getTrendIcon(producer.currentTrend)}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {producer.efficiencyScore}%
                          </div>
                          <p className="text-xs text-gray-600">كفاءة الإنتاج</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {producer.totalProduction.toFixed(0)}
                        </div>
                        <p className="text-xs text-gray-600">إجمالي الإنتاج</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {producer.averageDaily.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-600">متوسط يومي</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {producer.qualityRating.toFixed(1)}/5
                        </div>
                        <p className="text-xs text-gray-600">تقييم الجودة</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                          {producer.profitability.toFixed(0)}%
                        </div>
                        <p className="text-xs text-gray-600">الربحية</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        آخر قياس: {new Date(producer.lastMeasurement).toLocaleDateString('ar-TN')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">التوقع الشهري: </span>
                        <span className="text-green-600 font-bold">
                          {producer.projectedMonthly.toFixed(0)}
                        </span>
                      </div>
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
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {record.quantity.toFixed(1)} {record.unit}
                        </div>
                        {record.revenue && (
                          <p className="text-sm text-green-600">
                            {formatCurrency(record.revenue)}
                          </p>
                        )}
                        {record.fat_content && (
                          <p className="text-xs text-gray-600">
                            دهون: {record.fat_content.toFixed(1)}% | بروتين: {record.protein_content?.toFixed(1)}%
                          </p>
                        )}
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
