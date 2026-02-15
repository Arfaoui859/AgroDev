import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Award,
  Star,
  Clock,
  Thermometer,
  Scale,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus
} from 'lucide-react';

interface QualityMetrics {
  passRate: number;
  testCount: number;
  rejectionRate: number;
  averageScore: number;
  certificationRate: number;
  customerComplaints: number;
}

interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  qualityGrade: 'A' | 'B' | 'C';
  expiryDate: string;
  temperature: number;
  humidity: number;
  lastInspection: string;
  supplier: string;
  costPerUnit: number;
  totalValue: number;
}

const QualityInventoryManagement: React.FC = () => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quality');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setTimeout(() => {
        setQualityMetrics({
          passRate: 94.5,
          testCount: 1247,
          rejectionRate: 5.5,
          averageScore: 87.3,
          certificationRate: 92.1,
          customerComplaints: 12
        });

        setInventory([
          {
            id: 'inv_1',
            name: 'Organic Tomatoes',
            nameAr: 'طماطم عضوية',
            category: 'vegetables',
            quantity: 500,
            unit: 'كغ',
            location: 'مستودع A - الرف 3',
            status: 'in_stock',
            qualityGrade: 'A',
            expiryDate: '2024-02-28',
            temperature: 4,
            humidity: 85,
            lastInspection: '2024-02-22',
            supplier: 'مزرعة الأمل',
            costPerUnit: 2.5,
            totalValue: 1250
          },
          {
            id: 'inv_2',
            name: 'Premium Olive Oil',
            nameAr: 'زيت زيتون ممتاز',
            category: 'oils',
            quantity: 50,
            unit: 'لتر',
            location: 'مستودع B - الرف 1',
            status: 'low_stock',
            qualityGrade: 'A',
            expiryDate: '2025-01-15',
            temperature: 18,
            humidity: 60,
            lastInspection: '2024-02-20',
            supplier: 'بستان الزيتون',
            costPerUnit: 8.5,
            totalValue: 425
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      in_stock: 'متوفر',
      low_stock: 'مخزون منخفض',
      out_of_stock: 'نفد المخزون',
      expired: 'منتهي الصلاحية'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getQualityColor = (grade: string) => {
    const colors = {
      A: 'text-green-600',
      B: 'text-yellow-600',
      C: 'text-orange-600'
    };
    return colors[grade as keyof typeof colors] || 'text-gray-600';
  };

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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الجودة والمخزون</h1>
          <p className="text-gray-600">ضمان الجودة وتتبع المخزون الذكي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة عنصر
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {qualityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {qualityMetrics.passRate}%
              </div>
              <Progress value={qualityMetrics.passRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الفحوصات</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {qualityMetrics.testCount.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                متوسط النقاط: {qualityMetrics.averageScore}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">شكاوى العملاء</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {qualityMetrics.customerComplaints}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                هذا الشهر
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quality">ضمان الجودة</TabsTrigger>
          <TabsTrigger value="inventory">إدارة المخزون</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معايير الجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>درجة الحرارة</span>
                    <Badge className="bg-green-100 text-green-800">ضمن الحدود</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الرطوبة</span>
                    <Badge className="bg-green-100 text-green-800">ضمن الحدود</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>النظافة</span>
                    <Badge className="bg-yellow-100 text-yellow-800">تحذير</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>التعبئة</span>
                    <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {qualityMetrics ? qualityMetrics.passRate : 0}%
                  </div>
                  <p className="text-gray-600">معدل نجاح فحوصات الجودة</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {qualityMetrics ? qualityMetrics.testCount - Math.round(qualityMetrics.testCount * qualityMetrics.rejectionRate / 100) : 0}
                      </div>
                      <p className="text-sm text-gray-600">فحص مقبول</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">
                        {qualityMetrics ? Math.round(qualityMetrics.testCount * qualityMetrics.rejectionRate / 100) : 0}
                      </div>
                      <p className="text-sm text-gray-600">فحص مرفوض</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="space-y-4">
            {inventory.map((item) => (
              <Card key={item.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{item.nameAr}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                        <Badge className={`${getQualityColor(item.qualityGrade)} bg-opacity-10`}>
                          الدرجة {item.qualityGrade}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">الكمية:</span>
                          <span className="ml-1">{item.quantity} {item.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium">الموقع:</span>
                          <span className="ml-1">{item.location}</span>
                        </div>
                        <div>
                          <span className="font-medium">انتهاء ��لصلاحية:</span>
                          <span className="ml-1">{new Date(item.expiryDate).toLocaleDateString('ar-TN')}</span>
                        </div>
                        <div>
                          <span className="font-medium">القيمة الإجمالية:</span>
                          <span className="ml-1">{item.totalValue.toLocaleString('ar-TN')} د.ت</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span>{item.temperature}°م</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-blue-500" />
                          <span>{item.humidity}% رطوبة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span>آخر فحص: {new Date(item.lastInspection).toLocaleDateString('ar-TN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>اتجاهات الجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">+2.3%</div>
                  <p className="text-gray-600">تحسن في معدل الجودة</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>هذا الأسبوع</span>
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        +1.2%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>هذا الشهر</span>
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        +2.3%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حالة المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>متوفر</span>
                    <span className="font-bold text-green-600">67%</span>
                  </div>
                  <Progress value={67} className="[&>*]:bg-green-500" />
                  
                  <div className="flex items-center justify-between">
                    <span>مخزون منخفض</span>
                    <span className="font-bold text-yellow-600">23%</span>
                  </div>
                  <Progress value={23} className="[&>*]:bg-yellow-500" />
                  
                  <div className="flex items-center justify-between">
                    <span>نفد المخزون</span>
                    <span className="font-bold text-red-600">10%</span>
                  </div>
                  <Progress value={10} className="[&>*]:bg-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityInventoryManagement;
