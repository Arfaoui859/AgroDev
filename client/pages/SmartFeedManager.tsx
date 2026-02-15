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
  Wheat, 
  Calculator, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Scale,
  Clock,
  Truck,
  ShoppingCart,
  BarChart3,
  PieChart,
  Lightbulb,
  Plus,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Heart,
  Activity,
  Shield
} from 'lucide-react';

interface Animal {
  id: string;
  earTag: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'chicken' | 'turkey' | 'duck';
  breed: string;
  weight: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'quarantine';
  age: number; // in months
}

interface FeedRecommendation {
  feedType: string;
  quantity: number;
  unit: string;
  cost: number;
  nutritionalBenefit: string;
  proteinContent: number;
  energyContent: number;
  fiberContent: number;
}

interface NutritionalRequirements {
  dailyRequirements: {
    protein: number;
    energy: number;
    fiber: number;
    minerals: Record<string, number>;
    vitamins: Record<string, number>;
  };
  feedRecommendations: FeedRecommendation[];
  specialRequirements?: string[];
}

interface FeedOptimization {
  optimizedPlan: {
    animalId: string;
    feedPlan: {
      feedType: string;
      quantity: number;
      cost: number;
    }[];
    totalCost: number;
  }[];
  totalBudgetUsed: number;
  savingsRecommendations: string[];
}

