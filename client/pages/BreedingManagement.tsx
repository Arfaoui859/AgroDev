import { apiFetch } from '@/lib/apiFetch';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Users, 
  TrendingUp, 
  Baby, 
  Plus,
  Target,
  Activity,
  Dna,
  Award,
  Timer,
  BarChart3
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { SimulatedDataNotice } from '@/components/SimulatedDataNotice';

interface BreedingRecord {
  matingDate: string;
  partner: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  offspring?: string[];
  complications?: string;
  success: boolean;
}

interface Animal {
  id: string;
  earTag: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  breedingStatus: 'active' | 'pregnant' | 'nursing' | 'inactive';
  breedingHistory: BreedingRecord[];
  geneticScore: number;
  productivityScore: number;
  currentValue?: number;
}

interface BreedingPlan {
  id: string;
  femaleId: string;
  maleId: string;
  plannedDate: string;
  breedingGoal: 'milk_production' | 'meat_quality' | 'disease_resistance' | 'fertility';
  expectedOutcome: {
    geneticImprovement: number;
    productivityIncrease: number;
    marketValue: number;
  };
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
}

interface GeneticProfile {
  traitName: string;
  score: number;
  inheritance: 'dominant' | 'recessive' | 'codominant';
  marketImportance: number;
}

const breedingStatusTranslation = {
  active: 'نشط',
  pregnant: 'حامل',
  nursing: 'مرضع',
  inactive: 'غير نشط'
};

const breedingGoalTranslation = {
  milk_production: 'إنتاج الحليب',
  meat_quality: 'جودة اللحم',
  disease_resistance: 'مقاومة الأمراض',
  fertility: 'الخصوبة'
};

const statusColors = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

