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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');

  useEffect(() => {
    fetchBreedingData();
  }, []);

  const fetchBreedingData = async () => {
    try {
      const response = await fetch('/api/livestock-management/breeding-schedule');
      const data = await response.json();
      
      if (data.success) {
        // Generate enhanced breeding data
        const enhancedAnimals = generateEnhancedBreedingData();
        setAnimals(enhancedAnimals);
        setBreedingPlans(generateBreedingPlans(enhancedAnimals));
      }
    } catch (error) {
      console.error('Error fetching breeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEnhancedBreedingData = (): Animal[] => {
    const breeds = {
      cattle: ['هولشتاين', 'فريزيان', 'جيرسي', 'سيمينتال'],
      sheep: ['أواسي', 'ماريشان', 'مريني', 'دورسيت'],
      goat: ['شامي', 'مالطي', 'بوير', 'سانين']
    };

    return Array.from({ length: 20 }, (_, i) => {
      const species = ['cattle', 'sheep', 'goat'][i % 3] as keyof typeof breeds;
      const breed = breeds[species][Math.floor(Math.random() * breeds[species].length)];
      const gender = Math.random() > 0.7 ? 'male' : 'female';
      const birthDate = new Date(2019 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
      
      return {
        id: `animal_${i + 1}`,
        earTag: `TN${String(i + 1).padStart(4, '0')}`,
        species,
        breed,
        gender,
        birthDate: birthDate.toISOString().split('T')[0],
        breedingStatus: gender === 'female' ? 
          ['active', 'pregnant', 'nursing', 'inactive'][Math.floor(Math.random() * 4)] as any :
          Math.random() > 0.8 ? 'inactive' : 'active',
        breedingHistory: generateBreedingHistory(),
        geneticScore: Math.round((70 + Math.random() * 30) * 10) / 10,
        productivityScore: Math.round((60 + Math.random() * 40) * 10) / 10
      };
    });
  };

  const generateBreedingHistory = (): BreedingRecord[] => {
    const historyCount = Math.floor(Math.random() * 4);
    return Array.from({ length: historyCount }, (_, i) => {
      const matingDate = new Date(Date.now() - (i + 1) * 300 * 24 * 60 * 60 * 1000);
      const gestationPeriod = 280; // days for cattle
      const expectedDelivery = addDays(matingDate, gestationPeriod);
      const success = Math.random() > 0.2;
      
      return {
        matingDate: matingDate.toISOString().split('T')[0],
        partner: `animal_${Math.floor(Math.random() * 10) + 1}`,
        expectedDelivery: expectedDelivery.toISOString().split('T')[0],
        actualDelivery: success ? addDays(expectedDelivery, Math.floor(Math.random() * 14) - 7).toISOString().split('T')[0] : undefined,
        offspring: success ? [`offspring_${Math.random().toString(36).substr(2, 5)}`] : undefined,
        complications: !success || Math.random() > 0.8 ? getRandomComplication() : undefined,
        success
      };
    });
  };

  const getRandomComplication = (): string => {
    const complications = [
      'تأخر في الولادة',
      'صعوبة في الولادة',
      'مشاكل في الرضاعة',
      'ضعف المولود',
      'التهابات بعد الولادة',
      'نقص في الحليب'
    ];
    return complications[Math.floor(Math.random() * complications.length)];
  };

  const generateBreedingPlans = (animalsList: Animal[]): BreedingPlan[] => {
    const plans: BreedingPlan[] = [];
    const females = animalsList.filter(a => a.gender === 'female' && a.breedingStatus === 'active');
    const males = animalsList.filter(a => a.gender === 'male' && a.breedingStatus === 'active');
    
    females.slice(0, 6).forEach((female, index) => {
      const male = males[index % males.length];
      if (male) {
        const plannedDate = addDays(new Date(), Math.floor(Math.random() * 60));
        
        plans.push({
          id: `plan_${index + 1}`,
          femaleId: female.id,
          maleId: male.id,
          plannedDate: plannedDate.toISOString().split('T')[0],
          breedingGoal: ['milk_production', 'meat_quality', 'disease_resistance', 'fertility'][Math.floor(Math.random() * 4)] as any,
          expectedOutcome: {
            geneticImprovement: Math.round((5 + Math.random() * 15) * 10) / 10,
            productivityIncrease: Math.round((3 + Math.random() * 12) * 10) / 10,
            marketValue: Math.round((female.geneticScore + male.geneticScore) * 50)
          },
          status: ['planned', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as any
        });
      }
    });
    
    return plans;
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

  const getGeneticTrends = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      
      return {
        month: month.toLocaleDateString('ar-TN', { month: 'short' }),
        geneticScore: 75 + Math.random() * 10,
        productivity: 70 + Math.random() * 15,
        marketValue: 8000 + Math.random() * 2000
      };
    });
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
          خطة تن��سل جديدة
        </Button>
      </div>

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
