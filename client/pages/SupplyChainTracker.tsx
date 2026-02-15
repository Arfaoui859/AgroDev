import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Leaf,
  Factory,
  Store,
  Home,
  Thermometer,
  Droplets,
  BarChart3,
  Eye,
  Download,
  Share2,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Globe,
  Shield,
  Award,
  Target,
  Zap,
  Activity,
  Users,
  TrendingUp,
  FileText,
  Camera,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  QrCode,
  Scan,
  Navigation,
  Timer,
  Gauge,
  Scale,
  Star,
  Heart,
  MessageSquare
} from 'lucide-react';

interface SupplyChainStep {
  id: string;
  stepNumber: number;
  name: string;
  nameAr: string;
  type: 'production' | 'processing' | 'packaging' | 'storage' | 'transport' | 'distribution' | 'retail';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'failed';
  location: {
    name: string;
    coordinates: [number, number];
    address: string;
  };
  timestamp: string;
  estimatedTime?: string;
  actualTime?: string;
  operator: {
    name: string;
    role: string;
    contact: string;
  };
  documents: string[];
  qualityChecks: QualityCheck[];
  conditions: EnvironmentalConditions;
  notes?: string;
}

interface QualityCheck {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  status: 'pass' | 'fail' | 'warning';
  threshold: {
    min: number;
    max: number;
  };
  timestamp: string;
  inspector: string;
}

interface EnvironmentalConditions {
  temperature: number;
  humidity: number;
  pressure?: number;
  light?: number;
  co2?: number;
  timestamp: string;
}

interface TrackingRecord {
  id: string;
  batchId: string;
  productName: string;
  productNameAr: string;
  category: string;
  quantity: number;
  unit: string;
  origin: {
    farm: string;
    farmer: string;
    location: string;
    harvestDate: string;
  };
  destination: {
    type: 'retailer' | 'restaurant' | 'processor' | 'export';
    name: string;
    location: string;
  };
  currentStep: number;
  totalSteps: number;
  steps: SupplyChainStep[];
  estimatedDelivery: string;
  actualDelivery?: string;
  status: 'in_transit' | 'delivered' | 'delayed' | 'lost' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  certifications: string[];
  blockchain: {
    transactionHash: string;
    verified: boolean;
    lastUpdate: string;
  };
  alerts: TrackingAlert[];
}

interface TrackingAlert {
  id: string;
  type: 'delay' | 'quality' | 'temperature' | 'location' | 'damage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messageAr: string;
  timestamp: string;
  resolved: boolean;
  actionTaken?: string;
}

interface LogisticsMetrics {
  totalShipments: number;
  onTimeDelivery: number;
  averageTransitTime: number;
  qualityFailures: number;
  costPerKm: number;
  customerSatisfaction: number;
  environmentalImpact: {
    co2Emissions: number;
    fuelConsumption: number;
    carbonFootprint: number;
  };
}

