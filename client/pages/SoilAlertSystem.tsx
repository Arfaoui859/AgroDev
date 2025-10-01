import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Smartphone, 
  MessageSquare, 
  Mail,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Activity,
  Users,
  Calendar,
  Filter,
  Send,
  Volume2,
  VolumeX
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SoilAlert {
  id: string;
  fieldId: string;
  fieldName: string;
  problemType: 'salinity' | 'acidity' | 'alkalinity' | 'nutrient_deficiency' | 'contamination' | 'waterlogging' | 'drought_stress';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionRequired: string;
  dateCreated: string;
  resolved: boolean;
  notificationsSent: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  estimatedCost: number;
  urgency: 'immediate' | 'within_24h' | 'within_week' | 'monitoring';
  affectedArea: number; // في الهكتارات
  potentialLoss: number; // الخسائر المحتملة بالدينار
}

interface NotificationSettings {
  sms: {
    enabled: boolean;
    phoneNumbers: string[];
    severity: ('low' | 'medium' | 'high' | 'critical')[];
  };
  email: {
    enabled: boolean;
    addresses: string[];
    severity: ('low' | 'medium' | 'high' | 'critical')[];
  };
  push: {
    enabled: boolean;
    severity: ('low' | 'medium' | 'high' | 'critical')[];
  };
  whatsapp: {
    enabled: boolean;
    phoneNumbers: string[];
    severity: ('low' | 'medium' | 'high' | 'critical')[];
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    weekendsOnly: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
}

const problemTypeTranslation = {
  salinity: 'ملوحة التربة',
  acidity: 'حموضة التربة',
  alkalinity: 'قلوية التربة',
  nutrient_deficiency: 'نقص العناصر الغذائية',
  contamination: 'تلوث التربة',
  waterlogging: 'تشبع بالماء',
  drought_stress: 'إجهاد الجفاف'
};

const severityColors = {
  low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
};

const urgencyColors = {
  immediate: 'bg-red-500',
  within_24h: 'bg-orange-500',
  within_week: 'bg-yellow-500',
  monitoring: 'bg-blue-500'
};

const urgencyTranslation = {
  immediate: 'فوري',
  within_24h: 'خلال 24 ساعة',
  within_week: 'خلال أسبوع',
  monitoring: 'مراقبة'
};

export default function SoilAlertSystem() {
  const [alerts, setAlerts] = useState<SoilAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SoilAlert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('active');
  const [testNotification, setTestNotification] = useState('');

  useEffect(() => {
    fetchAlerts();
    loadNotificationSettings();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Generate mock alerts data
      const mockAlerts: SoilAlert[] = [
        {
          id: 'alert_001',
          fieldId: 'field_1',
          fieldName: 'الحقل الشمالي - القطاع أ',
          problemType: 'salinity',
          severity: 'critical',
          title: 'ملوحة عالية جداً مكتشفة',
          message: 'تم اكتشاف مستوى ملوحة خطير في التربة (EC: 8.5 dS/m) يتطلب تدخل فوري لمنع فقدان المحصول',
          actionRequired: 'تطبيق نظام غسيل فوري + تحسين الصرف',
          dateCreated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          notificationsSent: {
            sms: true,
            email: true,
            push: true,
            whatsapp: false
          },
          estimatedCost: 2500,
          urgency: 'immediate',
          affectedArea: 2.5,
          potentialLoss: 15000
        },
        {
          id: 'alert_002',
          fieldId: 'field_2',
          fieldName: 'الحقل الجنوبي - القطاع ب',
          problemType: 'nutrient_deficiency',
          severity: 'high',
          title: 'نقص حاد في النيتروجين',
          message: 'مستوى النيتروجين انخفض إلى 18 mg/kg وهو أقل بكثير من المستوى المطلوب للقمح',
          actionRequired: 'إضافة سماد نيتروجيني سريع المفعول',
          dateCreated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          notificationsSent: {
            sms: true,
            email: true,
            push: true,
            whatsapp: true
          },
          estimatedCost: 800,
          urgency: 'within_24h',
          affectedArea: 1.8,
          potentialLoss: 5000
        },
        {
          id: 'alert_003',
          fieldId: 'field_3',
          fieldName: 'الحقل الشرقي - القطاع ج',
          problemType: 'drought_stress',
          severity: 'medium',
          title: 'انخفاض مستوى الرطوبة',
          message: 'رطوبة التربة انخفضت إلى 8% مما قد يؤثر على نمو النباتات',
          actionRequired: 'زيادة معدل الري أو تحسين نظام الري',
          dateCreated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          notificationsSent: {
            sms: false,
            email: true,
            push: true,
            whatsapp: false
          },
          estimatedCost: 1200,
          urgency: 'within_week',
          affectedArea: 3.2,
          potentialLoss: 8000
        },
        {
          id: 'alert_004',
          fieldId: 'field_1',
          fieldName: 'الحقل الشمالي - القطاع أ',
          problemType: 'acidity',
          severity: 'high',
          title: 'حموضة التربة مرتفعة',
          message: 'مستوى pH انخفض إلى 4.8 مما يؤثر على توفر العناصر الغذائية',
          actionRequired: 'إضافة الجير الزراعي لرفع pH',
          dateCreated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          notificationsSent: {
            sms: true,
            email: true,
            push: true,
            whatsapp: true
          },
          estimatedCost: 600,
          urgency: 'within_24h',
          affectedArea: 1.5,
          potentialLoss: 3000
        },
        {
          id: 'alert_005',
          fieldId: 'field_4',
          fieldName: 'الحقل الغربي - القطاع د',
          problemType: 'waterlogging',
          severity: 'medium',
          title: 'تشبع التربة بالماء',
          message: 'مستوى الرطوبة وصل إلى 45% مما قد يسبب تعفن الجذور',
          actionRequired: 'تحسين الصرف وتقليل الري مؤقتاً',
          dateCreated: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          notificationsSent: {
            sms: true,
            email: true,
            push: true,
            whatsapp: false
          },
          estimatedCost: 1800,
          urgency: 'within_week',
          affectedArea: 2.1,
          potentialLoss: 6000
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = () => {
    // Load from localStorage or API
    const defaultSettings: NotificationSettings = {
      sms: {
        enabled: true,
        phoneNumbers: ['+216 98 123 456', '+216 22 789 012'],
        severity: ['high', 'critical']
      },
      email: {
        enabled: true,
        addresses: ['farmer@example.com', 'manager@farm.tn'],
        severity: ['medium', 'high', 'critical']
      },
      push: {
        enabled: true,
        severity: ['low', 'medium', 'high', 'critical']
      },
      whatsapp: {
        enabled: false,
        phoneNumbers: ['+216 98 123 456'],
        severity: ['high', 'critical']
      },
      schedule: {
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '06:00'
        },
        weekendsOnly: false,
        frequency: 'immediate'
      }
    };

    setSettings(defaultSettings);
  };

  const updateNotificationSettings = (newSettings: Partial<NotificationSettings>) => {
    if (settings) {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      // Save to localStorage or API
      localStorage.setItem('soilAlertSettings', JSON.stringify(updatedSettings));
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true }
        : alert
    ));
  };

  const sendTestNotification = async (type: 'sms' | 'email' | 'push' | 'whatsapp') => {
    setTestNotification('جاري الإرسال...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTestNotification(`تم إرسال اختبار ${type === 'sms' ? 'الرسالة النصية' : 
                        type === 'email' ? 'البريد الإلكتروني' :
                        type === 'push' ? 'الإشعار' : 'الواتساب'} بنجاح!`);
    
    setTimeout(() => setTestNotification(''), 3000);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesResolved = filterResolved === 'all' || 
                           (filterResolved === 'active' && !alert.resolved) ||
                           (filterResolved === 'resolved' && alert.resolved);
    return matchesSeverity && matchesResolved;
  });

  const getAlertStats = () => {
    const activeAlerts = alerts.filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const immediateAlerts = activeAlerts.filter(a => a.urgency === 'immediate');
    const totalPotentialLoss = activeAlerts.reduce((sum, a) => sum + a.potentialLoss, 0);
    
    return {
      total: alerts.length,
      active: activeAlerts.length,
      critical: criticalAlerts.length,
      immediate: immediateAlerts.length,
      potentialLoss: totalPotentialLoss
    };
  };

  const stats = getAlertStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل نظام التنبيهات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            نظام التنبيهات الذكي
          </h1>
          <p className="text-muted-foreground">تنبيهات فورية ومخصصة لمشاكل التربة الحرجة عبر SMS والإشعارات</p>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التنبيهات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">جميع التنبيهات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات نشطة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">تحتاج إجراء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات حرجة</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">خطر عالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجراء فوري</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.immediate}</div>
            <p className="text-xs text-muted-foreground">الآن</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">خسائر محتملة</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.potentialLoss.toLocaleString()} د.ت</div>
            <p className="text-xs text-muted-foreground">إذا لم تُحل</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {stats.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>تحذير عاجل:</strong> يوجد {stats.critical} تنبيه حرج يتطلب تدخل فوري! 
            الخسائر المحتملة: {stats.potentialLoss.toLocaleString()} دينار تونسي.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Notification Status */}
      {testNotification && (
        <Alert className="border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {testNotification}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">التنبيهات النشطة</TabsTrigger>
          <TabsTrigger value="settings">إعدادات الإشعارات</TabsTrigger>
          <TabsTrigger value="history">سجل التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">جميع مستويات الخطورة</option>
                  <option value="critical">حرج</option>
                  <option value="high">عالي</option>
                  <option value="medium">متوسط</option>
                  <option value="low">منخفض</option>
                </select>
                <select
                  value={filterResolved}
                  onChange={(e) => setFilterResolved(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="active">التنبيهات النشطة</option>
                  <option value="resolved">التنبيهات المحلولة</option>
                  <option value="all">جميع التنبيهات</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const colors = severityColors[alert.severity];
              
              return (
                <Card key={alert.id} className={`${colors.border} border-2 ${alert.resolved ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`${urgencyColors[alert.urgency]} text-white border-0`}
                          >
                            {urgencyTranslation[alert.urgency]}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${colors.text} ${colors.bg} border-0`}
                          >
                            {alert.severity === 'critical' ? 'حرج' :
                             alert.severity === 'high' ? 'عالي' :
                             alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              محلول
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span><strong>الحقل:</strong> {alert.fieldName}</span>
                            <span><strong>النوع:</strong> {problemTypeTranslation[alert.problemType]}</span>
                            <span><strong>المساحة:</strong> {alert.affectedArea} هكتار</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span><strong>التكلفة:</strong> {alert.estimatedCost} د.ت</span>
                            <span><strong>الخسائر المحتملة:</strong> {alert.potentialLoss.toLocaleString()} د.ت</span>
                            <span><strong>التاريخ:</strong> {format(new Date(alert.dateCreated), 'PPp', { locale: ar })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            تم الحل
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                        >
                          تفاصيل
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {selectedAlert?.id === alert.id && (
                    <CardContent>
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <h4 className="font-medium mb-2">الإجراء المطلوب:</h4>
                          <p className="text-sm bg-blue-50 p-3 rounded-lg">{alert.actionRequired}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">حالة الإشعارات المرسلة:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm">SMS:</span>
                              {alert.notificationsSent.sms ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <span className="text-xs text-muted-foreground">لم يُرسل</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">Email:</span>
                              {alert.notificationsSent.email ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <span className="text-xs text-muted-foreground">لم يُرسل</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              <span className="text-sm">تطبيق:</span>
                              {alert.notificationsSent.push ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <span className="text-xs text-muted-foreground">لم يُرسل</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm">واتساب:</span>
                              {alert.notificationsSent.whatsapp ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <span className="text-xs text-muted-foreground">لم يُرسل</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">ممتاز! لا توجد تنبيهات</h3>
                  <p className="text-muted-foreground">
                    جميع مشاكل التربة تحت السيطرة
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <>
              {/* SMS Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    إعدادات الرسائل النصية (SMS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">تفعيل الرسائل النصية</h4>
                      <p className="text-sm text-muted-foreground">إرسال تنبيهات عبر SMS</p>
                    </div>
                    <Switch
                      checked={settings.sms.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({
                          sms: { ...settings.sms, enabled: checked }
                        })
                      }
                    />
                  </div>
                  
                  {settings.sms.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">أرقام الهواتف</label>
                        <div className="space-y-2">
                          {settings.sms.phoneNumbers.map((phone, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input value={phone} readOnly className="flex-1" />
                              <Button variant="outline" size="sm">حذف</Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm">
                            <span className="ml-1">+</span>
                            إضافة رقم
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">مستويات الخطورة للإرسال</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['low', 'medium', 'high', 'critical'].map((severity) => (
                            <label key={severity} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={settings.sms.severity.includes(severity as any)}
                                onChange={(e) => {
                                  const newSeverity = e.target.checked
                                    ? [...settings.sms.severity, severity as any]
                                    : settings.sms.severity.filter(s => s !== severity);
                                  updateNotificationSettings({
                                    sms: { ...settings.sms, severity: newSeverity }
                                  });
                                }}
                              />
                              <span className="text-sm">
                                {severity === 'critical' ? 'حرج' :
                                 severity === 'high' ? 'عالي' :
                                 severity === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => sendTestNotification('sms')}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 ml-2" />
                        اختبار الرسائل النصية
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    إعدادات البريد الإلكتروني
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">تفعيل البريد الإلكتروني</h4>
                      <p className="text-sm text-muted-foreground">إرسال تنبيهات عبر الإيميل</p>
                    </div>
                    <Switch
                      checked={settings.email.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({
                          email: { ...settings.email, enabled: checked }
                        })
                      }
                    />
                  </div>
                  
                  {settings.email.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">عناوين البريد الإلكتروني</label>
                        <div className="space-y-2">
                          {settings.email.addresses.map((email, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input value={email} readOnly className="flex-1" />
                              <Button variant="outline" size="sm">حذف</Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm">
                            <span className="ml-1">+</span>
                            إضافة إيميل
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => sendTestNotification('email')}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 ml-2" />
                        اختبار البريد الإلكتروني
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    إشعارات التطبيق
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">تفعيل إشعارات التطبيق</h4>
                      <p className="text-sm text-muted-foreground">إشعارات فورية في التطبيق</p>
                    </div>
                    <Switch
                      checked={settings.push.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({
                          push: { ...settings.push, enabled: checked }
                        })
                      }
                    />
                  </div>
                  
                  {settings.push.enabled && (
                    <Button 
                      variant="outline" 
                      onClick={() => sendTestNotification('push')}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 ml-2" />
                      اختبار الإشعارات
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    إعدادات التوقيت
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">الساعات الهادئة</h4>
                      <p className="text-sm text-muted-foreground">منع الإشعارات في أوقات محددة</p>
                    </div>
                    <Switch
                      checked={settings.schedule.quietHours.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({
                          schedule: { 
                            ...settings.schedule, 
                            quietHours: { ...settings.schedule.quietHours, enabled: checked }
                          }
                        })
                      }
                    />
                  </div>
                  
                  {settings.schedule.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">من الساعة</label>
                        <Input
                          type="time"
                          value={settings.schedule.quietHours.startTime}
                          onChange={(e) => 
                            updateNotificationSettings({
                              schedule: {
                                ...settings.schedule,
                                quietHours: { ...settings.schedule.quietHours, startTime: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">إلى الساعة</label>
                        <Input
                          type="time"
                          value={settings.schedule.quietHours.endTime}
                          onChange={(e) => 
                            updateNotificationSettings({
                              schedule: {
                                ...settings.schedule,
                                quietHours: { ...settings.schedule.quietHours, endTime: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل جميع التنبيهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${alert.resolved ? 'bg-green-500' : severityColors[alert.severity].bg.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.fieldName} - {format(new Date(alert.dateCreated), 'PPp', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? 'outline' : 'destructive'}>
                      {alert.resolved ? 'محلول' : 'نشط'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