export default function BreedingManagement() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [breedingPlans, setBreedingPlans] = useState<BreedingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');

  useEffect(() => {
    fetchBreedingData();
  }, []);

  const fetchBreedingData = async () => {
    try {
      const response = await apiFetch('/api/livestock-management/animals');
      const data = await response.json();

      if (data.success) {
        // The herd comes from the backend (a simulated demo dataset); scores are
        // derived from each animal's real breeding history rather than invented
        // per render, so the same animal always shows the same score.
        const herd: Animal[] = (data.data ?? []).map(withDerivedScores);
        setAnimals(herd);
        setBreedingPlans(generateBreedingPlans(herd));
        setIsSimulated(data.isRealData === false);
      }
    } catch (error) {
      console.error('Error fetching breeding data:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const withDerivedScores = (animal: Animal): Animal => {
    const history = animal.breedingHistory ?? [];
    const total = history.length;
    const successes = history.filter((r) => r.success).length;
    const successRate = total > 0 ? successes / total : 0.5;
    return {
      ...animal,
      geneticScore:
        Math.round((70 + successRate * 25 + Math.min(total, 3) * 1.5) * 10) / 10,
      productivityScore:
        Math.round((60 + successRate * 30 + (total > 0 ? 5 : 0)) * 10) / 10,
    };
  };

  /**
   * Pairing proposals are a deterministic function of the herd: active females
   * are matched with active males in order, and expected outcomes are computed
   * from the animals' derived scores. Nothing here is random, so the plans are
   * reproducible and traceable to real animals.
   */
  const generateBreedingPlans = (animalsList: Animal[]): BreedingPlan[] => {
    const females = animalsList.filter(
      (a) => a.gender === 'female' && a.breedingStatus === 'active',
    );
    const males = animalsList.filter(
      (a) => a.gender === 'male' && a.breedingStatus === 'active',
    );
    if (males.length === 0) return [];

    return females.slice(0, 6).map((female, index) => {
      const male = males[index % males.length];
      const plannedDate = addDays(new Date(), 7 + index * 7);
      const avgScore = (female.geneticScore + male.geneticScore) / 2;
      return {
        id: `plan_${female.id}_${male.id}`,
        femaleId: female.id,
        maleId: male.id,
        plannedDate: plannedDate.toISOString().split('T')[0],
        breedingGoal: (['milk_production', 'meat_quality', 'disease_resistance', 'fertility'][
          index % 4
        ]) as BreedingPlan['breedingGoal'],
        expectedOutcome: {
          geneticImprovement:
            Math.round(Math.max(0, (male.geneticScore - female.geneticScore) / 10) * 10) / 10,
          productivityIncrease:
            Math.round(((female.productivityScore + male.productivityScore) / 2 - 60) / 10 * 10) /
            10,
          marketValue: Math.round(avgScore * 100),
        },
        status: 'planned' as const,
      };
    });
  };

  const getBreedingStatistics = () => {
    const totalFemales = animals.filter(a => a.gender === 'female').length;
    const pregnantAnimals = animals.filter(a => a.breedingStatus === 'pregnant').length;
    const nursingAnimals = animals.filter(a => a.breedingStatus === 'nursing').length;
    const activeBreeding = animals.filter(a => a.breedingStatus === 'active').length;
    
    const successfulBreedings = animals.reduce((sum, animal) => {
      return sum + animal.breedingHistory.filter(record => record.success).length;
    }, 0);
    
    const totalBreedings = animals.reduce((sum, animal) => {
      return sum + animal.breedingHistory.length;
    }, 0);
    
    const successRate = totalBreedings > 0 ? Math.round((successfulBreedings / totalBreedings) * 100) : 0;
    
    return {
      totalFemales,
      pregnantAnimals,
      nursingAnimals,
      activeBreeding,
      successRate,
      upcomingDeliveries: getUpcomingDeliveries().length
    };
  };

  const getUpcomingDeliveries = () => {
    const upcoming: { animal: Animal; expectedDate: string }[] = [];
    
    animals.forEach(animal => {
      if (animal.breedingStatus === 'pregnant') {
        const lastBreeding = animal.breedingHistory[0];
        if (lastBreeding && lastBreeding.expectedDelivery) {
          const expectedDate = new Date(lastBreeding.expectedDelivery);
          const today = new Date();
          const daysUntilDue = differenceInDays(expectedDate, today);
          
          if (daysUntilDue >= -7 && daysUntilDue <= 30) {
            upcoming.push({
              animal,
              expectedDate: lastBreeding.expectedDelivery
            });
          }
        }
      }
    });
    
    return upcoming.sort((a, b) => 
      new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
    );
  };

  /**
   * The herd carries no dated genetic measurements, so a month-by-month
   * "genetic improvement" curve cannot be computed. Show the current score
   * distribution across the real herd instead, which the data supports.
   */
  const getGeneticTrends = () => {
    return animals
      .filter((a) => a.gender === 'female')
      .slice(0, 12)
      .map((animal) => ({
        month: animal.earTag,
        geneticScore: animal.geneticScore,
        productivity: animal.productivityScore,
        marketValue: animal.currentValue ?? 0,
      }));
  };

  const getTopPerformers = () => {
    return animals
      .filter(a => a.gender === 'female')
      .sort((a, b) => (b.geneticScore + b.productivityScore) - (a.geneticScore + a.productivityScore))
      .slice(0, 5)
      .map(animal => ({
        ...animal,
        totalScore: animal.geneticScore + animal.productivityScore,
        successfulBreedings: animal.breedingHistory.filter(r => r.success).length
      }));
  };

  const breedingStats = getBreedingStatistics();
  const upcomingDeliveries = getUpcomingDeliveries();
  const geneticTrends = getGeneticTrends();
  const topPerformers = getTopPerformers();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل بيانات إدارة التناسل...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            تعذّر تحميل بيانات التناسل
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            تحقّق من اتصال الخادم ثم أعد المحاولة.
          </p>
          <Button className="mt-4" onClick={fetchBreedingData}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">إدارة التناسل والوراثة</h1>
          <p className="text-muted-foreground">نظام متكامل لإدارة دورات التناسل وتحسين الصفات الوراثية</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-2" />
          خطة تناسل جديدة
        </Button>
      </div>

      {isSimulated && <SimulatedDataNotice />}

      {/* Breeding Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إناث التناسل</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{breedingStats.totalFemales}</div>
            <p className="text-xs text-muted-foreground">جميع الإناث المسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات الحامل</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{breedingStats.pregnantAnimals}</div>
            <p className="text-xs text-muted-foreground">في فترة الحمل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{breedingStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">نسبة نجاح التناسل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الولادات المقررة</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{breedingStats.upcomingDeliveries}</div>
            <p className="text-xs text-muted-foreground">خلال 30 يوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deliveries */}
      {upcomingDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              الولادات المقررة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeliveries.map((delivery, index) => {
                const daysUntilDue = differenceInDays(new Date(delivery.expectedDate), new Date());
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        daysUntilDue <= 0 ? 'bg-red-500' :
                        daysUntilDue <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{delivery.animal.earTag} - {delivery.animal.breed}</h4>
                        <p className="text-sm text-muted-foreground">
                          متوقع: {format(new Date(delivery.expectedDate), 'PPP', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={daysUntilDue <= 0 ? 'destructive' : daysUntilDue <= 7 ? 'secondary' : 'outline'}>
                        {daysUntilDue <= 0 ? 'متأخر' : `${daysUntilDue} يوم`}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4 ml-1" />
                        تفاصيل
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">خطط التناسل</TabsTrigger>
          <TabsTrigger value="genetics">التحليل الوراثي</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {breedingPlans.map((plan) => {
              const female = animals.find(a => a.id === plan.femaleId);
              const male = animals.find(a => a.id === plan.maleId);
              
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          خطة تناسل {female?.earTag} × {male?.earTag}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          الهدف: {breedingGoalTranslation[plan.breedingGoal]}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[plan.status]} text-white border-0`}
                      >
                        {plan.status === 'planned' ? 'مخطط' :
                         plan.status === 'in_progress' ? 'جاري' :
                         plan.status === 'completed' ? 'مكتمل' : 'فاشل'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">الأنثى:</span>
                          <p className="font-medium">{female?.earTag} - {female?.breed}</p>
                          <p className="text-xs text-muted-foreground">
                            وراثة: {female?.geneticScore}/100 | إنتاجية: {female?.productivityScore}/100
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الذكر:</span>
                          <p className="font-medium">{male?.earTag} - {male?.breed}</p>
                          <p className="text-xs text-muted-foreground">
                            وراثة: {male?.geneticScore}/100 | إنتاجية: {male?.productivityScore}/100
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">موعد التناسل:</span>
                          <p className="font-medium">{format(new Date(plan.plannedDate), 'PPP', { locale: ar })}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">القيمة المتوقعة:</span>
                          <p className="font-medium">{plan.expectedOutcome.marketValue.toLocaleString()} د.ت</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">النتائج المتوقعة:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>التحسن الوراثي: +{plan.expectedOutcome.geneticImprovement}%</div>
                          <div>زيادة الإنتاجية: +{plan.expectedOutcome.productivityIncrease}%</div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        تفاصيل الخطة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="genetics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genetic Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  اتجاهات التحسن الوراثي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={geneticTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="geneticScore" stroke="#8884d8" name="النقاط الوراثية" />
                    <Line type="monotone" dataKey="productivity" stroke="#82ca9d" name="الإنتاجية" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  أفضل الحيوانات أداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((animal, index) => (
                    <div key={animal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{animal.earTag}</h4>
                          <p className="text-sm text-muted-foreground">{animal.breed}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{animal.totalScore.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">{animal.successfulBreedings} نجاح</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تحليل الأداء التناسلي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geneticTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="marketValue" fill="#8884d8" name="القيمة السوقية" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تقويم التناسل</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أحداث التناسل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  اختر تاريخاً من التقويم لعرض الأحداث المجدولة
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