const SupplyChainTracker: React.FC = () => {
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [metrics, setMetrics] = useState<LogisticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<TrackingRecord | null>(null);

  useEffect(() => {
    fetchSupplyChainData();
  }, [selectedStatus]);

  const fetchSupplyChainData = async () => {
    try {
      setLoading(true);
      const [recordsRes, metricsRes] = await Promise.all([
        fetch(`/api/supply-chain/tracking?status=${selectedStatus}&search=${searchQuery}`),
        fetch('/api/supply-chain/metrics')
      ]);

      const [recordsData, metricsData] = await Promise.all([
        recordsRes.json(),
        metricsRes.json()
      ]);

      if (recordsData.success) setTrackingRecords(recordsData.data);
      if (metricsData.success) setMetrics(metricsData.data);
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (type: string, status: string) => {
    const baseClasses = "h-6 w-6";
    const statusColor = status === 'completed' ? 'text-green-600' : 
                      status === 'in_progress' ? 'text-blue-600' : 
                      status === 'delayed' ? 'text-orange-600' : 
                      status === 'failed' ? 'text-red-600' : 'text-gray-400';

    switch (type) {
      case 'production': return <Leaf className={`${baseClasses} ${statusColor}`} />;
      case 'processing': return <Factory className={`${baseClasses} ${statusColor}`} />;
      case 'packaging': return <Package className={`${baseClasses} ${statusColor}`} />;
      case 'storage': return <Home className={`${baseClasses} ${statusColor}`} />;
      case 'transport': return <Truck className={`${baseClasses} ${statusColor}`} />;
      case 'distribution': return <Store className={`${baseClasses} ${statusColor}`} />;
      case 'retail': return <Store className={`${baseClasses} ${statusColor}`} />;
      default: return <Package className={`${baseClasses} ${statusColor}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      delayed: 'bg-orange-100 text-orange-800',
      lost: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      delayed: 'متأخر',
      lost: 'مفقود',
      cancelled: 'ملغي'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getQualityStatus = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (currentStep: number, totalSteps: number) => {
    return (currentStep / totalSteps) * 100;
  };

  if (loading && !metrics) {
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
          <h1 className="text-3xl font-bold text-gray-900">تتبع سلسلة التوريد</h1>
          <p className="text-gray-600">تتبع شامل للمنتجات من المزرعة للمستهلك مع ضمان الجودة</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="البحث برقم الدفعة أو المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="in_transit">في الطريق</SelectItem>
              <SelectItem value="delivered">تم التسليم</SelectItem>
              <SelectItem value="delayed">متأخر</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchSupplyChainData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button className="gap-2">
            <QrCode className="h-4 w-4" />
            مسح رمز QR
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalShipments.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                نشط حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التسليم في الوقت</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.onTimeDelivery}%
              </div>
              <Progress value={metrics.onTimeDelivery} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط وقت النقل</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.averageTransitTime}h
              </div>
              <p className="text-xs text-gray-600 mt-1">
                ساعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رضا العملاء</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.customerSatisfaction}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                تقييم العملاء
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">التتبع النشط</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="quality">ضمان الجودة</TabsTrigger>
          <TabsTrigger value="blockchain">البلوك تشين</TabsTrigger>
        </TabsList>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="space-y-4">
            {trackingRecords.map((record) => {
              const progress = calculateProgress(record.currentStep, record.totalSteps);
              const hasAlerts = record.alerts.some(alert => !alert.resolved);

              return (
                <Card 
                  key={record.id} 
                  className={`border-2 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    hasAlerts ? 'border-red-200' : 'border-gray-200'
                  } ${selectedRecord?.id === record.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{record.productNameAr}</h3>
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusLabel(record.status)}
                          </Badge>
                          <Badge className={`${getPriorityColor(record.priority)} bg-opacity-10`}>
                            {getPriorityLabel(record.priority)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">رقم الدفعة:</span>
                            <span className="ml-1">{record.batchId}</span>
                          </div>
                          <div>
                            <span className="font-medium">الكمية:</span>
                            <span className="ml-1">{record.quantity} {record.unit}</span>
                          </div>
                          <div>
                            <span className="font-medium">المصدر:</span>
                            <span className="ml-1">{record.origin.farm}</span>
                          </div>
                          <div>
                            <span className="font-medium">الوجهة:</span>
                            <span className="ml-1">{record.destination.name}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">التقدم</span>
                            <span className="text-sm text-gray-600">
                              {record.currentStep} من {record.totalSteps}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {hasAlerts && (
                          <Alert className="border-red-200 bg-red-50 mb-4">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              {record.alerts.filter(alert => !alert.resolved).length} تنبيه جديد
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>التسليم المتوقع: {formatDate(record.estimatedDelivery)}</span>
                          {record.blockchain.verified && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">محقق على البلوك تشين</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedRecord?.id === record.id && (
                      <div className="border-t pt-4 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Supply Chain Steps */}
                          <div>
                            <h4 className="font-semibold mb-3">خطوات سلسلة التوريد</h4>
                            <div className="space-y-3">
                              {record.steps.map((step, index) => (
                                <div key={step.id} className="flex items-start gap-3">
                                  <div className="flex flex-col items-center">
                                    {getStepIcon(step.type, step.status)}
                                    {index < record.steps.length - 1 && (
                                      <div className="w-px h-8 bg-gray-300 mt-2"></div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium">{step.nameAr}</h5>
                                      <Badge className={`text-xs ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        step.status === 'delayed' ? 'bg-orange-100 text-orange-800' :
                                        step.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {step.status === 'completed' ? 'مكتمل' :
                                         step.status === 'in_progress' ? 'جاري' :
                                         step.status === 'delayed' ? 'متأخر' :
                                         step.status === 'failed' ? 'فشل' : 'قيد الانتظار'}
                                      </Badge>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 mt-1">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{step.location.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(step.timestamp)}</span>
                                      </div>
                                    </div>

                                    {step.qualityChecks.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">فحوصات الجودة:</p>
                                        <div className="flex gap-2">
                                          {step.qualityChecks.map((check) => (
                                            <div key={check.id} className="flex items-center gap-1">
                                              {getQualityStatus(check.status)}
                                              <span className="text-xs">{check.parameter}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Environmental Conditions */}
                          <div>
                            <h4 className="font-semibold mb-3">الظروف البيئية</h4>
                            <div className="space-y-3">
                              {record.steps
                                .filter(step => step.status === 'completed' || step.status === 'in_progress')
                                .slice(-3)
                                .map((step) => (
                                <Card key={step.id} className="p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{step.nameAr}</span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(step.conditions.timestamp)}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Thermometer className="h-3 w-3 text-red-500" />
                                      <span>{step.conditions.temperature}°م</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Droplets className="h-3 w-3 text-blue-500" />
                                      <span>{step.conditions.humidity}%</span>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>

                            {record.alerts.length > 0 && (
                              <div className="mt-6">
                                <h4 className="font-semibold mb-3">التنبيهات</h4>
                                <div className="space-y-2">
                                  {record.alerts.slice(0, 3).map((alert) => (
                                    <Alert key={alert.id} className={
                                      alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                                      alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                                      'border-yellow-200 bg-yellow-50'
                                    }>
                                      <AlertTriangle className={`h-4 w-4 ${
                                        alert.severity === 'critical' ? 'text-red-600' :
                                        alert.severity === 'high' ? 'text-orange-600' :
                                        'text-yellow-600'
                                      }`} />
                                      <AlertDescription className="text-sm">
                                        {alert.messageAr}
                                      </AlertDescription>
                                    </Alert>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مقاييس الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>معدل التسليم في الوقت</span>
                      <span className="font-bold text-green-600">{metrics.onTimeDelivery}%</span>
                    </div>
                    <Progress value={metrics.onTimeDelivery} />
                    
                    <div className="flex items-center justify-between">
                      <span>فشل فحوصات الجودة</span>
                      <span className="font-bold text-red-600">{metrics.qualityFailures}%</span>
                    </div>
                    <Progress value={metrics.qualityFailures} className="[&>*]:bg-red-500" />
                    
                    <div className="flex items-center justify-between">
                      <span>رضا العملا��</span>
                      <span className="font-bold text-blue-600">{metrics.customerSatisfaction}%</span>
                    </div>
                    <Progress value={metrics.customerSatisfaction} className="[&>*]:bg-blue-500" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  التأثير البيئي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>انبعاثات CO2</span>
                      <span className="font-bold">{metrics.environmentalImpact.co2Emissions} طن</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>استهلاك الوقود</span>
                      <span className="font-bold">{metrics.environmentalImpact.fuelConsumption} لتر</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>البصمة الكربونية</span>
                      <span className="font-bold">{metrics.environmentalImpact.carbonFootprint} كغ</span>
                    </div>
                    
                    <Alert className="border-green-200 bg-green-50">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        انخفاض 15% في الانبعاثات هذا الشهر
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                  <div className="text-3xl font-bold text-green-600 mb-2">96.8%</div>
                  <p className="text-gray-600">معدل نجاح فحوصات الجودة</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">127</div>
                      <p className="text-sm text-gray-600">فحص مكتمل</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">4</div>
                      <p className="text-sm text-gray-600">فحص فاشل</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blockchain Tab */}
        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  التحقق من البلوك تشين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">98.5%</div>
                  <p className="text-gray-600">معدل التحقق الناجح</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>معاملات محققة</span>
                      <span className="font-bold">1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معاملات قيد المراجعة</span>
                      <span className="font-bold">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معاملات فاشلة</span>
                      <span className="font-bold text-red-600">2</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أمان البيانات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      جميع البيانات مشفرة ومحمية
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      نسخ احتياطية تلقائية كل 24 ساعة
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-green-200 bg-green-50">
                    <Award className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      معتمد من ISO 27001 لأمان المعلومات
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyChainTracker;
