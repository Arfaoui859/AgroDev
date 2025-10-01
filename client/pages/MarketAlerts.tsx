import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  Settings, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Mail,
  Smartphone,
  Save,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketAlert {
  id: string;
  type: 'price_spike' | 'seasonal_opportunity' | 'weather_impact' | 'market_trend';
  severity: 'low' | 'medium' | 'high';
  crop: {
    id: string;
    name: string;
  };
  title: string;
  message: string;
  currentPrice: number;
  targetPrice: number;
  change: string;
  recommendation: string;
  timestamp: string;
  isActive: boolean;
}

interface AlertPreferences {
  cropIds: string[];
  priceThresholds: { [cropId: string]: { min: number; max: number } };
  alertTypes: string[];
  notificationMethods: string[];
  isActive: boolean;
}

const cropOptions = [
  { id: 'olive', name: 'الزيتون' },
  { id: 'tomato', name: 'الطماطم' },
  { id: 'wheat', name: 'القمح' },
  { id: 'citrus', name: 'الحمضيات' },
  { id: 'potato', name: 'البطاطا' },
  { id: 'dates', name: 'التمر' },
  { id: 'barley', name: 'الشعير' },
  { id: 'artichoke', name: 'الخرشوف' },
  { id: 'almond', name: 'اللوز' },
];

const alertTypeOptions = [
  { id: 'price_spike', name: 'ار��فاع الأسعار', description: 'تنبيهات عند ارتفاع الأسعار بشكل مفاجئ' },
  { id: 'price_drop', name: 'انخفاض الأسعار', description: 'تنبيهات عند انخفاض الأسعار بشكل كبير' },
  { id: 'seasonal_opportunity', name: 'الفرص الموسمية', description: 'تنبيهات حول الفرص الاستثمارية الموسمية' },
  { id: 'weather_impact', name: 'تأثير الطقس', description: 'تنبيهات حول تأثير الطقس على الأسعار' },
  { id: 'market_trend', name: 'اتجاهات السوق', description: 'تنبيهات حول التغيرات في اتجاهات السوق' },
];

