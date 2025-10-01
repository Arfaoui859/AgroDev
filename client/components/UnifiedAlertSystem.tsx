import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  X,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Droplets,
  Bug,
  Thermometer,
  CloudRain,
  DollarSign,
  Leaf,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  Activity,
  Zap,
  Target,
  Users,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Star,
  Archive
} from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'weather' | 'disease' | 'irrigation' | 'pest' | 'soil' | 'market' | 'equipment' | 'crop' | 'financial';
  category: 'emergency' | 'warning' | 'info' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  timestamp: string;
  expiresAt?: string;
  actionable: boolean;
  actionText?: string;
  actionTextArabic?: string;
  actionUrl?: string;
  resolved: boolean;
  starred: boolean;
  source: string;
  sourceArabic: string;
  location?: string;
  locationArabic?: string;
  severity: number; // 1-10 scale
  affectedArea?: string;
  estimatedImpact?: string;
  recommendedActions?: string[];
  recommendedActionsArabic?: string[];
  relatedCrop?: string;
  weatherData?: any;
  readStatus: 'unread' | 'read' | 'acknowledged';
}

interface AlertFilters {
  type?: string;
  priority?: string;
  category?: string;
  status?: string;
  dateRange?: string;
  source?: string;
}

interface UnifiedAlertSystemProps {
  isArabic?: boolean;
  showNotifications?: boolean;
  onAlertAction?: (alertId: string, action: string, data?: any) => void;
}

