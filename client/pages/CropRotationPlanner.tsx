import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Calendar, 
  TrendingUp,
  Leaf,
  Target,
  BarChart3,
  Clock,
  Award,
  Sprout,
  Droplets,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Plus,
  Eye,
  Lightbulb,
  Activity,
  Gauge
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface RotationPhase {
  year: number;
  season: string;
  crop: string;
  purpose: 'main' | 'cover' | 'legume' | 'fallow';
  benefits: string[];
  estimatedYield?: number;
  estimatedProfit?: number;
  waterRequirement?: number;
  laborIntensity?: 'low' | 'medium' | 'high';
}

interface RotationPlan {
  id: string;
  title: string;
  duration: number;
  phases: RotationPhase[];
  benefits: string[];
  estimatedProfit: number;
  soilImprovementScore: number;
  sustainabilityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  waterEfficiency: number;
  laborRequirement: number;
}

interface SoilImpactAnalysis {
  nutrientBalance: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  soilHealthTrend: number[];
  organicMatterChange: number;
  erosionReduction: number;
  biodiversityIndex: number;
}

const purposeColors = {
  main: 'bg-green-500',
  cover: 'bg-blue-500',
  legume: 'bg-purple-500',
  fallow: 'bg-gray-500'
};

const purposeTranslation = {
  main: 'محصول رئيسي',
  cover: 'محصول تغطية',
  legume: 'بقوليات',
  fallow: 'إراحة'
};

const seasonTranslation = {
  winter: 'شتاء',
  spring: 'ربيع',
  summer: 'صيف',
  autumn: 'خريف'
};

const riskColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-red-600 bg-red-100'
};

const complexityColors = {
  simple: 'text-blue-600 bg-blue-100',
  moderate: 'text-yellow-600 bg-yellow-100',
  complex: 'text-red-600 bg-red-100'
};

