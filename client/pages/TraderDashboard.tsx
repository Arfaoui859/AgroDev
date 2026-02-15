import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Truck,
  Warehouse,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Edit,
  Trash,
  Download,
  Upload,
  Settings,
  Bell,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  Banknote,
  Building,
  FileText,
  Clipboard,
  ChevronRight,
  MoreHorizontal,
  Share,
  Flag,
  Shield,
  Award,
  Zap,
  Activity
} from 'lucide-react';

interface TraderDashboardProps {
  traderId?: string;
  onCreateOrder?: (orderData: any) => void;
  onContactClient?: (clientId: string) => void;
}

interface Product {
  id: string;
  name: string;
  nameArabic: string;
  category: string;
  type: 'buying' | 'selling' | 'both';
  currentStock: number;
  unit: string;
  unitArabic: string;
  buyingPrice: number;
  sellingPrice: number;
  profitMargin: number;
  supplier?: string;
  supplierArabic?: string;
  quality: string;
  expiryDate?: string;
  storageLocation: string;
  storageLocationArabic: string;
  demand: 'high' | 'medium' | 'low';
  marketTrend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

interface Order {
  id: string;
  type: 'purchase' | 'sale';
  status: string;
  clientName: string;
  clientNameArabic: string;
  clientType: string;
  products: Array<{
    productId: string;
    productName: string;
    productNameArabic: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  shippingAddress: string;
  shippingAddressArabic: string;
  priority: string;
}

interface MarketOpportunity {
  id: string;
  type: 'buying' | 'selling';
  productCategory: string;
  productCategoryArabic: string;
  description: string;
  descriptionArabic: string;
  quantity: number;
  priceRange: {
    min: number;
    max: number;
  };
  location: string;
  locationArabic: string;
  contactInfo: {
    name: string;
    nameArabic: string;
    phone: string;
    email?: string;
  };
  validUntil: string;
  urgency: string;
  quality: string;
  qualityArabic: string;
  verified: boolean;
  source: string;
}

interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  productNameArabic: string;
  alertType: string;
  message: string;
  messageArabic: string;
  severity: 'info' | 'warning' | 'critical';
  currentStock: number;
  recommendedAction: string;
  recommendedActionArabic: string;
  createdAt: string;
  acknowledged: boolean;
}

const TraderDashboard: React.FC<TraderDashboardProps> = ({
  traderId = 'trader_001',
  onCreateOrder,
  onContactClient
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketOpportunities, setMarketOpportunities] = useState<MarketOpportunity[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        overviewResponse,
        inventoryResponse,
        ordersResponse,
        opportunitiesResponse,
        alertsResponse,
        financialResponse
      ] = await Promise.all([
        fetch('/api/trader-dashboard/overview'),
        fetch('/api/trader-dashboard/inventory'),
        fetch('/api/trader-dashboard/orders'),
        fetch('/api/trader-dashboard/market-opportunities'),
        fetch('/api/trader-dashboard/alerts'),
        fetch('/api/trader-dashboard/financial-summary')
      ]);

      const [overview, inventoryData, ordersData, opportunitiesData, alertsData, financialData] = await Promise.all([
        overviewResponse.json(),
        inventoryResponse.json(),
        ordersResponse.json(),
        opportunitiesResponse.json(),
        alertsResponse.json(),
        financialResponse.json()
      ]);

      setDashboardData(overview.data);
      setInventory(inventoryData.data);
      setOrders(ordersData.data);
      setMarketOpportunities(opportunitiesData.data);
      setAlerts(alertsData.data);
      setFinancialSummary(financialData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/trader-dashboard/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/trader-dashboard/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action_taken: 'Acknowledged by trader' }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': case 'paid': case 'delivered': case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending': case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped': case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled': case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'falling': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return isArabic ? 'اليوم' : 'Today';
    if (diffInDays === 1) return isArabic ? 'أمس' : 'Yesterday';
    return isArabic ? `منذ ${diffInDays} أيام` : `${diffInDays} days ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredInventory = inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.nameArabic.includes(searchQuery);

    const matchesCategory = !filterCategory || filterCategory === 'all' || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.clientNameArabic.includes(searchQuery);

    const matchesStatus = !filterStatus || filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isArabic ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription>
            {isArabic ? 'فشل في تحميل البيانات' : 'Failed to load dashboard data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-800" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'لوحة تحكم التاجر' : 'Trader Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة المخزون والطلبات والفرص التجارية' : 'Inventory management, orders, and market opportunities'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="text-sm"
          >
            {isArabic ? 'English' : 'العربية'}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المنتجات' : 'Total Products'}</p>
                <p className="text-2xl font-bold">{dashboardData.summary.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'الطلبات المعلقة' : 'Pending Orders'}</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.summary.pendingOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'الإيرادات اليومية' : 'Daily Revenue'}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.summary.dailyRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'هامش الربح' : 'Profit Margin'}</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.summary.profitMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Alerts */}
      {dashboardData.urgentAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{isArabic ? 'تنبيهات عاجلة' : 'Urgent Alerts'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.urgentAlerts.map((alert: InventoryAlert) => (
                <Alert key={alert.id} className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-sm">
                      {isArabic ? alert.messageArabic : alert.message}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      {isArabic ? 'تأكيد' : 'Acknowledge'}
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="inventory">{isArabic ? 'المخزون' : 'Inventory'}</TabsTrigger>
          <TabsTrigger value="orders">{isArabic ? 'الطلبات' : 'Orders'}</TabsTrigger>
          <TabsTrigger value="opportunities">{isArabic ? 'الفرص' : 'Opportunities'}</TabsTrigger>
          <TabsTrigger value="alerts">{isArabic ? 'التنبيهات' : 'Alerts'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="financial">{isArabic ? 'المالية' : 'Financial'}</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في المنتجات...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الفئة' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="seeds">{isArabic ? 'بذور' : 'Seeds'}</SelectItem>
                  <SelectItem value="fertilizers">{isArabic ? 'أسمدة' : 'Fertilizers'}</SelectItem>
                  <SelectItem value="pesticides">{isArabic ? 'مبيدات' : 'Pesticides'}</SelectItem>
                  <SelectItem value="equipment">{isArabic ? 'معدات' : 'Equipment'}</SelectItem>
                  <SelectItem value="crops">{isArabic ? 'محاصيل' : 'Crops'}</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {isArabic ? 'منتج ج��يد' : 'Add Product'}
              </Button>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {isArabic ? product.nameArabic : product.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {isArabic ? product.supplierArabic : product.supplier}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <Badge className={
                          product.demand === 'high' ? 'bg-green-100 text-green-800' :
                          product.demand === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {product.demand}
                        </Badge>
                      </div>
                    </div>
                    {getTrendIcon(product.marketTrend)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'المخزون' : 'Stock'}</span>
                      <span className={`font-medium ${product.currentStock < 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.currentStock} {isArabic ? product.unitArabic : product.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'سعر البيع' : 'Selling Price'}</span>
                      <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'هامش الربح' : 'Profit Margin'}</span>
                      <span className="font-medium text-green-600">{product.profitMargin}%</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1" onClick={() => setSelectedProduct(product)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'التفاصيل' : 'Details'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{isArabic ? product.nameArabic : product.name}</DialogTitle>
                          <DialogDescription>
                            {isArabic ? `${product.category} - ${product.quality}` : `${product.category} - ${product.quality}`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'معلومات المنتج' : 'Product Information'}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'الفئة' : 'Category'}:</span>
                                  <span>{product.category}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'النوع' : 'Type'}:</span>
                                  <span>{product.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'الجودة' : 'Quality'}:</span>
                                  <span>{product.quality}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'المخزون الحالي' : 'Current Stock'}:</span>
                                  <span>{product.currentStock} {isArabic ? product.unitArabic : product.unit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'مو��ع التخزين' : 'Storage Location'}:</span>
                                  <span>{isArabic ? product.storageLocationArabic : product.storageLocation}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'المعلومات المالية' : 'Financial Information'}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'سعر الشراء' : 'Buying Price'}:</span>
                                  <span>{formatCurrency(product.buyingPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'سعر البيع' : 'Selling Price'}:</span>
                                  <span>{formatCurrency(product.sellingPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'هامش الربح' : 'Profit Margin'}:</span>
                                  <span className="text-green-600">{product.profitMargin}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'الطلب' : 'Demand'}:</span>
                                  <span>{product.demand}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'اتجاه السوق' : 'Market Trend'}:</span>
                                  <div className="flex items-center space-x-1">
                                    {getTrendIcon(product.marketTrend)}
                                    <span>{product.marketTrend}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {product.expiryDate && (
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'معلومات إضافية' : 'Additional Information'}</h4>
                              <p className="text-sm">
                                <span className="text-gray-600">{isArabic ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}:</span> {new Date(product.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <Button className="flex-1">
                              <Edit className="h-4 w-4 mr-2" />
                              {isArabic ? 'تعديل' : 'Edit'}
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Plus className="h-4 w-4 mr-2" />
                              {isArabic ? 'إنشاء طلب' : 'Create Order'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isArabic ? 'إدارة الطلبات' : 'Order Management'}</h3>
            <div className="flex space-x-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="pending">{isArabic ? 'معلق' : 'Pending'}</SelectItem>
                  <SelectItem value="confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                  <SelectItem value="processing">{isArabic ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                  <SelectItem value="shipped">{isArabic ? 'تم الشحن' : 'Shipped'}</SelectItem>
                  <SelectItem value="delivered">{isArabic ? 'تم التسليم' : 'Delivered'}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => onCreateOrder?.({})}>
                <Plus className="h-4 w-4 mr-2" />
                {isArabic ? 'طلب جديد' : 'New Order'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">#{order.id}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge variant="outline">
                          {order.type}
                        </Badge>
                        <Badge className={
                          order.priority === 'urgent' ? 'bg-red-500 text-white' :
                          order.priority === 'high' ? 'bg-orange-500 text-white' :
                          'bg-blue-500 text-white'
                        }>
                          {order.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">{isArabic ? 'العميل' : 'Client'}</p>
                          <p className="font-medium">{isArabic ? order.clientNameArabic : order.clientName}</p>
                          <p className="text-xs text-gray-500">{order.clientType}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}</p>
                          <p className="font-medium text-green-600">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-gray-500">
                            {isArabic ? 'الدفع' : 'Payment'}: <Badge className={getStatusColor(order.paymentStatus)} variant="outline">{order.paymentStatus}</Badge>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">{isArabic ? 'التسليم المتوقع' : 'Expected Delivery'}</p>
                          <p className="font-medium">{new Date(order.expectedDelivery).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(order.orderDate)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {isArabic ? order.shippingAddressArabic : order.shippingAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{isArabic ? 'تفاصيل الطلب' : 'Order Details'} #{order.id}</DialogTitle>
                            <DialogDescription>
                              {isArabic ? order.clientNameArabic : order.clientName} • {order.type}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'المنتجات' : 'Products'}</h4>
                              <div className="space-y-2">
                                {order.products.map((product, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                                    <div>
                                      <p className="font-medium text-sm">{isArabic ? product.productNameArabic : product.productName}</p>
                                      <p className="text-xs text-gray-600">{product.quantity} × {formatCurrency(product.unitPrice)}</p>
                                    </div>
                                    <p className="font-medium">{formatCurrency(product.totalPrice)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="font-medium">{isArabic ? 'المجموع الإجمالي' : 'Total Amount'}</span>
                              <span className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Select onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder={isArabic ? 'تحديث الحالة' : 'Update Status'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                  <SelectItem value="processing">{isArabic ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                                  <SelectItem value="shipped">{isArabic ? 'تم الشحن' : 'Shipped'}</SelectItem>
                                  <SelectItem value="delivered">{isArabic ? 'تم التسليم' : 'Delivered'}</SelectItem>
                                  <SelectItem value="cancelled">{isArabic ? 'ملغي' : 'Cancelled'}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="outline" onClick={() => onContactClient?.(order.clientName)}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {isArabic ? 'تواصل' : 'Contact'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" onClick={() => onContactClient?.(order.clientName)}>
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isArabic ? 'الفرص التجارية' : 'Market Opportunities'}</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'فرصة جديدة' : 'Add Opportunity'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{isArabic ? opportunity.productCategoryArabic : opportunity.productCategory}</h4>
                        <Badge className={
                          opportunity.type === 'buying' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }>
                          {opportunity.type}
                        </Badge>
                        <Badge className={
                          opportunity.urgency === 'urgent' ? 'bg-red-500 text-white' :
                          opportunity.urgency === 'high' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-white'
                        }>
                          {opportunity.urgency}
                        </Badge>
                        {opportunity.verified && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {isArabic ? opportunity.descriptionArabic : opportunity.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{isArabic ? opportunity.locationArabic : opportunity.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{opportunity.quantity} {isArabic ? 'وحدة' : 'units'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(opportunity.priceRange.min)} - {formatCurrency(opportunity.priceRange.max)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{isArabic ? 'صالح حتى' : 'Valid until'} {new Date(opportunity.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {isArabic ? 'تواصل' : 'Contact'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Star className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-lg font-semibold">{isArabic ? 'تنبيهات المخزون' : 'Inventory Alerts'}</h3>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <h4 className="font-semibold">{isArabic ? alert.productNameArabic : alert.productName}</h4>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alertType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {isArabic ? alert.messageArabic : alert.message}
                      </p>
                      <p className="text-sm text-blue-600">
                        <strong>{isArabic ? 'الإجراء الموصى به' : 'Recommended Action'}:</strong> {isArabic ? alert.recommendedActionArabic : alert.recommendedAction}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(alert.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <Button size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isArabic ? 'تأكيد' : 'Acknowledge'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isArabic ? 'مؤشرات الأداء' : 'Performance Metrics'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.customerSatisfactionScore}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'رضا العملاء' : 'Customer Satisfaction'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.deliverySuccessRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'نجاح التسليم' : 'Delivery Success'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(dashboardData.metrics.averageOrderValue)}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'متوسط الطلب' : 'Average Order Value'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.inventoryTurnover}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'دوران المخزون' : 'Inventory Turnover'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isArabic ? 'إحصائيات هذا الشهر' : 'This Month Stats'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.completedOrdersThisMonth}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'طلبات مكتملة' : 'Completed Orders'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.marketOpportunities}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'فرص السوق' : 'Market Opportunities'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.lowStockProducts}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'مخزون منخفض' : 'Low Stock Products'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.supplierRating}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'تقييم الموردين' : 'Supplier Rating'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          {financialSummary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>{isArabic ? 'الملخص المالي' : 'Financial Summary'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.revenue.monthly)}</p>
                      <p className="text-sm text-green-700">{isArabic ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.expenses.monthly)}</p>
                      <p className="text-sm text-red-700">{isArabic ? 'المصروفات الشهرية' : 'Monthly Expenses'}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.profit.monthly)}</p>
                      <p className="text-sm text-blue-700">{isArabic ? 'الربح الشهري' : 'Monthly Profit'}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{financialSummary.profitMargin.toFixed(1)}%</p>
                      <p className="text-sm text-purple-700">{isArabic ? 'هامش الربح' : 'Profit Margin'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{isArabic ? 'أفضل المنتجات أداءً' : 'Top Performing Products'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {financialSummary.topProducts.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium text-sm">{isArabic ? product.productNameArabic : product.productName}</p>
                            <p className="text-xs text-gray-600">{product.quantity} {isArabic ? 'وحدة مباعة' : 'units sold'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-gray-600">{product.profitMargin}% {isArabic ? 'ربح' : 'margin'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{isArabic ? 'المعلومات المالية الإضافية' : 'Additional Financial Info'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{isArabic ? 'التدفق النقدي' : 'Cash Flow'}</span>
                        <span className="font-semibold text-green-600">{formatCurrency(financialSummary.cashFlow)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{isArabic ? 'قيمة المخزون' : 'Inventory Value'}</span>
                        <span className="font-semibold">{formatCurrency(financialSummary.inventoryValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{isArabic ? 'المدفوعات المستحقة' : 'Outstanding Payments'}</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(financialSummary.outstandingPayments)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{isArabic ? 'الطلبات المعلقة' : 'Pending Orders'}</span>
                        <span className="font-semibold text-blue-600">{financialSummary.pendingOrders}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TraderDashboard;
