import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CloudRain, 
  Thermometer,
  Wind,
  Sun,
  Snowflake,
  Zap,
  AlertTriangle,
  Bell,
  Settings,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherAlert {
  id: string;
  type: 'temperature' | 'frost' | 'wind' | 'precipitation' | 'drought' | 'storm';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  date: string;
  recommendations: string[];
  isActive: boolean;
  station?: string;
}

interface AlertSettings {
  temperatureThresholds: {
    high: number;
    low: number;
  };
  windSpeedThreshold: number;
  precipitationThreshold: number;
  enabledAlertTypes: string[];
  notificationMethods: string[];
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  selectedStations: string[];
}

const alertTypes = [
  { id: 'temperature', name: 'تنبيهات الحرارة', icon: Thermometer, color: 'text-red-600' },
  { id: 'frost', name: 'تنبيهات الصقيع', icon: Snowflake, color: 'text-blue-600' },
  { id: 'wind', name: 'تنبيهات الرياح', icon: Wind, color: 'text-gray-600' },
  { id: 'precipitation', name: 'تنبيهات الأمطار', icon: CloudRain, color: 'text-blue-500' },
  { id: 'drought', name: 'تنبيهات الجف��ف', icon: Sun, color: 'text-yellow-600' },
  { id: 'storm', name: 'تنبيهات العواصف', icon: Zap, color: 'text-purple-600' }
];

const tunisianStations = [
  { id: 'tunis-center', name: 'تونس العاصمة' },
  { id: 'sfax-center', name: 'صفاقس' },
  { id: 'sousse-center', name: 'سوسة' },
  { id: 'kairouan', name: 'القيروان' },
  { id: 'gabes', name: 'قابس' },
  { id: 'bizerte', name: 'بنزرت' },
  { id: 'gafsa', name: 'قفصة' },
  { id: 'tozeur', name: 'توزر' }
];

