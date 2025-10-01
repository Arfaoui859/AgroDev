import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Heart, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Users,
  DollarSign,
  Beef,
  Milk
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Animal {
  id: string;
  earTag: string;
  species: 'cattle' | 'sheep' | 'goat' | 'poultry' | 'camel';
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  weight: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'sick';
  breedingStatus: 'active' | 'pregnant' | 'nursing' | 'inactive';
  location: string;
  currentValue: number;
  lastHealthCheck: string;
}

interface DashboardSummary {
  totalAnimals: number;
  healthyAnimals: number;
  breedingAnimals: number;
  totalValue: number;
}

interface HealthAlert {
  id: string;
  animalId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  dateCreated: string;
  resolved: boolean;
}

const speciesTranslation = {
  cattle: 'أبقار',
  sheep: 'أغنام', 
  goat: 'ماعز',
  poultry: 'دواجن',
  camel: 'إبل'
};

const healthStatusColors = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  fair: 'bg-yellow-500',
  poor: 'bg-orange-500',
  sick: 'bg-red-500'
};

const healthStatusTranslation = {
  excellent: 'ممتاز',
  good: 'جيد',
  fair: 'مقبول', 
  poor: 'ضعيف',
  sick: 'مريض'
};

const breedingStatusTranslation = {
  active: 'نشط',
  pregnant: 'حامل',
  nursing: 'مرضع',
  inactive: 'غير نشط'
};

export default function LivestockDashboard() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>('all');

  useEffect(() => {
    fetchLivestockData();
    fetchHealthAlerts();
  }, []);

  const fetchLivestockData = async () => {
    try {
      const response = await fetch('/api/livestock-management/animals');
      const data = await response.json();
      
      if (data.success) {
        setAnimals(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching livestock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthAlerts = async () => {
    try {
      const response = await fetch('/api/livestock-management/health-alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error fetching health alerts:', error);
    }
  };

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = selectedSpecies === 'all' || animal.species === selectedSpecies;
    const matchesHealth = selectedHealthStatus === 'all' || animal.healthStatus === selectedHealthStatus;
    
    return matchesSearch && matchesSpecies && matchesHealth;
  });

  const speciesDistribution = Object.entries(
    animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([species, count]) => ({
    name: speciesTranslation[species as keyof typeof speciesTranslation],
    value: count,
    color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][Object.keys(speciesTranslation).indexOf(species)]
  }));

  const healthDistribution = Object.entries(
    animals.reduce((acc, animal) => {
      acc[animal.healthStatus] = (acc[animal.healthStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: healthStatusTranslation[status as keyof typeof healthStatusTranslation],
    value: count
  }));

  const productionTrends = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('ar-TN'),
      milk: 180 + Math.random() * 40,
      feed: 450 + Math.random() * 100,
      revenue: 800 + Math.random() * 200
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل بيانات الثروة الحيوانية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">إدارة الثروة الحيوانية</h1>
          <p className="text-muted-foreground">نظام متكامل لإدارة ومراقبة الحيوانات والإنتاج</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-2" />
          إضافة حيوان جديد
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAnimals}</div>
              <p className="text-xs text-muted-foreground">جميع الحيوانات المسجلة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحيوانات السليمة</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.healthyAnimals}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((summary.healthyAnimals / summary.totalAnimals) * 100)}% من الإجمالي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حيوانات التناسل</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.breedingAnimals}</div>
              <p className="text-xs text-muted-foreground">نشطة في التناسل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalValue.toLocaleString()} د.ت</div>
              <p className="text-xs text-muted-foreground">قيمة جميع الحيوانات</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              التنبيهات الصحية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.dateCreated}</p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity === 'critical' ? 'حرج' :
                     alert.severity === 'high' ? 'عالي' :
                     alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="animals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="animals">قائمة الحيوانات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="breeding">التناسل</TabsTrigger>
          <TabsTrigger value="production">الإنتاج</TabsTrigger>
        </TabsList>

        <TabsContent value="animals" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="البحث بالرقم أو السلالة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="cattle">أبقار</option>
                  <option value="sheep">أغنام</option>
                  <option value="goat">ماعز</option>
                  <option value="poultry">دواجن</option>
                  <option value="camel">إبل</option>
                </select>
                <select
                  value={selectedHealthStatus}
                  onChange={(e) => setSelectedHealthStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">جميع الحالات الصحية</option>
                  <option value="excellent">ممتاز</option>
                  <option value="good">جيد</option>
                  <option value="fair">مقبول</option>
                  <option value="poor">ضعيف</option>
                  <option value="sick">مريض</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Animals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimals.map((animal) => (
              <Card key={animal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{animal.earTag}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {speciesTranslation[animal.species]} - {animal.breed}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${healthStatusColors[animal.healthStatus]} text-white border-0`}
                    >
                      {healthStatusTranslation[animal.healthStatus]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الجنس:</span>
                      <span>{animal.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الوزن:</span>
                      <span>{animal.weight} كيلو</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الموقع:</span>
                      <span>{animal.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">حالة التناسل:</span>
                      <span>{breedingStatusTranslation[animal.breedingStatus]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">القيمة الحالية:</span>
                      <span className="font-medium">{animal.currentValue.toLocaleString()} د.ت</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Species Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الأنواع</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={speciesDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {speciesDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Health Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الحالة الصحية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breeding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تقويم التناسل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                سيتم تطوير تقويم التناسل قريباً...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                اتجاهات الإنتاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={productionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="milk" stroke="#8884d8" name="إنتاج الحليب" />
                  <Line type="monotone" dataKey="feed" stroke="#82ca9d" name="تكلفة العلف" />
                  <Line type="monotone" dataKey="revenue" stroke="#ffc658" name="الإيرادات" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
