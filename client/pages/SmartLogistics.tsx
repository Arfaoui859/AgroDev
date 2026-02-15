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
  MapPin, 
  Route, 
  Fuel, 
  Timer, 
  Package, 
  Users, 
  Gauge,
  Navigation,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  Star,
  Shield,
  Zap,
  Target,
  Award,
  Globe,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  DollarSign,
  Leaf,
  CloudRain,
  Sun,
  Wind,
  Thermometer
} from 'lucide-react';

interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'truck' | 'van' | 'trailer' | 'refrigerated';
  capacity: number;
  currentLoad: number;
  status: 'available' | 'in_transit' | 'loading' | 'maintenance' | 'offline';
  driver: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    experience: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdate: string;
  };
  route: {
    id: string;
    origin: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
    actualDuration?: number;
    stops: RouteStop[];
  };
  fuelLevel: number;
  temperature?: number;
  maintenance: {
    lastService: string;
    nextService: string;
    mileage: number;
    issues: string[];
  };
  performance: {
    onTimeDeliveries: number;
    fuelEfficiency: number;
    safetyScore: number;
    customerRating: number;
  };
}

interface RouteStop {
  id: string;
  address: string;
  coordinates: [number, number];
  type: 'pickup' | 'delivery' | 'fuel' | 'rest';
  estimatedTime: string;
  actualTime?: string;
  status: 'pending' | 'completed' | 'skipped';
  cargo: {
    items: string[];
    weight: number;
    value: number;
  };
}

interface LogisticsMetrics {
  totalVehicles: number;
  activeRoutes: number;
  onTimeDelivery: number;
  fuelEfficiency: number;
  averageSpeed: number;
  totalDistance: number;
  co2Emissions: number;
  costPerKm: number;
  customerSatisfaction: number;
  safetyIncidents: number;
}

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    address: string;
    phone: string;
    coordinates: [number, number];
  };
  items: Array<{
    name: string;
    quantity: number;
    weight: number;
    value: number;
    specialRequirements?: string[];
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  vehicleId?: string;
  driverId?: string;
  scheduledTime: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  specialInstructions?: string;
  paymentStatus: 'pending' | 'paid' | 'cod';
  deliveryProof?: {
    signature: string;
    photo: string;
    timestamp: string;
  };
}

interface RouteOptimization {
  id: string;
  name: string;
  vehicles: string[];
  orders: string[];
  optimizationFactors: {
    distance: number;
    time: number;
    fuel: number;
    cost: number;
    priority: number;
  };
  result: {
    totalDistance: number;
    totalTime: number;
    fuelConsumption: number;
    estimatedCost: number;
    co2Emissions: number;
    routes: OptimizedRoute[];
  };
  status: 'pending' | 'optimizing' | 'completed' | 'applied';
  createdAt: string;
}

interface OptimizedRoute {
  vehicleId: string;
  stops: RouteStop[];
  totalDistance: number;
  estimatedTime: number;
  load: number;
  priority: number;
}