export default function WeatherAlerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [selectedStation, setSelectedStation] = useState('tunis-center');
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    temperatureThresholds: { high: 40, low: 2 },
    windSpeedThreshold: 25,
    precipitationThreshold: 20,
    enabledAlertTypes: ['temperature', 'frost', 'wind', 'precipitation'],
    notificationMethods: ['in_app', 'push'],
    quietHours: { enabled: false, start: '22:00', end: '06:00' },
    selectedStations: ['tunis-center']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/weather-irrigation/alerts/${selectedStation}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Set up periodic refresh
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [selectedStation]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'حرج';
      case 'warning': return 'تحذير';
      case 'info': return 'معلومات';
      default: return 'غير محدد';
    }
  };

  const getAlertIcon = (type: string) => {
    const alertType = alertTypes.find(t => t.id === type);
    if (!alertType) return <AlertTriangle className="h-5 w-5" />;
    
    const IconComponent = alertType.icon;
    return <IconComponent className={cn("h-5 w-5", alertType.color)} />;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const typeMatch = filterType === 'all' || alert.type === filterType;
    return severityMatch && typeMatch;
  });

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  const updateAlertSettings = (key: string, value: any) => {
    setAlertSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleAlertType = (alertType: string) => {
    setAlertSettings(prev => ({
      ...prev,
      enabledAlertTypes: prev.enabledAlertTypes.includes(alertType)
        ? prev.enabledAlertTypes.filter(type => type !== alertType)
        : [...prev.enabledAlertTypes, alertType]
    }));
  };

  const toggleNotificationMethod = (method: string) => {
    setAlertSettings(prev => ({
      ...prev,
      notificationMethods: prev.notificationMethods.includes(method)
        ? prev.notificationMethods.filter(m => m !== method)
        : [...prev.notificationMethods, method]
    }));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isActive: false } : alert
    ));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تنبيهات الطقس</h1>
          <p className="text-muted-foreground">
            مراقبة مباشرة للظروف الجوية وتنبيهات فورية للأنشطة الزراعية
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر المحطة" />
            </SelectTrigger>
            <SelectContent>
              {tunisianStations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 ml-2" />
                إعدادات التنبيهات
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>إعدادات التنبيهات الجوية</DialogTitle>
                <DialogDescription>
                  تخصيص أنواع التنبيهات وطرق الإشعارات
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Temperature Thresholds */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">حدود درجة الحرارة</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">الحد الأقصى (°م)</Label>
                      <Input
                        type="number"
                        value={alertSettings.temperatureThresholds.high}
                        onChange={(e) => updateAlertSettings('temperatureThresholds', {
                          ...alertSettings.temperatureThresholds,
                          high: parseInt(e.target.value) || 40
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">الحد الأدنى (°م)</Label>
                      <Input
                        type="number"
                        value={alertSettings.temperatureThresholds.low}
                        onChange={(e) => updateAlertSettings('temperatureThresholds', {
                          ...alertSettings.temperatureThresholds,
                          low: parseInt(e.target.value) || 2
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Other Thresholds */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">سرعة الرياح (كم/س)</Label>
                    <Input
                      type="number"
                      value={alertSettings.windSpeedThreshold}
                      onChange={(e) => updateAlertSettings('windSpeedThreshold', parseInt(e.target.value) || 25)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">كمية الأمطار (مم)</Label>
                    <Input
                      type="number"
                      value={alertSettings.precipitationThreshold}
                      onChange={(e) => updateAlertSettings('precipitationThreshold', parseInt(e.target.value) || 20)}
                    />
                  </div>
                </div>

                {/* Alert Types */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">أنواع التنبيهات</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {alertTypes.map((alertType) => (
                      <div key={alertType.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch
                          checked={alertSettings.enabledAlertTypes.includes(alertType.id)}
                          onCheckedChange={() => toggleAlertType(alertType.id)}
                        />
                        <alertType.icon className={cn("h-4 w-4", alertType.color)} />
                        <Label className="text-sm">{alertType.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Methods */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">طرق الإشعار</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        checked={alertSettings.notificationMethods.includes('in_app')}
                        onCheckedChange={() => toggleNotificationMethod('in_app')}
                      />
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">إشعارات التطبيق</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        checked={alertSettings.notificationMethods.includes('push')}
                        onCheckedChange={() => toggleNotificationMethod('push')}
                      />
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">إشعارات الهاتف</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        checked={alertSettings.notificationMethods.includes('email')}
                        onCheckedChange={() => toggleNotificationMethod('email')}
                      />
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">البريد الإلكتروني</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        checked={alertSettings.notificationMethods.includes('sound')}
                        onCheckedChange={() => toggleNotificationMethod('sound')}
                      />
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">التنبيهات الصوتية</Label>
                    </div>
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">ساعات الهدوء</Label>
                    <Switch
                      checked={alertSettings.quietHours.enabled}
                      onCheckedChange={(checked) => updateAlertSettings('quietHours', {
                        ...alertSettings.quietHours,
                        enabled: checked
                      })}
                    />
                  </div>
                  {alertSettings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">من الساعة</Label>
                        <Input
                          type="time"
                          value={alertSettings.quietHours.start}
                          onChange={(e) => updateAlertSettings('quietHours', {
                            ...alertSettings.quietHours,
                            start: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">إلى الساعة</Label>
                        <Input
                          type="time"
                          value={alertSettings.quietHours.end}
                          onChange={(e) => updateAlertSettings('quietHours', {
                            ...alertSettings.quietHours,
                            end: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={() => setShowSettingsDialog(false)}>
                  حفظ الإعدادات
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{criticalAlerts.length}</div>
                <div className="text-xs text-muted-foreground">تنبيهات حرجة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Bell className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeAlerts.length}</div>
                <div className="text-xs text-muted-foreground">تنبيهات نشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <div className="text-xs text-muted-foreground">إجمالي التنبيهات</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-full">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{alertSettings.selectedStations.length}</div>
                <div className="text-xs text-muted-foreground">محطات متابعة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">التنبيهات النشطة</TabsTrigger>
          <TabsTrigger value="all">جميع التنبيهات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات السريعة</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  "hover:shadow-md transition-shadow",
                  alert.severity === 'critical' && "ring-2 ring-red-500 ring-opacity-50"
                )}>
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
                          
                          <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <Clock className="h-4 w-4" />
                              <span>{getTimeAgo(alert.date)}</span>
                            </div>
                            {alert.station && (
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                <MapPin className="h-4 w-4" />
                                <span>{alert.station}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">التوصيات:</Label>
                            <ul className="space-y-1">
                              {alert.recommendations.map((recommendation, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                                  <span className="text-sm">{recommendation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد تنبيهات نشطة</h3>
                  <p className="text-muted-foreground">
                    الظروف الجوية مناسبة للأنشطة الزراعية
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-4 items-center mb-4">
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="شدة التنبيه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="warning">تحذير</SelectItem>
                <SelectItem value="info">معلومات</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع التنبيه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {alertTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
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
                          {getTimeAgo(alert.date)} • {alert.station || tunisianStations.find(s => s.id === selectedStation)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                      {alert.isActive ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
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
              <CardTitle>الإعدادات السريعة</CardTitle>
              <CardDescription>
                تخصيص سريع لأهم إعدادات التنبيهات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">أنواع التنبيهات المفعلة</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {alertTypes.map((alertType) => (
                    <div key={alertType.id} className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                      <Switch
                        checked={alertSettings.enabledAlertTypes.includes(alertType.id)}
                        onCheckedChange={() => toggleAlertType(alertType.id)}
                      />
                      <alertType.icon className={cn("h-4 w-4", alertType.color)} />
                      <Label className="text-sm">{alertType.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">طرق الإشعار</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'in_app', name: 'إشعارات التطبيق', icon: Bell },
                    { id: 'push', name: 'إشعارات الهاتف', icon: Smartphone },
                    { id: 'email', name: 'البريد الإلكتروني', icon: Mail },
                    { id: 'sound', name: 'التنبيهات الصوتية', icon: Volume2 }
                  ].map((method) => (
                    <div key={method.id} className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                      <Switch
                        checked={alertSettings.notificationMethods.includes(method.id)}
                        onCheckedChange={() => toggleNotificationMethod(method.id)}
                      />
                      <method.icon className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">{method.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => setShowSettingsDialog(true)} className="w-full">
                <Settings className="h-4 w-4 ml-2" />
                إعدادات متقدمة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
