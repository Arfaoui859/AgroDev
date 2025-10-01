import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wheat, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Plus,
  Package,
  AlertTriangle,
  Target,
  Calendar,
  Scale,
  Zap,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface FeedInventory {
  id: string;
  feedType: string;
  brand: string;
  quantity: number;
  unitCost: number;
  nutritionalValue: NutritionalProfile;
  expiryDate: string;
  purchaseDate: string;
  supplier: string;
}

interface NutritionalProfile {
  dailyCalories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  vitamins: { [key: string]: number };
  minerals: { [key: string]: number };
  waterRequirement: number;
}

interface FeedingRecord {
  animalId: string;
  earTag: string;
  date: string;
  feedType: string;
  quantity: number;
  cost: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

interface FeedOptimization {
  animalId: string;
  earTag: string;
  currentWeight: number;
  dailyNeeds: NutritionalProfile;
  recommendedFeeds: {
    feedType: string;
    quantity: number;
    cost: number;
  }[];
  totalDailyCost: number;
  nutritionalCoverage: {
    calories: number;
    protein: number;
    minerals: number;
  };
  costEfficiency: number;
}

const timeOfDayTranslation = {
  morning: 'صباح',
  afternoon: 'ظهر',
  evening: 'مساء'
};

export default function FeedManagement() {
  const [inventory, setInventory] = useState<FeedInventory[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [optimizations, setOptimizations] = useState<FeedOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState<string>('all');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');

  useEffect(() => {
    fetchFeedData();
  }, []);

  const fetchFeedData = async () => {
    try {
      // Fetch feed inventory
      const inventoryResponse = await fetch('/api/livestock-management/feed-inventory');
      const inventoryData = await inventoryResponse.json();
      
      // Fetch feed optimization
      const optimizationResponse = await fetch('/api/livestock-management/feed-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCosts: 'medium', nutritionalGoals: 'balanced' })
      });
      const optimizationData = await optimizationResponse.json();
      
      if (inventoryData.success) setInventory(inventoryData.data);
      if (optimizationData.success) setOptimizations(optimizationData.data);
      
      // Generate feeding records
      setFeedingRecords(generateFeedingRecords());
      
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedingRecords = (): FeedingRecord[] => {
    const records: FeedingRecord[] = [];
    const animals = ['TN0001', 'TN0002', 'TN0003', 'TN0004', 'TN0005'];
    const feedTypes = ['علف مركز للأبقار', 'علف الشعير', 'علف البرسيم', 'علف الذرة'];
    const timesOfDay = ['morning', 'afternoon', 'evening'] as const;
    
    // Generate records for the last 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      animals.forEach(earTag => {
        // 2-3 feeding times per day per animal
        const feedingTimes = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < feedingTimes; i++) {
          const feedType = feedTypes[Math.floor(Math.random() * feedTypes.length)];
          const timeOfDay = timesOfDay[i % 3];
          const quantity = 2 + Math.random() * 8; // 2-10 kg
          const unitCost = 2.0 + Math.random() * 1.5; // 2-3.5 per kg
          
          records.push({
            animalId: `animal_${animals.indexOf(earTag) + 1}`,
            earTag,
            date: date.toISOString().split('T')[0],
            feedType,
            quantity: Math.round(quantity * 10) / 10,
            cost: Math.round(quantity * unitCost * 10) / 10,
            timeOfDay
          });
        }
      });
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFeedStatistics = () => {
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const expiringItems = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntilExpiry <= 30;
    }).length;
    
    const recentCosts = feedingRecords
      .filter(record => {
        const recordDate = new Date(record.date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return recordDate >= thirtyDaysAgo;
      })
      .reduce((sum, record) => sum + record.cost, 0);
    
    return {
      totalQuantity: Math.round(totalQuantity),
      totalValue: Math.round(totalValue),
      expiringItems,
      monthlyFeedCost: Math.round(recentCosts)
    };
  };