const SmartLogistics: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [metrics, setMetrics] = useState<LogisticsMetrics | null>(null);
  const [routeOptimizations, setRouteOptimizations] = useState<RouteOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fleet');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogisticsData();
  }, [statusFilter]);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, ordersRes, metricsRes, optimizationRes] = await Promise.all([
        fetch(`/api/logistics/vehicles?status=${statusFilter}&search=${searchQuery}`),
        fetch('/api/logistics/orders'),
        fetch('/api/logistics/metrics'),
        fetch('/api/logistics/route-optimization')
      ]);

      const [vehiclesData, ordersData, metricsData, optimizationData] = await Promise.all([
        vehiclesRes.json(),
        ordersRes.json(),
        metricsRes.json(),
        optimizationRes.json()
      ]);

      if (vehiclesData.success) setVehicles(vehiclesData.data);
      if (ordersData.success) setOrders(ordersData.data);
      if (metricsData.success) setMetrics(metricsData.data);
      if (optimizationData.success) setRouteOptimizations(optimizationData.data);
    } catch (error) {
      console.error('Error fetching logistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'truck': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'van': return <Package className="h-5 w-5 text-green-600" />;
      case 'trailer': return <Truck className="h-5 w-5 text-purple-600" />;
      case 'refrigerated': return <Thermometer className="h-5 w-5 text-cyan-600" />;
      default: return <Truck className="h-5 w-5 text-gray-600" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels = {
      truck: 'شاحنة',
      van: 'فان',
      trailer: 'مقطورة',
      refrigerated: 'مبردة'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      loading: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-orange-100 text-orange-800',
      offline: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'متاح',
      in_transit: 'في الطريق',
      loading: 'تحميل',
      maintenance: 'صيانة',
      offline: 'متوقف'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const calculateLoadPercentage = (currentLoad: number, capacity: number) => {
    return (currentLoad / capacity) * 100;
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
          <h1 className="text-3xl font-bold text-gray-900">اللوجستيات الذكية</h1>
          <p className="text-gray-600">إدارة الأسطول وتحسين المسارات والتوصيل الذكي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="البحث في المركبات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="available">متاح</SelectItem>
              <SelectItem value="in_transit">في الطريق</SelectItem>
              <SelectItem value="maintenance">صيانة</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchLogisticsData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button className="gap-2">
            <Route className="h-4 w-4" />
            تحسين المسارات
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المركبات</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalVehicles}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.activeRoutes} مسار نشط
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
              <CardTitle className="text-sm font-medium">كفاءة الوقود</CardTitle>
              <Fuel className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.fuelEfficiency} ل/100كم
              </div>
              <p className="text-xs text-gray-600 mt-1">
                متوسط الاستهلاك
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التكلفة للكيلومتر</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics.costPerKm)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                تكلفة متوسطة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">انبعاثات CO2</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.co2Emissions} كغ
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fleet">إدارة الأسطول</TabsTrigger>
          <TabsTrigger value="routes">المسارات</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="optimization">التحسين</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Fleet Management Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const loadPercentage = calculateLoadPercentage(vehicle.currentLoad, vehicle.capacity);
              const isOverdue = new Date(vehicle.maintenance.nextService) < new Date();

              return (
                <Card 
                  key={vehicle.id} 
                  className={`border-2 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    isOverdue ? 'border-red-200' : 'border-gray-200'
                  } ${selectedVehicle?.id === vehicle.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getVehicleTypeIcon(vehicle.type)}
                        <div>
                          <CardTitle className="text-lg">{vehicle.plateNumber}</CardTitle>
                          <p className="text-sm text-gray-600">{getVehicleTypeLabel(vehicle.type)}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {getStatusLabel(vehicle.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">السائق</p>
                        <p className="font-medium">{vehicle.driver.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < vehicle.driver.rating 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">الموقع</p>
                        <p className="font-medium">{vehicle.location.address}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(vehicle.location.lastUpdate)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">الحمولة</span>
                        <span className="text-sm font-medium">
                          {vehicle.currentLoad}/{vehicle.capacity} طن
                        </span>
                      </div>
                      <Progress value={loadPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-orange-500" />
                        <span>{vehicle.fuelLevel}%</span>
                      </div>
                      {vehicle.temperature && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-blue-500" />
                          <span>{vehicle.temperature}°م</span>
                        </div>
                      )}
                    </div>

                    {isOverdue && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          موعد الصيانة متأخر
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MapPin className="h-3 w-3 ml-1" />
                        تتبع
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-3 w-3 ml-1" />
                        اتصال
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {selectedVehicle?.id === vehicle.id && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">معلومات الأداء</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">التسليم في الوقت:</span>
                              <span className="font-medium ml-1">{vehicle.performance.onTimeDeliveries}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">كفاءة الوقود:</span>
                              <span className="font-medium ml-1">{vehicle.performance.fuelEfficiency} ل/100كم</span>
                            </div>
                            <div>
                              <span className="text-gray-600">نقاط الأمان:</span>
                              <span className="font-medium ml-1">{vehicle.performance.safetyScore}/100</span>
                            </div>
                            <div>
                              <span className="text-gray-600">تقييم العملاء:</span>
                              <span className="font-medium ml-1">{vehicle.performance.customerRating}/5</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">معلومات الصيانة</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">آخر صيانة:</span>
                              <span>{formatDate(vehicle.maintenance.lastService)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">الصيانة القادمة:</span>
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {formatDate(vehicle.maintenance.nextService)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">المسافة الم��طوعة:</span>
                              <span>{vehicle.maintenance.mileage.toLocaleString('ar-TN')} كم</span>
                            </div>
                          </div>

                          {vehicle.maintenance.issues.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 mb-1">مشاكل محتملة:</p>
                              <div className="space-y-1">
                                {vehicle.maintenance.issues.map((issue, index) => (
                                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800 text-sm">
                                      {issue}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-6">
          <div className="space-y-4">
            {vehicles.filter(v => v.status === 'in_transit').map((vehicle) => (
              <Card key={vehicle.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{vehicle.plateNumber}</h3>
                        <Badge className="bg-blue-100 text-blue-800">في الطريق</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">من:</span>
                          <span className="ml-1">{vehicle.route.origin}</span>
                        </div>
                        <div>
                          <span className="font-medium">إلى:</span>
                          <span className="ml-1">{vehicle.route.destination}</span>
                        </div>
                        <div>
                          <span className="font-medium">المسافة:</span>
                          <span className="ml-1">{vehicle.route.distance} كم</span>
                        </div>
                        <div>
                          <span className="font-medium">الوقت المتوقع:</span>
                          <span className="ml-1">{vehicle.route.estimatedDuration}h</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">تقدم الرحلة</span>
                          <span className="text-sm text-gray-600">
                            {vehicle.route.stops.filter(s => s.status === 'completed').length} من {vehicle.route.stops.length}
                          </span>
                        </div>
                        <Progress 
                          value={(vehicle.route.stops.filter(s => s.status === 'completed').length / vehicle.route.stops.length) * 100} 
                          className="h-2" 
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">المحطات القادمة:</h4>
                        {vehicle.route.stops.filter(s => s.status === 'pending').slice(0, 3).map((stop) => (
                          <div key={stop.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="p-1 bg-blue-100 rounded">
                              {stop.type === 'pickup' ? <Package className="h-3 w-3 text-blue-600" /> : 
                               stop.type === 'delivery' ? <MapPin className="h-3 w-3 text-green-600" /> :
                               stop.type === 'fuel' ? <Fuel className="h-3 w-3 text-orange-600" /> :
                               <Clock className="h-3 w-3 text-purple-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{stop.address}</p>
                              <p className="text-xs text-gray-600">
                                متوقع: {formatDate(stop.estimatedTime)}
                              </p>
                            </div>
                            <div className="text-right text-xs text-gray-600">
                              <p>{stop.cargo.weight} كغ</p>
                              <p>{formatCurrency(stop.cargo.value)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
                      <p className="text-sm text-gray-600">{order.customer.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}>
                        {order.status === 'delivered' ? 'تم التسليم' :
                         order.status === 'in_transit' ? 'في الطريق' :
                         order.status === 'assigned' ? 'مخصص' :
                         order.status === 'failed' ? 'فشل' : 'قيد الانتظار'}
                      </Badge>
                      <Badge className={`${getPriorityColor(order.priority)} bg-opacity-10`}>
                        {getPriorityLabel(order.priority)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="text-gray-600">العنوان</p>
                    <p className="font-medium">{order.customer.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">المواد</p>
                      <p className="font-medium">{order.items.length} صنف</p>
                    </div>
                    <div>
                      <p className="text-gray-600">الوزن الإجمالي</p>
                      <p className="font-medium">
                        {order.items.reduce((sum, item) => sum + item.weight, 0)} كغ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">الموعد المخطط</p>
                      <p className="font-medium">{formatDate(order.scheduledTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">التسليم المتوقع</p>
                      <p className="font-medium">{formatDate(order.estimatedDelivery)}</p>
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        {order.specialInstructions}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 ml-1" />
                      تفاصيل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="space-y-4">
            {routeOptimizations.map((optimization) => (
              <Card key={optimization.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Route className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">{optimization.name}</h3>
                        <Badge className={optimization.status === 'completed' ? 'bg-green-100 text-green-800' :
                          optimization.status === 'optimizing' ? 'bg-blue-100 text-blue-800' :
                          optimization.status === 'applied' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}>
                          {optimization.status === 'completed' ? 'مكتمل' :
                           optimization.status === 'optimizing' ? 'جاري التحسين' :
                           optimization.status === 'applied' ? 'مطبق' : 'قيد الانتظار'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">المركبات:</span>
                          <span className="ml-1">{optimization.vehicles.length}</span>
                        </div>
                        <div>
                          <span className="font-medium">الطلبات:</span>
                          <span className="ml-1">{optimization.orders.length}</span>
                        </div>
                        <div>
                          <span className="font-medium">المسافة الإجمالية:</span>
                          <span className="ml-1">{optimization.result.totalDistance} كم</span>
                        </div>
                        <div>
                          <span className="font-medium">الوقت المتوقع:</span>
                          <span className="ml-1">{optimization.result.totalTime}h</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="font-bold text-green-600">{formatCurrency(optimization.result.estimatedCost)}</p>
                          <p className="text-xs text-gray-600">تكلفة متوقعة</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="font-bold text-blue-600">{optimization.result.fuelConsumption} ل</p>
                          <p className="text-xs text-gray-600">استهلاك الوقود</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="font-bold text-purple-600">{optimization.result.co2Emissions} كغ</p>
                          <p className="text-xs text-gray-600">انبعاثات CO2</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {optimization.status === 'completed' && (
                        <Button size="sm" className="gap-2">
                          <CheckCircle className="h-3 w-3" />
                          تطبيق
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
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
                      <span>التسليم في الوقت</span>
                      <span className="font-bold text-green-600">{metrics.onTimeDelivery}%</span>
                    </div>
                    <Progress value={metrics.onTimeDelivery} />
                    
                    <div className="flex items-center justify-between">
                      <span>رضا العملاء</span>
                      <span className="font-bold text-blue-600">{metrics.customerSatisfaction}%</span>
                    </div>
                    <Progress value={metrics.customerSatisfaction} className="[&>*]:bg-blue-500" />
                    
                    <div className="flex items-center justify-between">
                      <span>حوادث الأمان</span>
                      <span className="font-bold text-red-600">{metrics.safetyIncidents}</span>
                    </div>
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
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {metrics.co2Emissions} كغ
                      </div>
                      <p className="text-gray-600">انبعاثات CO2 هذا الشهر</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {metrics.fuelEfficiency} ل
                        </div>
                        <p className="text-sm text-gray-600">كفاءة الوقود</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">
                          {metrics.totalDistance} كم
                        </div>
                        <p className="text-sm text-gray-600">المسافة الإجمالية</p>
                      </div>
                    </div>
                    
                    <Alert className="border-green-200 bg-green-50">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        تحسن 12% في كفاءة الوقود هذا الشهر
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartLogistics;