export default function MarketAlerts() {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    cropIds: [],
    priceThresholds: {},
    alertTypes: ['price_spike', 'seasonal_opportunity'],
    notificationMethods: ['in_app'],
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<AlertPreferences>(preferences);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/market-analysis/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      const response = await fetch('/api/market-analysis/alerts/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempPreferences),
      });
      
      if (response.ok) {
        setPreferences(tempPreferences);
        setShowPreferencesDialog(false);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price_spike': return <TrendingUp className="h-4 w-4" />;
      case 'seasonal_opportunity': return <Calendar className="h-4 w-4" />;
      case 'weather_impact': return <AlertTriangle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} د.ت`;
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-TN');
  };

  const updateCropThreshold = (cropId: string, type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempPreferences(prev => ({
      ...prev,
      priceThresholds: {
        ...prev.priceThresholds,
        [cropId]: {
          ...prev.priceThresholds[cropId],
          [type]: numValue
        }
      }
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تنبيهات السوق</h1>
          <p className="text-muted-foreground">
            إدارة التنبيهات والإشعارات للمحاصيل والأسعار
          </p>
        </div>
        <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 ml-2" />
              إعدادات التنبيهات
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إعدادات التنبيهات</DialogTitle>
              <DialogDescription>
                تخصيص أنواع التنبيهات وطرق الإشعارات حسب تفضيلاتك
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Alert Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">تفعيل التنبيهات</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل أو إلغاء جميع التنبيهات
                  </p>
                </div>
                <Switch
                  checked={tempPreferences.isActive}
                  onCheckedChange={(checked) => 
                    setTempPreferences(prev => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              {/* Crop Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">المحاصيل المتابعة</Label>
                <div className="grid grid-cols-2 gap-2">
                  {cropOptions.map((crop) => (
                    <div key={crop.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id={crop.id}
                        checked={tempPreferences.cropIds.includes(crop.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTempPreferences(prev => ({
                              ...prev,
                              cropIds: [...prev.cropIds, crop.id]
                            }));
                          } else {
                            setTempPreferences(prev => ({
                              ...prev,
                              cropIds: prev.cropIds.filter(id => id !== crop.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={crop.id} className="text-sm">
                        {crop.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Thresholds */}
              <div className="space-y-3">
                <Label className="text-base font-medium">حدود الأسعار</Label>
                <div className="space-y-4">
                  {tempPreferences.cropIds.map((cropId) => {
                    const crop = cropOptions.find(c => c.id === cropId);
                    if (!crop) return null;
                    
                    return (
                      <div key={cropId} className="border rounded-lg p-3">
                        <Label className="text-sm font-medium">{crop.name}</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">حد أدنى (د.ت)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={tempPreferences.priceThresholds[cropId]?.min || ''}
                              onChange={(e) => updateCropThreshold(cropId, 'min', e.target.value)}
                              placeholder="0.0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">حد أقصى (د.ت)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={tempPreferences.priceThresholds[cropId]?.max || ''}
                              onChange={(e) => updateCropThreshold(cropId, 'max', e.target.value)}
                              placeholder="0.0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alert Types */}
              <div className="space-y-3">
                <Label className="text-base font-medium">أنواع التنبيهات</Label>
                <div className="space-y-3">
                  {alertTypeOptions.map((alertType) => (
                    <div key={alertType.id} className="flex items-start space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id={alertType.id}
                        checked={tempPreferences.alertTypes.includes(alertType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTempPreferences(prev => ({
                              ...prev,
                              alertTypes: [...prev.alertTypes, alertType.id]
                            }));
                          } else {
                            setTempPreferences(prev => ({
                              ...prev,
                              alertTypes: prev.alertTypes.filter(type => type !== alertType.id)
                            }));
                          }
                        }}
                      />
                      <div>
                        <Label htmlFor={alertType.id} className="text-sm font-medium">
                          {alertType.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {alertType.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Methods */}
              <div className="space-y-3">
                <Label className="text-base font-medium">طرق الإشعار</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="in_app"
                      checked={tempPreferences.notificationMethods.includes('in_app')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: [...prev.notificationMethods, 'in_app']
                          }));
                        } else {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: prev.notificationMethods.filter(method => method !== 'in_app')
                          }));
                        }
                      }}
                    />
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="in_app" className="text-sm">إشعا��ات التطبيق</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="email"
                      checked={tempPreferences.notificationMethods.includes('email')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: [...prev.notificationMethods, 'email']
                          }));
                        } else {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: prev.notificationMethods.filter(method => method !== 'email')
                          }));
                        }
                      }}
                    />
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email" className="text-sm">البريد الإلكتروني</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="sms"
                      checked={tempPreferences.notificationMethods.includes('sms')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: [...prev.notificationMethods, 'sms']
                          }));
                        } else {
                          setTempPreferences(prev => ({
                            ...prev,
                            notificationMethods: prev.notificationMethods.filter(method => method !== 'sms')
                          }));
                        }
                      }}
                    />
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="sms" className="text-sm">الرسائل النصية</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreferencesDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={savePreferences}>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">التنبيهات النشطة</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">التنبيهات النشطة</h2>
            <Badge variant="outline">
              {alerts.filter(alert => alert.isActive).length} تنبيه نشط
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Bell className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">جاري تحميل التنبيهات...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.filter(alert => alert.isActive).map((alert) => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1">
                        <div className={cn(
                          "p-2 rounded-full",
                          getSeverityColor(alert.severity)
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {getSeverityText(alert.severity)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{alert.message}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">المحصول</Label>
                              <div className="font-medium">{alert.crop.name}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">السعر الحالي</Label>
                              <div className="font-medium">{formatPrice(alert.currentPrice)}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">التغيير</Label>
                              <div className={cn(
                                "font-medium",
                                alert.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                              )}>
                                {alert.change}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">الوقت</Label>
                              <div className="font-medium">{formatTime(alert.timestamp)}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                            <Label className="text-xs text-muted-foreground">التوصية</Label>
                            <p className="text-sm font-medium">{alert.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {alerts.filter(alert => alert.isActive).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد تنبيهات نشطة</h3>
                    <p className="text-muted-foreground">
                      جميع الأسعار ضمن النطاقات المتوقعة
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">سجل التنبيهات</h2>
            <Badge variant="secondary">
              {alerts.length} إجمالي التنبيهات
            </Badge>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={cn(
                "transition-all",
                !alert.isActive && "opacity-60"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={cn(
                        "p-2 rounded-full",
                        getSeverityColor(alert.severity)
                      )}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alert.crop.name} • {formatTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                      {alert.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التنبيهات</CardTitle>
              <CardDescription>
                تخصيص تفضيلات التنبيهات والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">تفعيل التنبيهات</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل أو إلغاء جميع التنبيهات
                  </p>
                </div>
                <Switch checked={preferences.isActive} />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">المحاصيل المتابعة</Label>
                <div className="flex flex-wrap gap-2">
                  {preferences.cropIds.map((cropId) => {
                    const crop = cropOptions.find(c => c.id === cropId);
                    return crop ? (
                      <Badge key={cropId} variant="secondary">
                        {crop.name}
                      </Badge>
                    ) : null;
                  })}
                  {preferences.cropIds.length === 0 && (
                    <p className="text-sm text-muted-foreground">لم يتم اختيار محاصيل</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">طرق الإشعار</Label>
                <div className="flex flex-wrap gap-2">
                  {preferences.notificationMethods.map((method) => (
                    <Badge key={method} variant="outline">
                      {method === 'in_app' && <><Bell className="h-3 w-3 ml-1" />إشعارات التطبيق</>}
                      {method === 'email' && <><Mail className="h-3 w-3 ml-1" />البريد الإلكتروني</>}
                      {method === 'sms' && <><Smartphone className="h-3 w-3 ml-1" />الرسائل النصية</>}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={() => setShowPreferencesDialog(true)}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