  const getFeedConsumptionTrends = () => {
    const trends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const dayRecords = feedingRecords.filter(record => 
        record.date === date.toISOString().split('T')[0]
      );
      
      const totalQuantity = dayRecords.reduce((sum, record) => sum + record.quantity, 0);
      const totalCost = dayRecords.reduce((sum, record) => sum + record.cost, 0);
      
      return {
        date: date.toLocaleDateString('ar-TN', { month: 'short', day: 'numeric' }),
        quantity: Math.round(totalQuantity * 10) / 10,
        cost: Math.round(totalCost * 10) / 10,
        efficiency: totalQuantity > 0 ? Math.round((totalCost / totalQuantity) * 100) / 100 : 0
      };
    });
    
    return trends;
  };

  const getFeedTypeDistribution = () => {
    const distribution = feedingRecords.reduce((acc, record) => {
      acc[record.feedType] = (acc[record.feedType] || 0) + record.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    
    return Object.entries(distribution).map(([feedType, quantity], index) => ({
      name: feedType,
      value: Math.round(quantity * 10) / 10,
      color: colors[index % colors.length]
    }));
  };

  const getNutritionalAnalysis = () => {
    // Simulate nutritional analysis for different feed types
    return [
      {
        feedType: 'علف مركز للأبقار',
        protein: 85,
        carbohydrates: 90,
        fats: 70,
        fiber: 60,
        vitamins: 95,
        minerals: 88
      },
      {
        feedType: 'علف الشعير',
        protein: 70,
        carbohydrates: 95,
        fats: 50,
        fiber: 85,
        vitamins: 70,
        minerals: 75
      },
      {
        feedType: 'علف البرسيم',
        protein: 90,
        carbohydrates: 70,
        fats: 40,
        fiber: 95,
        vitamins: 85,
        minerals: 90
      },
      {
        feedType: 'علف الذرة',
        protein: 60,
        carbohydrates: 98,
        fats: 80,
        fiber: 50,
        vitamins: 60,
        minerals: 65
      }
    ];
  };

  const getCostOptimizationSuggestions = () => {
    return [
      {
        suggestion: 'استبدال علف مركز بالشعير في وجبة الظهر',
        currentCost: 45.5,
        optimizedCost: 38.2,
        savings: 7.3,
        nutritionalImpact: 'تحسن طفيف في الألياف',
        feasibility: 'عالية'
      },
      {
        suggestion: 'زيادة نسبة البرسيم في النظام الغذائي',
        currentCost: 52.0,
        optimizedCost: 48.5,
        savings: 3.5,
        nutritionalImpact: 'تحسن كبير في البروتين',
        feasibility: 'متوسطة'
      },
      {
        suggestion: 'شراء كميات أكبر للحصول على خصم',
        currentCost: 2.8,
        optimizedCost: 2.3,
        savings: 0.5,
        nutritionalImpact: 'بدون تغيير',
        feasibility: 'عالية'
      }
    ];
  };

  const feedStats = getFeedStatistics();
  const consumptionTrends = getFeedConsumptionTrends();
  const feedDistribution = getFeedTypeDistribution();
  const nutritionalAnalysis = getNutritionalAnalysis();
  const costOptimizations = getCostOptimizationSuggestions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل بيانات إدارة الأعلاف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">إدارة الأعلاف والتغذية</h1>
          <p className="text-muted-foreground">نظام متكامل لإدارة المخزون وتحسين التكاليف والتحليل الغذائي</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-2" />
          إضافة علف جديد
        </Button>
      </div>

      {/* Feed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المخزون</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedStats.totalQuantity} كيلو</div>
            <p className="text-xs text-muted-foreground">جميع أنواع الأعلاف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedStats.totalValue.toLocaleString()} د.ت</div>
            <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أعلاف منتهية الصلاحية</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{feedStats.expiringItems}</div>
            <p className="text-xs text-muted-foreground">خلال 30 يوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تكلفة شهرية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{feedStats.monthlyFeedCost.toLocaleString()} د.ت</div>
            <p className="text-xs text-muted-foreground">آخر 30 يوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Items Alert */}
      {feedStats.expiringItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              تنبيه: أعلاف قريبة من انتهاء الصلاحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventory.filter(item => {
                const expiryDate = new Date(item.expiryDate);
                const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
                return daysUntilExpiry <= 30;
              }).map((item) => {
                const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <h4 className="font-medium">{item.feedType} - {item.brand}</h4>
                      <p className="text-sm text-muted-foreground">
                        الكمية: {item.quantity} كيلو | انتهاء الصلاحية: {item.expiryDate}
                      </p>
                    </div>
                    <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                      {daysUntilExpiry} يوم
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="consumption">الاستهلاك</TabsTrigger>
          <TabsTrigger value="nutrition">التحليل الغذائي</TabsTrigger>
          <TabsTrigger value="optimization">تحسين التكاليف</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.feedType}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.brand}</p>
                    </div>
                    <Badge variant="outline">
                      {item.unitCost} د.ت/كيلو
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الكمية:</span>
                      <span className="font-medium">{item.quantity} كيلو</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">القيمة الإجمالية:</span>
                      <span className="font-medium">{(item.quantity * item.unitCost).toLocaleString()} د.ت</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">انتهاء الصلاحية:</span>
                      <span className="font-medium">{item.expiryDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المورد:</span>
                      <span className="font-medium">{item.supplier}</span>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="font-medium text-sm mb-2">القيم الغذائية (لكل كيلو):</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>بروتين: {item.nutritionalValue.protein}g</div>
                        <div>كربوهيدرات: {item.nutritionalValue.carbohydrates}g</div>
                        <div>دهون: {item.nutritionalValue.fats}g</div>
                        <div>ألياف: {item.nutritionalValue.fiber}g</div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      تفاصيل العلف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consumption Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  اتجاهات الاستهلاك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={consumptionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="الكمية (كيلو)" />
                    <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="التكلفة (د.ت)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feed Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع أنواع الأعلاف</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {feedDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feeding Records */}
          <Card>
            <CardHeader>
              <CardTitle>سجل التغذية الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedingRecords.slice(0, 10).map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Wheat className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">{record.earTag} - {record.feedType}</h4>
                        <p className="text-sm text-muted-foreground">
                          {record.date} | {timeOfDayTranslation[record.timeOfDay]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{record.quantity} كيلو</div>
                      <div className="text-sm text-muted-foreground">{record.cost} د.ت</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                التحليل الغذائي للأعلاف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={nutritionalAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="feedType" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="البروتين" dataKey="protein" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
                  <Radar name="الكربوهيدرات" dataKey="carbohydrates" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.1} />
                  <Radar name="الألياف" dataKey="fiber" stroke="#ffc658" fill="#ffc658" fillOpacity={0.1} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {/* Cost Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                اقتراحات تحسين التكاليف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costOptimizations.map((opt, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-lg">{opt.suggestion}</h4>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        توفير {opt.savings} د.ت/يوم
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">التكلفة الحالية:</span>
                        <p className="font-medium">{opt.currentCost} د.ت/يوم</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">التكلفة المحسنة:</span>
                        <p className="font-medium text-green-600">{opt.optimizedCost} د.ت/يوم</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">سهولة التطبيق:</span>
                        <p className="font-medium">{opt.feasibility}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <span className="text-sm text-muted-foreground">التأثير الغذائي: </span>
                      <span className="text-sm">{opt.nutritionalImpact}</span>
                    </div>
                    
                    <Button variant="outline" size="sm" className="mt-3">
                      تطبيق الاقتراح
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Results */}
          {optimizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  نتائج تحسين التغذية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {optimizations.slice(0, 6).map((opt) => (
                    <div key={opt.animalId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{opt.earTag}</h4>
                        <Badge variant="outline">
                          {opt.totalDailyCost} د.ت/يوم
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الوزن:</span>
                          <span>{opt.currentWeight} كيلو</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">كفاءة التكلفة:</span>
                          <span>{opt.costEfficiency}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="font-medium text-sm mb-2">التغطية الغذائية:</h5>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium">{opt.nutritionalCoverage.calories}%</div>
                            <div className="text-muted-foreground">سعرات</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{opt.nutritionalCoverage.protein}%</div>
                            <div className="text-muted-foreground">بروتين</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{opt.nutritionalCoverage.minerals}%</div>
                            <div className="text-muted-foreground">معادن</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