const SmartFeedManager: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [nutritionalReqs, setNutritionalReqs] = useState<NutritionalRequirements | null>(null);
  const [feedOptimization, setFeedOptimization] = useState<FeedOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<string>('1000');
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    if (selectedAnimal) {
      fetchNutritionalRequirements(selectedAnimal);
    }
  }, [selectedAnimal]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/animals');
      const data = await response.json();
      
      if (data.success) {
        // Mock animals with age calculation
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

  const fetchNutritionalRequirements = async (animalId: string) => {
    try {
      const response = await fetch(`/api/feed-recommendations/${animalId}`);
      const data = await response.json();
      
      if (data.success) {
        setNutritionalReqs(data.data);
      }
    } catch (error) {
      console.error('Error fetching nutritional requirements:', error);
      // Mock data for demo
      const mockData: NutritionalRequirements = {
        dailyRequirements: {
          protein: 120,
          energy: 15000,
          fiber: 1800,
          minerals: { calcium: 45, phosphorus: 35, sodium: 8 },
          vitamins: { vitaminA: 4.5, vitaminD: 2.2, vitaminE: 1.1 }
        },
        feedRecommendations: [
          {
            feedType: 'برسيم مجفف',
            quantity: 8.5,
            unit: 'kg',
            cost: 6.8,
            nutritionalBenefit: 'مصدر ممتاز للبروتين والفيتامينات',
            proteinContent: 18,
            energyContent: 250,
            fiberContent: 25
          },
          {
            feedType: 'علف مركز',
            quantity: 4.2,
            unit: 'kg',
            cost: 5.0,
            nutritionalBenefit: 'طاقة عالية ومتوازن غذائياً',
            proteinContent: 16,
            energyContent: 280,
            fiberContent: 8
          },
          {
            feedType: 'ذرة مطحونة',
            quantity: 3.1,
            unit: 'kg',
            cost: 2.8,
            nutritionalBenefit: 'طاقة عالية سهلة الهضم',
            proteinContent: 9,
            energyContent: 320,
            fiberContent: 2
          }
        ],
        specialRequirements: [
          'زيادة تدريجية في التغذية خلال الثلث الأخير من الحمل',
          'مياه نظيفة متوفرة بكميات كافية',
          'مراقبة كمية الطعام المتناولة يومياً'
        ]
      };
      setNutritionalReqs(mockData);
    }
  };

  const optimizeFeedBudget = async () => {
    try {
      const response = await fetch('/api/optimize-feed-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          farmId: 'farm1',
          budget: parseFloat(budget)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFeedOptimization(data.data);
      }
    } catch (error) {
      console.error('Error optimizing feed budget:', error);
      // Mock optimization data
      const mockOptimization: FeedOptimization = {
        optimizedPlan: animals.slice(0, 3).map((animal, idx) => ({
          animalId: animal.id,
          feedPlan: [
            { feedType: 'برسيم مجفف', quantity: 8 + idx, cost: 6.4 + idx * 0.5 },
            { feedType: 'علف مركز', quantity: 4 + idx * 0.5, cost: 4.8 + idx * 0.3 },
            { feedType: 'ذرة مطحونة', quantity: 3 + idx * 0.2, cost: 2.7 + idx * 0.2 }
          ],
          totalCost: 13.9 + idx * 2.1
        })),
        totalBudgetUsed: parseFloat(budget) * 0.85,
        savingsRecommendations: [
          'يمكن تحسين جودة الأعلاف ضمن الميزانية المتاحة',
          'النظر في شراء الأعلاف بكميات كبيرة للحصول على خصومات',
          'زراعة علف أخضر محلي لتقليل التكاليف',
          'التعاون مع مزارعين آخرين للشراء الجماعي'
        ]
      };
      setFeedOptimization(mockOptimization);
    }
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
      sheep: 'أغنام',
      goat: 'ماعز',
      chicken: 'دجاج',
      turkey: 'ديك رومي',
      duck: 'بط'
    };
    return labels[species as keyof typeof labels] || species;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      sick: 'bg-red-100 text-red-800',
      pregnant: 'bg-purple-100 text-purple-800',
      lactating: 'bg-blue-100 text-blue-800',
      dry: 'bg-gray-100 text-gray-800',
      quarantine: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      healthy: 'صحي',
      sick: 'مريض',
      pregnant: 'حامل',
      lactating: 'مرضع',
      dry: 'جاف',
      quarantine: 'حجر صحي'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getFeedQualityColor = (protein: number, energy: number) => {
    const qualityScore = (protein / 20) * 0.6 + (energy / 300) * 0.4;
    if (qualityScore >= 0.8) return 'text-green-600';
    if (qualityScore >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأعلاف الذكية</h1>
          <p className="text-gray-600">تحليل غذائي متقدم وتحسين التكاليف بالذكاء الاصطناعي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="اختر حيواناً للتحليل" />
            </SelectTrigger>
            <SelectContent>
              {animals.map(animal => (
                <SelectItem key={animal.id} value={animal.id}>
                  {getSpeciesIcon(animal.species)} {animal.earTag} - {animal.breed}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                تحسين الميزانية
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>تحسين ميزانية الأعلاف</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">الميزانية الشهرية (دينار)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="1000"
                  />
                </div>

                <Button onClick={optimizeFeedBudget} className="w-full gap-2">
                  <Zap className="h-4 w-4" />
                  تحسين التوزيع الأمثل
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة علف جديد
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
            <Wheat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {animals.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              تحتاج تغذية يومية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التكلفة المقدرة</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(animals.length * 15.5).toFixed(0)} د.ت
            </div>
            <p className="text-xs text-gray-600 mt-1">
              يومياً لجميع الحيوانات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات الحامل</CardTitle>
            <Heart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {animals.filter(a => a.status === 'pregnant').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              تحتاج تغذية خاصة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">كفاءة التكلفة</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              92%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              من المستوى الأمثل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements">الاحتياجات الغذائية</TabsTrigger>
          <TabsTrigger value="recommendations">توصيات الأعلاف</TabsTrigger>
          <TabsTrigger value="optimization">تحسين التكاليف</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          {selectedAnimal && nutritionalReqs ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    الاحتياجات الغذائية اليومية
                  </CardTitle>
                  <CardDescription>
                    {(() => {
                      const animal = animals.find(a => a.id === selectedAnimal);
                      return animal ? `${getSpeciesIcon(animal.species)} ${animal.earTag} - ${animal.breed}` : '';
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-green-700">المغذيات الأساسية</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">البروتين</span>
                          <span className="font-bold">{nutritionalReqs.dailyRequirements.protein.toFixed(0)} جم</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">الطاقة</span>
                          <span className="font-bold">{(nutritionalReqs.dailyRequirements.energy / 1000).toFixed(1)} ك.كال</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">الألياف</span>
                          <span className="font-bold">{nutritionalReqs.dailyRequirements.fiber.toFixed(0)} جم</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-blue-700">المعادن</h3>
                      <div className="space-y-3">
                        {Object.entries(nutritionalReqs.dailyRequirements.minerals).map(([mineral, amount]) => (
                          <div key={mineral} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{mineral}</span>
                            <span className="font-bold">{amount.toFixed(1)} جم</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-purple-700">الفيتامينات</h3>
                      <div className="space-y-3">
                        {Object.entries(nutritionalReqs.dailyRequirements.vitamins).map(([vitamin, amount]) => (
                          <div key={vitamin} className="flex items-center justify-between">
                            <span className="text-sm">{vitamin}</span>
                            <span className="font-bold">{amount.toFixed(2)} مجم</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {nutritionalReqs.specialRequirements && nutritionalReqs.specialRequirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      متطلبات خاصة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {nutritionalReqs.specialRequirements.map((req, idx) => (
                        <Alert key={idx}>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>{req}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Wheat className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-gray-500">اختر حيواناً لعرض احتياجاته الغذائية</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {selectedAnimal && nutritionalReqs ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                توصيات الأعلاف المحسنة
              </h2>
              
              {nutritionalReqs.feedRecommendations.map((feed, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{feed.feedType}</h3>
                        <p className="text-sm text-gray-600">{feed.nutritionalBenefit}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {feed.quantity.toFixed(1)} {feed.unit}
                        </div>
                        <p className="text-sm text-gray-600">{feed.cost.toFixed(2)} د.ت/يوم</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className={`text-lg font-bold ${getFeedQualityColor(feed.proteinContent, feed.energyContent)}`}>
                          {feed.proteinContent}%
                        </div>
                        <p className="text-xs text-gray-600">بروتين</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className={`text-lg font-bold ${getFeedQualityColor(feed.proteinContent, feed.energyContent)}`}>
                          {feed.energyContent}
                        </div>
                        <p className="text-xs text-gray-600">ك.كال/كغ</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {feed.fiberContent}%
                        </div>
                        <p className="text-xs text-gray-600">ألياف</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          جودة عالية
                        </Badge>
                        <Badge variant="outline">
                          سهل الهضم
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 ml-1" />
                          تعديل
                        </Button>
                        <Button size="sm">
                          <ShoppingCart className="h-4 w-4 ml-1" />
                          طلب شراء
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-gray-500">اختر حيواناً لعرض توصيات الأعلاف</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          {feedOptimization ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    نتائج التحسين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {feedOptimization.totalBudgetUsed.toFixed(0)} د.ت
                      </div>
                      <p className="text-sm text-gray-600">إجمالي المستخدم</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(parseFloat(budget) - feedOptimization.totalBudgetUsed).toFixed(0)} د.ت
                      </div>
                      <p className="text-sm text-gray-600">المتبقي من الميزانية</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {((feedOptimization.totalBudgetUsed / parseFloat(budget)) * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">نسبة الاستخدام</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">خطة التوزيع المحسنة</h3>
                    {feedOptimization.optimizedPlan.map((plan, index) => {
                      const animal = animals.find(a => a.id === plan.animalId);
                      return (
                        <Card key={index} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {animal && (
                                  <>
                                    <span className="text-xl">{getSpeciesIcon(animal.species)}</span>
                                    <span className="font-medium">{animal.earTag}</span>
                                    <Badge className={getStatusColor(animal.status)}>
                                      {getStatusLabel(animal.status)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-lg">{plan.totalCost.toFixed(2)} د.ت</span>
                                <p className="text-xs text-gray-600">التكلفة اليومية</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {plan.feedPlan.map((feed, feedIdx) => (
                                <div key={feedIdx} className="p-2 bg-gray-50 rounded">
                                  <p className="font-medium text-sm">{feed.feedType}</p>
                                  <p className="text-xs text-gray-600">
                                    {feed.quantity.toFixed(1)} كغ - {feed.cost.toFixed(2)} د.ت
                                  </p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    توصيات التوفير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feedOptimization.savingsRecommendations.map((rec, idx) => (
                      <Alert key={idx}>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calculator className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">لم يتم تشغيل تحسين الميزانية بعد</p>
                <Button onClick={() => setIsBudgetDialogOpen(true)} className="gap-2">
                  <Zap className="h-4 w-4" />
                  بدء تحسين الميزانية
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  توزيع التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['برسيم مجفف', 'علف مركز', 'ذرة مطحونة', 'قش القمح'].map((feed, idx) => {
                    const percentage = [35, 28, 22, 15][idx];
                    return (
                      <div key={feed} className="flex items-center justify-between">
                        <span className="text-sm">{feed}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-sm font-medium w-8">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  كفاءة التغذية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
                    <p className="text-sm text-gray-600">كفاءة إجمالية</p>
                    <Progress value={92} className="mt-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">98%</div>
                      <p className="text-xs text-gray-600">جودة البروتين</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">89%</div>
                      <p className="text-xs text-gray-600">توازن الطاقة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                اتجاهات التكلفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>قريباً - رسوم بيانية تفاعلية لاتجاهات التكلفة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartFeedManager;