const UnifiedAlertSystem: React.FC<UnifiedAlertSystemProps> = ({
  isArabic = false,
  showNotifications = true,
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock alert data with comprehensive examples
  const mockAlerts: AlertItem[] = [
    {
      id: 'alert_001',
      type: 'weather',
      category: 'emergency',
      priority: 'critical',
      title: 'Severe Weather Warning',
      titleArabic: 'تحذير من طقس قاسي',
      message: 'Strong winds (60 km/h) and hail expected in the next 2 hours. Secure equipment and protect crops.',
      messageArabic: 'رياح قوية (60 كم/س) وبرَد متوقع خلال الساعتين القادمتين. تأمين المعدات وحماية المحاصيل.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      actionable: true,
      actionText: 'Secure Farm',
      actionTextArabic: 'تأمين المزرعة',
      resolved: false,
      starred: false,
      source: 'Weather Service',
      sourceArabic: 'خدمة الأرصاد',
      location: 'Main Field',
      locationArabic: 'الحقل الرئيسي',
      severity: 9,
      affectedArea: '15 hectares',
      estimatedImpact: 'High risk of crop damage',
      recommendedActions: ['Secure irrigation equipment', 'Cover vulnerable crops', 'Move livestock to shelter'],
      recommendedActionsArabic: ['تأمين معدات الري', 'تغطية المحاصيل المعرضة', 'نقل الماشية للمأوى'],
      readStatus: 'unread'
    },
    {
      id: 'alert_002',
      type: 'disease',
      category: 'warning',
      priority: 'high',
      title: 'Early Blight Detected',
      titleArabic: 'اكتشاف اللفحة ا��مبكرة',
      message: 'Early blight symptoms detected on tomato plants in greenhouse 2. Immediate treatment recommended.',
      messageArabic: 'تم اكتشاف أعراض اللفحة المبكرة على نباتات الطماطم في البيت الزجاجي 2. العلاج الفوري موصى به.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionable: true,
      actionText: 'Start Treatment',
      actionTextArabic: 'بدء العلاج',
      actionUrl: '/treatment-recommendations',
      resolved: false,
      starred: true,
      source: 'AI Disease Detection',
      sourceArabic: 'كشف الأمراض بالذكاء الاصطناعي',
      location: 'Greenhouse 2',
      locationArabic: 'البيت الزجاجي 2',
      severity: 7,
      affectedArea: '500m²',
      estimatedImpact: 'Potential 20-30% yield loss if untreated',
      recommendedActions: ['Apply fungicide', 'Improve ventilation', 'Remove affected leaves'],
      recommendedActionsArabic: ['تطبيق مبيد الفطريات', 'تحسين التهوية', 'إزالة الأوراق المصابة'],
      relatedCrop: 'Tomatoes',
      readStatus: 'read'
    },
    {
      id: 'alert_003',
      type: 'irrigation',
      category: 'warning',
      priority: 'medium',
      title: 'Low Soil Moisture',
      titleArabic: 'رطوبة التربة منخفضة',
      message: 'Soil moisture levels in wheat field zone 3 have dropped below optimal threshold (35%).',
      messageArabic: 'انخفضت مستويات رطوبة التربة في منطقة حقل القمح 3 تحت العتبة المثلى (35%).',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      actionable: true,
      actionText: 'Schedule Irrigation',
      actionTextArabic: 'جدولة الري',
      actionUrl: '/smart-irrigation',
      resolved: false,
      starred: false,
      source: 'IoT Sensors',
      sourceArabic: 'أجهزة الاستشعار',
      location: 'Wheat Field Zone 3',
      locationArabic: 'منطقة حقل القمح 3',
      severity: 5,
      affectedArea: '3.2 hectares',
      estimatedImpact: 'Moderate stress on crop growth',
      recommendedActions: ['Start irrigation within 6 hours', 'Check irrigation system'],
      recommendedActionsArabic: ['بدء الري خلال 6 ساعات', 'فحص نظام الري'],
      relatedCrop: 'Wheat',
      readStatus: 'unread'
    },
    {
      id: 'alert_004',
      type: 'market',
      category: 'info',
      priority: 'low',
      title: 'Price Increase Opportunity',
      titleArabic: 'فرصة ارتفاع الأسعار',
      message: 'Olive oil prices have increased by 15% this week. Consider selling current stock.',
      messageArabic: 'ارتفعت أسعار زيت الزيتون بنسبة 15% هذا الأسبوع. فكر في بيع المخزون الحالي.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      actionable: true,
      actionText: 'View Market',
      actionTextArabic: 'عرض السوق',
      actionUrl: '/market-dashboard',
      resolved: false,
      starred: false,
      source: 'Market Analysis',
      sourceArabic: 'تحليل السوق',
      severity: 3,
      estimatedImpact: 'Potential revenue increase of 15%',
      readStatus: 'acknowledged'
    },
    {
      id: 'alert_005',
      type: 'pest',
      category: 'warning',
      priority: 'high',
      title: 'Aphid Infestation Risk',
      titleArabic: 'خطر انتشار المن',
      message: 'Weather conditions favor aphid reproduction. Preventive measures recommended for citrus trees.',
      messageArabic: 'الظروف الجوية تساعد على تكاثر المن. التدابير الوقائية موصى بها لأشجار الحمضيات.',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      actionable: true,
      actionText: 'Apply Prevention',
      actionTextArabic: 'تطبيق الوقاية',
      resolved: false,
      starred: false,
      source: 'Pest Prediction Model',
      sourceArabic: 'نموذج التنبؤ بالآفات',
      location: 'Citrus Grove',
      locationArabic: 'بستان الحمضيات',
      severity: 6,
      affectedArea: '2.8 hectares',
      estimatedImpact: 'Potential infestation within 3-5 days',
      recommendedActions: ['Apply neem oil', 'Release beneficial insects', 'Monitor daily'],
      recommendedActionsArabic: ['تطبيق زيت النيم', 'إطلاق الحشرات المفيدة', 'المراقبة اليومية'],
      relatedCrop: 'Citrus',
      readStatus: 'unread'
    }
  ];

  useEffect(() => {
    // Simulate loading alerts
    setLoading(true);
    setTimeout(() => {
      setAlerts(mockAlerts);
      setFilteredAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Auto-refresh alerts every 2 minutes if enabled
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // In a real app, this would fetch new alerts from the API
      console.log('Auto-refreshing alerts...');
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    // Apply filters and search
    let filtered = alerts;

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }
    if (filters.priority) {
      filtered = filtered.filter(alert => alert.priority === filters.priority);
    }
    if (filters.category) {
      filtered = filtered.filter(alert => alert.category === filters.category);
    }
    if (filters.status === 'resolved') {
      filtered = filtered.filter(alert => alert.resolved);
    } else if (filters.status === 'active') {
      filtered = filtered.filter(alert => !alert.resolved);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(query) ||
        alert.titleArabic.includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.messageArabic.includes(query)
      );
    }

    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredAlerts(filtered);
  }, [alerts, filters, searchQuery]);

  const handleAlertAction = async (alert: AlertItem, action: string, data?: any) => {
    if (onAlertAction) {
      await onAlertAction(alert.id, action, data);
    }

    // Update local state
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, readStatus: action === 'resolve' ? 'acknowledged' : 'read', resolved: action === 'resolve' }
        : a
    ));
  };

  const toggleStar = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, starred: !alert.starred } : alert
    ));
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, readStatus: 'read' } : alert
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency': return AlertTriangle;
      case 'warning': return Bell;
      case 'info': return Eye;
      case 'recommendation': return TrendingUp;
      default: return Bell;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather': return CloudRain;
      case 'disease': return Bug;
      case 'irrigation': return Droplets;
      case 'pest': return Bug;
      case 'soil': return Activity;
      case 'market': return DollarSign;
      case 'equipment': return Settings;
      case 'crop': return Leaf;
      case 'financial': return DollarSign;
      default: return Bell;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return isArabic ? 'الآن' : 'Now';
    if (diffInMinutes < 60) return isArabic ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return isArabic ? `منذ ${diffInHours} ساعة` : `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return isArabic ? `منذ ${diffInDays} يوم` : `${diffInDays}d ago`;
  };

  const unreadCount = alerts.filter(alert => alert.readStatus === 'unread').length;
  const criticalCount = alerts.filter(alert => alert.priority === 'critical' && !alert.resolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{isArabic ? 'جاري تحميل التنبيهات...' : 'Loading alerts...'}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">{isArabic ? 'تنبيهات حرجة' : 'Critical Alerts'}</p>
                <p className="text-2xl font-bold text-red-800">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">{isArabic ? 'غير مقروءة' : 'Unread'}</p>
                <p className="text-2xl font-bold text-orange-800">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">{isArabic ? 'إجمالي التنبيهات' : 'Total Alerts'}</p>
                <p className="text-2xl font-bold text-blue-800">{alerts.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">{isArabic ? 'تم حلها' : 'Resolved'}</p>
                <p className="text-2xl font-bold text-green-800">{alerts.filter(a => a.resolved).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>{isArabic ? 'نظام التنبيهات الموحد' : 'Unified Alert System'}</span>
              </CardTitle>
              <CardDescription>
                {isArabic ? 'إدارة شاملة لجميع التنبيهات والإشعارات' : 'Comprehensive management of all alerts and notifications'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-100' : ''}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-green-600' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في التنبيهات...' : 'Search alerts...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filters.priority || ''} onValueChange={(value) => setFilters({...filters, priority: value || undefined})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={isArabic ? 'الأولوية' : 'Priority'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="critical">{isArabic ? 'حرج' : 'Critical'}</SelectItem>
                  <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
                  <SelectItem value="medium">{isArabic ? 'متوسط' : 'Medium'}</SelectItem>
                  <SelectItem value="low">{isArabic ? 'منخفض' : 'Low'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.type || ''} onValueChange={(value) => setFilters({...filters, type: value || undefined})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={isArabic ? 'النوع' : 'Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="weather">{isArabic ? 'طقس' : 'Weather'}</SelectItem>
                  <SelectItem value="disease">{isArabic ? 'أمراض' : 'Disease'}</SelectItem>
                  <SelectItem value="irrigation">{isArabic ? 'ري' : 'Irrigation'}</SelectItem>
                  <SelectItem value="pest">{isArabic ? 'آفات' : 'Pest'}</SelectItem>
                  <SelectItem value="market">{isArabic ? 'سوق' : 'Market'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value || undefined})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="active">{isArabic ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="resolved">{isArabic ? 'تم حله' : 'Resolved'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{isArabic ? 'لا توجد تنبيهات' : 'No alerts found'}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAlerts.map((alert) => {
                  const CategoryIcon = getCategoryIcon(alert.category);
                  const TypeIcon = getTypeIcon(alert.type);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        alert.readStatus === 'unread' ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex flex-col items-center space-y-1">
                            <TypeIcon className="h-5 w-5 text-gray-600" />
                            <Badge className={getPriorityColor(alert.priority)} variant="outline">
                              {alert.priority}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm">
                                {isArabic ? alert.titleArabic : alert.title}
                              </h4>
                              {alert.starred && <Star className="h-4 w-4 text-yellow-500" />}
                              {alert.readStatus === 'unread' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {isArabic ? alert.messageArabic : alert.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(alert.timestamp)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{isArabic ? alert.sourceArabic : alert.source}</span>
                              </span>
                              {alert.location && (
                                <span className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{isArabic ? alert.locationArabic : alert.location}</span>
                                </span>
                              )}
                              <span className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{isArabic ? 'الشدة' : 'Severity'}: {alert.severity}/10</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(alert.id);
                            }}
                          >
                            <Star className={`h-4 w-4 ${alert.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <TypeIcon className="h-5 w-5" />
                                  <span>{isArabic ? alert.titleArabic : alert.title}</span>
                                  <Badge className={getPriorityColor(alert.priority)}>
                                    {alert.priority}
                                  </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                  {isArabic ? alert.sourceArabic : alert.source} • {formatTimeAgo(alert.timestamp)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">{isArabic ? 'الرسالة' : 'Message'}</h4>
                                  <p className="text-sm text-gray-600">
                                    {isArabic ? alert.messageArabic : alert.message}
                                  </p>
                                </div>
                                {alert.estimatedImpact && (
                                  <div>
                                    <h4 className="font-medium mb-2">{isArabic ? 'التأثير المتوقع' : 'Expected Impact'}</h4>
                                    <p className="text-sm text-gray-600">{alert.estimatedImpact}</p>
                                  </div>
                                )}
                                {alert.recommendedActions && (
                                  <div>
                                    <h4 className="font-medium mb-2">{isArabic ? 'الإجراءات الموصى بها' : 'Recommended Actions'}</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {(isArabic ? alert.recommendedActionsArabic || [] : alert.recommendedActions).map((action, index) => (
                                        <li key={index} className="flex items-center space-x-2">
                                          <ChevronRight className="h-3 w-3" />
                                          <span>{action}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex space-x-2">
                                  {alert.actionable && alert.actionText && (
                                    <Button
                                      onClick={() => handleAlertAction(alert, 'action')}
                                      className="flex-1"
                                    >
                                      {isArabic ? alert.actionTextArabic : alert.actionText}
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    onClick={() => handleAlertAction(alert, 'resolve')}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {isArabic ? 'تم الحل' : 'Resolve'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {alert.actionable && alert.actionText && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlertAction(alert, 'action');
                              }}
                            >
                              {isArabic ? alert.actionTextArabic : alert.actionText}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedAlertSystem;