export default function CropRotationPlanner() {
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RotationPlan | null>(null);
  const [soilImpact, setSoilImpact] = useState<SoilImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [customRotation, setCustomRotation] = useState<RotationPhase[]>([]);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  useEffect(() => {
    fetchRotationPlans();
  }, []);

  const fetchRotationPlans = async () => {
    setLoading(true);
    try {
      // Generate comprehensive rotation plans
      const plans = generateRotationPlans();
      setRotationPlans(plans);
      
      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
        setSoilImpact(generateSoilImpactAnalysis(plans[0]));
      }
    } catch (error) {
      console.error('Error fetching rotation plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRotationPlans = (): RotationPlan[] => {
    return [
      {
        id: 'rotation_traditional_2year',
        title: 'الدورة التقليدية - سنتان',
        duration: 2,
        phases: [
          {
            year: 1,
            season: 'شتاء',
            crop: 'القمح الصلب',
            purpose: 'main',
            benefits: ['إنتاج رئيسي', 'تحسين بنية التربة', 'مصدر دخل مستقر'],
            estimatedYield: 3.5,
            estimatedProfit: 2800,
            waterRequirement: 400,
            laborIntensity: 'medium'
          },
          {
            year: 1,
            season: 'صيف',
            crop: 'البقوليات (فول)',
            purpose: 'legume',
            benefits: ['تثبيت النيتروجين', 'تحسين خصوبة التربة', 'كسر دورة الآفات'],
            estimatedYield: 2.0,
            estimatedProfit: 1500,
            waterRequirement: 300,
            laborIntensity: 'low'
          },
          {
            year: 2,
            season: 'شتاء',
            crop: 'الشعير',
            purpose: 'main',
            benefits: ['مقاوم للجفاف', 'علف للمواشي', 'تنويع الإنتاج'],
            estimatedYield: 3.0,
            estimatedProfit: 2200,
            waterRequirement: 350,
            laborIntensity: 'medium'
          },
          {
            year: 2,
            season: 'صيف',
            crop: 'إراحة التربة',
            purpose: 'fallow',
            benefits: ['راحة للتربة', 'تجميع المياه', 'تقليل الآفات'],
            estimatedYield: 0,
            estimatedProfit: -200,
            waterRequirement: 0,
            laborIntensity: 'low'
          }
        ],
        benefits: [
          'دورة مثبتة ومجربة محلياً',
          'متطلبات مائية معتدلة',
          'مناسبة للمزارعين المبتدئين',
          'تحسين خصوبة التربة طبيعياً'
        ],
        estimatedProfit: 6300,
        soilImprovementScore: 78,
        sustainabilityScore: 85,
        riskLevel: 'low',
        complexity: 'simple',
        waterEfficiency: 80,
        laborRequirement: 65
      },
      {
        id: 'rotation_intensive_3year',
        title: 'الدورة المكثفة - ثلاث سنوات',
        duration: 3,
        phases: [
          {
            year: 1,
            season: 'شتاء',
            crop: 'القمح الصلب',
            purpose: 'main',
            benefits: ['إنتاج عالي الجودة', 'طلب سوقي مستقر'],
            estimatedYield: 4.0,
            estimatedProfit: 3200,
            waterRequirement: 450,
            laborIntensity: 'medium'
          },
          {
            year: 1,
            season: 'صيف',
            crop: 'البطاطا',
            purpose: 'main',
            benefits: ['ربح سريع', 'تحسين تهوية التربة', 'دورة قصيرة'],
            estimatedYield: 25,
            estimatedProfit: 8500,
            waterRequirement: 500,
            laborIntensity: 'high'
          },
          {
            year: 2,
            season: 'شتاء',
            crop: 'البقوليات (حمص)',
            purpose: 'legume',
            benefits: ['تثبيت النيتروجين', 'قيمة غذائية عالية', 'طلب محلي'],
            estimatedYield: 1.8,
            estimatedProfit: 2700,
            waterRequirement: 350,
            laborIntensity: 'medium'
          },
          {
            year: 2,
            season: 'صيف',
            crop: 'الطماطم',
            purpose: 'main',
            benefits: ['ربحية عالية', 'استغلال الأسمدة المتبقية'],
            estimatedYield: 50,
            estimatedProfit: 15000,
            waterRequirement: 600,
            laborIntensity: 'high'
          },
          {
            year: 3,
            season: 'شتاء',
            crop: 'الشعير',
            purpose: 'main',
            benefits: ['تنظيف التربة', 'مقاوم للظروف الصعبة'],
            estimatedYield: 3.2,
            estimatedProfit: 2400,
            waterRequirement: 300,
            laborIntensity: 'low'
          },
          {
            year: 3,
            season: 'صيف',
            crop: 'محصول تغطية',
            purpose: 'cover',
            benefits: ['حماية التربة', 'تحسين بنية التربة', 'مكافحة الأعشاب'],
            estimatedYield: 0,
            estimatedProfit: -400,
            waterRequirement: 200,
            laborIntensity: 'low'
          }
        ],
        benefits: [
          'أقصى استغلال للأرض والموارد',
          'تنويع مصادر الدخل',
          'تحسن كبير في خصوبة التربة',
          'مناسب للأسواق المتطورة'
        ],
        estimatedProfit: 31400,
        soilImprovementScore: 92,
        sustainabilityScore: 88,
        riskLevel: 'medium',
        complexity: 'complex',
        waterEfficiency: 75,
        laborRequirement: 85
      },
      {
        id: 'rotation_organic_4year',
        title: 'الدورة العضوية - أربع سنوات',
        duration: 4,
        phases: [
          {
            year: 1,
            season: 'شتاء',
            crop: 'القمح العضوي',
            purpose: 'main',
            benefits: ['قيمة عضوية عالية', 'سعر مميز', 'صحة التربة'],
            estimatedYield: 2.8,
            estimatedProfit: 4200,
            waterRequirement: 400,
            laborIntensity: 'medium'
          },
          {
            year: 1,
            season: 'صيف',
            crop: 'البقوليات المتنوعة',
            purpose: 'legume',
            benefits: ['تثبيت نيتروجين طبيعي', 'تنوع بيولوجي', 'مقاومة آفات'],
            estimatedYield: 1.5,
            estimatedProfit: 2250,
            waterRequirement: 300,
            laborIntensity: 'low'
          },
          {
            year: 2,
            season: 'شتاء',
            crop: 'الخضروات الورقية',
            purpose: 'main',
            benefits: ['استهلاك نيتروجين متراكم', 'ربح متوسط', 'دورة سريعة'],
            estimatedYield: 15,
            estimatedProfit: 6000,
            waterRequirement: 350,
            laborIntensity: 'high'
          },
          {
            year: 2,
            season: 'صيف',
            crop: 'محاصيل تغطية متنوعة',
            purpose: 'cover',
            benefits: ['حماية من التعرية', 'تحسين بنية التربة', 'علف أخضر'],
            estimatedYield: 0,
            estimatedProfit: -300,
            waterRequirement: 200,
            laborIntensity: 'low'
          },
          {
            year: 3,
            season: 'شتاء',
            crop: 'الشعير العضوي',
            purpose: 'main',
            benefits: ['تنظيف التربة', 'علف عضوي عالي الجودة'],
            estimatedYield: 2.5,
            estimatedProfit: 3000,
            waterRequirement: 300,
            laborIntensity: 'low'
          },
          {
            year: 3,
            season: 'صيف',
            crop: 'النباتات الطبية',
            purpose: 'main',
            benefits: ['قيمة اقتصادية مرتفعة', 'طلب متزايد', 'مقاومة طبيعية'],
            estimatedYield: 0.8,
            estimatedProfit: 4800,
            waterRequirement: 250,
            laborIntensity: 'medium'
          },
          {
            year: 4,
            season: 'شتاء',
            crop: 'إراحة مع أعشاب طبيعية',
            purpose: 'fallow',
            benefits: ['تجديد التربة', 'تجميع العناصر الغذائية', 'راحة للمزارع'],
            estimatedYield: 0,
            estimatedProfit: -200,
            waterRequirement: 100,
            laborIntensity: 'low'
          },
          {
            year: 4,
            season: 'صيف',
            crop: 'إراحة مع أعشاب طبيعية',
            purpose: 'fallow',
            benefits: ['استكمال دورة التجديد', 'تحضير للدورة التالية'],
            estimatedYield: 0,
            estimatedProfit: -200,
            waterRequirement: 100,
            laborIntensity: 'low'
          }
        ],
        benefits: [
          'إنتاج عضوي معتمد',
          'تحسين صحة التربة على المدى الطويل',
          'تنوع بيولوجي عالي',
          'استدامة بيئية ممتازة',
          'مقاومة طبيعية للآفات والأمراض'
        ],
        estimatedProfit: 19550,
        soilImprovementScore: 96,
        sustainabilityScore: 95,
        riskLevel: 'low',
        complexity: 'moderate',
        waterEfficiency: 90,
        laborRequirement: 70
      },
      {
        id: 'rotation_water_efficient',
        title: 'الدورة الموفرة للمياه',
        duration: 3,
        phases: [
          {
            year: 1,
            season: 'شتاء',
            crop: 'الشعير المقاوم للجفاف',
            purpose: 'main',
            benefits: ['متطلبات مائية منخفضة', 'مقاوم للجفاف', 'علف ممتاز'],
            estimatedYield: 3.0,
            estimatedProfit: 2400,
            waterRequirement: 250,
            laborIntensity: 'low'
          },
          {
            year: 1,
            season: 'صيف',
            crop: 'البقوليات الصحراوية',
            purpose: 'legume',
            benefits: ['تثبيت النيتروجين', 'مقاومة الجفاف', 'تحسين التربة'],
            estimatedYield: 1.2,
            estimatedProfit: 1800,
            waterRequirement: 200,
            laborIntensity: 'low'
          },
          {
            year: 2,
            season: 'شتاء',
            crop: 'الزيتون الصغير',
            purpose: 'main',
            benefits: ['استثمار طويل ال��دى', 'مقاوم للجفاف', 'قيمة عالية'],
            estimatedYield: 2.0,
            estimatedProfit: 3000,
            waterRequirement: 300,
            laborIntensity: 'medium'
          },
          {
            year: 2,
            season: 'صيف',
            crop: 'نباتات عطرية',
            purpose: 'main',
            benefits: ['قيمة اقتصادية عالية', 'مقاومة الجفاف', 'طلب تصديري'],
            estimatedYield: 0.5,
            estimatedProfit: 4000,
            waterRequirement: 150,
            laborIntensity: 'medium'
          },
          {
            year: 3,
            season: 'شتاء',
            crop: 'الحبوب الجافة',
            purpose: 'main',
            benefits: ['تخزين طويل', 'مقاومة الجفاف', 'قيمة غذائية'],
            estimatedYield: 1.8,
            estimatedProfit: 2700,
            waterRequirement: 200,
            laborIntensity: 'low'
          },
          {
            year: 3,
            season: 'صيف',
            crop: 'إراحة بمهاد طبيعي',
            purpose: 'fallow',
            benefits: ['حفظ الرطوبة', 'تجميع المياه', 'حماية من التبخر'],
            estimatedYield: 0,
            estimatedProfit: -100,
            waterRequirement: 50,
            laborIntensity: 'low'
          }
        ],
        benefits: [
          'توفير كبير في استهلاك المياه',
          'مناسب للمناطق الجافة',
          'مقاومة عالية للتغيرات المناخية',
          'تكاليف ري منخفضة'
        ],
        estimatedProfit: 13800,
        soilImprovementScore: 82,
        sustainabilityScore: 92,
        riskLevel: 'low',
        complexity: 'moderate',
        waterEfficiency: 95,
        laborRequirement: 50
      }
    ];
  };

  const generateSoilImpactAnalysis = (plan: RotationPlan): SoilImpactAnalysis => {
    return {
      nutrientBalance: {
        nitrogen: 15 + Math.random() * 10,
        phosphorus: 8 + Math.random() * 6,
        potassium: 12 + Math.random() * 8
      },
      soilHealthTrend: Array.from({ length: plan.duration * 2 }, (_, i) => 
        70 + i * 3 + Math.random() * 5
      ),
      organicMatterChange: 0.3 + Math.random() * 0.5,
      erosionReduction: 40 + Math.random() * 30,
      biodiversityIndex: 60 + Math.random() * 25
    };
  };

  const getPlanComparison = () => {
    return rotationPlans.map(plan => ({
      name: plan.title,
      profit: plan.estimatedProfit,
      soilHealth: plan.soilImprovementScore,
      sustainability: plan.sustainabilityScore,
      waterEfficiency: plan.waterEfficiency,
      laborRequirement: plan.laborRequirement
    }));
  };

  const getSeasonalDistribution = (plan: RotationPlan) => {
    const seasons = { winter: 0, spring: 0, summer: 0, autumn: 0 };
    plan.phases.forEach(phase => {
      if (phase.season in seasons) {
        seasons[phase.season as keyof typeof seasons]++;
      }
    });
    
    return Object.entries(seasons).map(([season, count]) => ({
      season: seasonTranslation[season as keyof typeof seasonTranslation],
      count,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Object.keys(seasons).indexOf(season)]
    }));
  };

  const addCustomPhase = () => {
    const newPhase: RotationPhase = {
      year: 1,
      season: 'شتاء',
      crop: 'اختر المحصول',
      purpose: 'main',
      benefits: ['فائدة جديدة'],
      laborIntensity: 'medium'
    };
    setCustomRotation([...customRotation, newPhase]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحليل خطط الدورة الزراعية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            مخطط الدورة الزراعية الذكي
          </h1>
          <p className="text-muted-foreground">نظام متطور لتخطيط دورات زراعية مستدامة ومربحة</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            variant="outline"
          >
            <Plus className="w-4 h-4 ml-2" />
            إنشاء دورة مخصصة
          </Button>
          <Button onClick={fetchRotationPlans} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث الخطط
          </Button>
        </div>
      </div>

      {/* Plans Overview */}
      {rotationPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">خطط متاحة</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rotationPlans.length}</div>
              <p className="text-xs text-muted-foreground">دورات مختلفة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أعلى ربحية</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...rotationPlans.map(p => p.estimatedProfit)).toLocaleString()} د.ت
              </div>
              <p className="text-xs text-muted-foreground">أفضل عائد</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أفضل استدامة</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...rotationPlans.map(p => p.sustainabilityScore))}%
              </div>
              <p className="text-xs text-muted-foreground">نقاط استدامة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">كفاءة المياه</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(...rotationPlans.map(p => p.waterEfficiency))}%
              </div>
              <p className="text-xs text-muted-foreground">توفير مياه</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">خطط الدورة</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المفصل</TabsTrigger>
          <TabsTrigger value="comparison">المقارنة</TabsTrigger>
          <TabsTrigger value="builder">منشئ مخصص</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Rotation Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rotationPlans.map((plan) => (
              <Card key={plan.id} className={`transition-all hover:shadow-lg ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{plan.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {plan.duration} سنوات
                        </Badge>
                        <Badge className={`${riskColors[plan.riskLevel]} border-0`}>
                          مخاطر {plan.riskLevel === 'low' ? 'منخفضة' : plan.riskLevel === 'medium' ? 'متوسطة' : 'عالية'}
                        </Badge>
                        <Badge className={`${complexityColors[plan.complexity]} border-0`}>
                          {plan.complexity === 'simple' ? 'بسيط' : plan.complexity === 'moderate' ? 'متوسط' : 'معقد'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">الربح الإجمالي</p>
                        <p className="font-bold text-green-600">{plan.estimatedProfit.toLocaleString()} د.ت</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">تحسين التربة</p>
                        <p className="font-bold text-blue-600">{plan.soilImprovementScore}%</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">الاستدامة</p>
                        <p className="font-bold text-purple-600">{plan.sustainabilityScore}%</p>
                      </div>
                    </div>

                    {/* Efficiency Indicators */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>كفاءة المياه:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={plan.waterEfficiency} className="w-16 h-2" />
                          <span className="font-medium">{plan.waterEfficiency}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>متطلبات العمالة:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={plan.laborRequirement} className="w-16 h-2" />
                          <span className="font-medium">{plan.laborRequirement}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase Preview */}
                    <div>
                      <h4 className="font-medium mb-2 text-sm">نظرة على الدورة:</h4>
                      <div className="flex flex-wrap gap-1">
                        {plan.phases.slice(0, 4).map((phase, index) => (
                          <div
                            key={index}
                            className={`px-2 py-1 rounded text-xs text-white ${purposeColors[phase.purpose]}`}
                          >
                            {phase.crop}
                          </div>
                        ))}
                        {plan.phases.length > 4 && (
                          <div className="px-2 py-1 rounded text-xs bg-gray-300 text-gray-700">
                            +{plan.phases.length - 4} أخرى
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Benefits Preview */}
                    <div>
                      <h4 className="font-medium mb-2 text-sm">الفوائد الرئيسية:</h4>
                      <ul className="text-sm space-y-1">
                        {plan.benefits.slice(0, 2).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setSoilImpact(generateSoilImpactAnalysis(plan));
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        تفاصيل
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Calendar className="w-4 h-4 ml-1" />
                        تطبيق
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {selectedPlan && soilImpact && (
            <>
              {/* Selected Plan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    تحليل مفصل: {selectedPlan.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Phase Timeline */}
                    <div>
                      <h4 className="font-medium mb-4">جدول الدورة الزراعية</h4>
                      <div className="space-y-3">
                        {selectedPlan.phases.map((phase, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${purposeColors[phase.purpose]}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{phase.crop}</span>
                                <Badge variant="outline" className="text-xs">
                                  سنة {phase.year} - {phase.season}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {purposeTranslation[phase.purpose]}
                              </p>
                              {phase.estimatedYield && (
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span>إنتاج: {phase.estimatedYield} طن</span>
                                  <span>ربح: {phase.estimatedProfit?.toLocaleString()} د.ت</span>
                                  <span>مياه: {phase.waterRequirement} مم</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soil Health Trend */}
                    <div>
                      <h4 className="font-medium mb-4">اتجاه صحة التربة</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={soilImpact.soilHealthTrend.map((value, index) => ({
                          period: `فترة ${index + 1}`,
                          health: value
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="health" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soil Impact Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      تأثير على العناصر الغذائية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>النيتروجين:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={soilImpact.nutrientBalance.nitrogen * 5} className="w-24 h-2" />
                          <span className="font-medium text-green-600">+{soilImpact.nutrientBalance.nitrogen.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الفوسفور:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={soilImpact.nutrientBalance.phosphorus * 7} className="w-24 h-2" />
                          <span className="font-medium text-blue-600">+{soilImpact.nutrientBalance.phosphorus.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>البوتاسيوم:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={soilImpact.nutrientBalance.potassium * 6} className="w-24 h-2" />
                          <span className="font-medium text-purple-600">+{soilImpact.nutrientBalance.potassium.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      مؤشرات الاستدامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>زيادة المادة العضوية:</span>
                        <span className="font-bold text-green-600">+{soilImpact.organicMatterChange.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>تقليل التعرية:</span>
                        <span className="font-bold text-blue-600">{soilImpact.erosionReduction.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>مؤشر التنوع البيولوجي:</span>
                        <span className="font-bold text-purple-600">{soilImpact.biodiversityIndex.toFixed(0)}/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Plans Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>مقارنة خطط الدورة الزراعية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getPlanComparison()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#10b981" name="الربح (د.ت)" />
                  <Bar dataKey="soilHealth" fill="#3b82f6" name="صحة التربة (%)" />
                  <Bar dataKey="sustainability" fill="#8b5cf6" name="الاستدامة (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Distribution */}
          {selectedPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>التوزيع الموسمي - {selectedPlan.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getSeasonalDistribution(selectedPlan)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ season, count }) => `${season}: ${count}`}
                      >
                        {getSeasonalDistribution(selectedPlan).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>مقارنة الكفاءة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rotationPlans.map((plan) => (
                      <div key={plan.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{plan.title}</h4>
                          <Badge variant="outline">{plan.duration} سنوات</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">كفاءة المياه:</span>
                            <Progress value={plan.waterEfficiency} className="mt-1" />
                          </div>
                          <div>
                            <span className="text-muted-foreground">الاستدامة:</span>
                            <Progress value={plan.sustainabilityScore} className="mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                منشئ الدورة المخصصة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">مراحل الدورة الزراعية</h4>
                  <Button onClick={addCustomPhase} size="sm">
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة مرحلة
                  </Button>
                </div>
                
                {customRotation.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2" />
                    <p>ابدأ ببناء دورة زراعية مخصصة</p>
                    <p className="text-sm">أضف المراحل والمحاصيل حسب احتياجاتك</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customRotation.map((phase, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <select
                            value={phase.year}
                            onChange={(e) => {
                              const updated = [...customRotation];
                              updated[index].year = parseInt(e.target.value);
                              setCustomRotation(updated);
                            }}
                            className="px-3 py-2 border rounded-md bg-background"
                          >
                            <option value={1}>السنة الأولى</option>
                            <option value={2}>السنة الثانية</option>
                            <option value={3}>السنة الثالثة</option>
                            <option value={4}>السنة الرابعة</option>
                          </select>
                          
                          <select
                            value={phase.season}
                            onChange={(e) => {
                              const updated = [...customRotation];
                              updated[index].season = e.target.value;
                              setCustomRotation(updated);
                            }}
                            className="px-3 py-2 border rounded-md bg-background"
                          >
                            <option value="شتاء">شتاء</option>
                            <option value="ربيع">ربيع</option>
                            <option value="صيف">صيف</option>
                            <option value="خريف">خريف</option>
                          </select>
                          
                          <input
                            type="text"
                            value={phase.crop}
                            onChange={(e) => {
                              const updated = [...customRotation];
                              updated[index].crop = e.target.value;
                              setCustomRotation(updated);
                            }}
                            placeholder="اسم المحصول"
                            className="px-3 py-2 border rounded-md bg-background"
                          />
                          
                          <select
                            value={phase.purpose}
                            onChange={(e) => {
                              const updated = [...customRotation];
                              updated[index].purpose = e.target.value as any;
                              setCustomRotation(updated);
                            }}
                            className="px-3 py-2 border rounded-md bg-background"
                          >
                            <option value="main">محص��ل رئيسي</option>
                            <option value="cover">محصول تغطية</option>
                            <option value="legume">بقوليات</option>
                            <option value="fallow">إراحة</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {customRotation.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCustomRotation([])}>
                      إعادة تعيين
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 ml-1" />
                      حفظ الدورة المخصصة
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
