import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Droplets, 
  Sprout,
  Bell,
  CheckCircle,
  AlertCircle,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Plus,
  Edit,
  Trash2,
  Download,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleActivity {
  id: string;
  type: 'fertilizer' | 'pesticide' | 'monitoring';
  title: string;
  product: string;
  dosage: string;
  method: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  weatherSuitability: 'good' | 'poor' | 'warning';
  notes?: string;
  reminders: boolean;
}

interface WeatherCondition {
  date: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  suitability: 'excellent' | 'good' | 'poor';
}

const mockSchedule: ScheduleActivity[] = [
  {
    id: '1',
    type: 'fertilizer',
    title: 'التسميد الأساسي',
    product: 'سماد NPK متوازن',
    dosage: '250 كg/هكتار',
    method: 'نثر في التربة',
    date: '2024-01-15',
    time: '07:00',
    status: 'pending',
    weatherSuitability: 'good',
    reminders: true
  },
  {
    id: '2',
    type: 'pesticide',
    title: 'الرش الوقائي الأول',
    product: 'كبريتات النحاس',
    dosage: '2.5 لتر/هكتار',
    method: 'رش ورقي',
    date: '2024-01-17',
    time: '06:30',
    status: 'pending',
    weatherSuitability: 'warning',
    reminders: true
  },
  {
    id: '3',
    type: 'monitoring',
    title: 'فحص نمو النبات',
    product: 'فحص بصري',
    dosage: '-',
    method: 'مراقبة ميدانية',
    date: '2024-01-20',
    time: '08:00',
    status: 'pending',
    weatherSuitability: 'good',
    reminders: true
  },
  {
    id: '4',
    type: 'fertilizer',
    title: 'التسميد الورقي',
    product: 'اليوريا المذابة',
    dosage: '150 كg/هكتار',
    method: 'رش ورقي',
    date: '2024-01-22',
    time: '07:30',
    status: 'pending',
    weatherSuitability: 'good',
    reminders: true
  }
];

const mockWeather: WeatherCondition[] = [
  {
    date: '2024-01-15',
    temperature: 18,
    humidity: 65,
    windSpeed: 8,
    precipitation: 0,
    condition: 'مشمس',
    suitability: 'excellent'
  },
  {
    date: '2024-01-17',
    temperature: 22,
    humidity: 75,
    windSpeed: 15,
    precipitation: 0,
    condition: 'غيوم متفرقة',
    suitability: 'good'
  },
  {
    date: '2024-01-20',
    temperature: 16,
    humidity: 85,
    windSpeed: 20,
    precipitation: 5,
    condition: 'أمطار خفيفة متوقعة',
    suitability: 'poor'
  }
];

export default function TreatmentSchedule() {
  const [schedule, setSchedule] = useState<ScheduleActivity[]>(mockSchedule);
  const [weather, setWeather] = useState<WeatherCondition[]>(mockWeather);
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<'all' | 'fertilizer' | 'pesticide' | 'monitoring'>('all');
  const [showWeather, setShowWeather] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'fertilizer' as 'fertilizer' | 'pesticide' | 'monitoring',
    title: '',
    product: '',
    dosage: '',
    method: '',
    date: '',
    time: '07:00',
    reminders: true
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'fertilizer': return <Sprout className="h-4 w-4" />;
      case 'pesticide': return <Droplets className="h-4 w-4" />;
      case 'monitoring': return <CheckCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'في الانتظار';
      case 'overdue': return 'متأخر';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  const getWeatherSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'good': return 'text-green-600';
      case 'poor': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'poor': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredSchedule = schedule.filter(activity => 
    filterType === 'all' || activity.type === filterType
  );

  const updateActivityStatus = (activityId: string, newStatus: string) => {
    setSchedule(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, status: newStatus as any }
        : activity
    ));
  };

  const addNewActivity = () => {
    const activity: ScheduleActivity = {
      id: Date.now().toString(),
      ...newActivity,
      status: 'pending',
      weatherSuitability: 'good'
    };
    
    setSchedule(prev => [...prev, activity]);
    setShowAddDialog(false);
    setNewActivity({
      type: 'fertilizer',
      title: '',
      product: '',
      dosage: '',
      method: '',
      date: '',
      time: '07:00',
      reminders: true
    });
  };

  const getActivitiesForDate = (date: string) => {
    return filteredSchedule.filter(activity => activity.date === date);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('ar-TN', { weekday: 'short' }),
        dayNumber: date.getDate(),
        activities: getActivitiesForDate(dateStr),
        weather: weather.find(w => w.date === dateStr)
      });
    }
    
    return days;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">جدول الرش والتسميد</h1>
          <p className="text-muted-foreground">
            إدارة وتنظيم أنشطة التسميد والرش مع مراعاة الظروف الجوية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowWeather(!showWeather)}>
            <CloudRain className="h-4 w-4 ml-2" />
            {showWeather ? 'إخفاء' : 'إظهار'} الطقس
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة نشاط
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إض��فة نشاط جديد</DialogTitle>
                <DialogDescription>
                  أضف نشاط تسميد أو رش جديد إلى الجدول
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">نوع النشاط</Label>
                  <Select value={newActivity.type} onValueChange={(value: any) => setNewActivity(prev => ({...prev, type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع النشاط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fertilizer">تسميد</SelectItem>
                      <SelectItem value="pesticide">رش مبيدات</SelectItem>
                      <SelectItem value="monitoring">مراقبة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">عنوان النشاط</Label>
                  <Input
                    id="title"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity(prev => ({...prev, title: e.target.value}))}
                    placeholder="مثال: التسميد الورقي الأول"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product">المنتج</Label>
                    <Input
                      id="product"
                      value={newActivity.product}
                      onChange={(e) => setNewActivity(prev => ({...prev, product: e.target.value}))}
                      placeholder="اسم السماد أو المبيد"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dosage">الجرعة</Label>
                    <Input
                      id="dosage"
                      value={newActivity.dosage}
                      onChange={(e) => setNewActivity(prev => ({...prev, dosage: e.target.value}))}
                      placeholder="مثال: 200 كg/هكتار"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="method">طريقة التطبيق</Label>
                  <Input
                    id="method"
                    value={newActivity.method}
                    onChange={(e) => setNewActivity(prev => ({...prev, method: e.target.value}))}
                    placeholder="مثال: رش ورقي، نثر في التربة"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newActivity.date}
                      onChange={(e) => setNewActivity(prev => ({...prev, date: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">الوقت</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity(prev => ({...prev, time: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="reminders"
                    checked={newActivity.reminders}
                    onCheckedChange={(checked) => setNewActivity(prev => ({...prev, reminders: Boolean(checked)}))}
                  />
                  <Label htmlFor="reminders">تفعيل التذكيرات</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={addNewActivity}>
                  إضافة النشاط
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Weather Summary */}
      {showWeather && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CloudRain className="h-5 w-5 ml-2" />
              الأحوال الجوية للأيام القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weather.slice(0, 3).map((day, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {new Date(day.date).toLocaleDateString('ar-TN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    {getSuitabilityIcon(day.suitability)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 ml-1" />
                      {day.temperature}°م
                    </div>
                    <div className="flex items-center">
                      <Wind className="h-3 w-3 ml-1" />
                      {day.windSpeed} كم/س
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.condition}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="فلترة حسب النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنشطة</SelectItem>
              <SelectItem value="fertilizer">��لتسميد فقط</SelectItem>
              <SelectItem value="pesticide">الرش فقط</SelectItem>
              <SelectItem value="monitoring">المراقبة فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
          <TabsList>
            <TabsTrigger value="calendar">التقويم</TabsTrigger>
            <TabsTrigger value="list">القائمة</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={selectedView} className="w-full">
        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {generateCalendarDays().map((day, index) => (
              <Card key={index} className={cn(
                "min-h-[200px]",
                day.date === new Date().toISOString().split('T')[0] && "ring-2 ring-primary"
              )}>
                <CardHeader className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{day.dayName}</div>
                      <div className="text-sm text-muted-foreground">{day.dayNumber}</div>
                    </div>
                    {day.weather && (
                      <div className="text-right">
                        {getSuitabilityIcon(day.weather.suitability)}
                        <div className="text-xs">
                          {day.weather.temperature}°
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {day.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "p-2 rounded text-xs border-l-4",
                          activity.type === 'fertilizer' && "border-l-green-500 bg-green-50",
                          activity.type === 'pesticide' && "border-l-blue-500 bg-blue-50",
                          activity.type === 'monitoring' && "border-l-yellow-500 bg-yellow-50"
                        )}
                      >
                        <div className="flex items-center">
                          {getActivityIcon(activity.type)}
                          <span className="mr-1 font-medium">{activity.time}</span>
                        </div>
                        <div className="mt-1">{activity.title}</div>
                        <Badge 
                          className={cn("mt-1", getStatusColor(activity.status))}
                          size="sm"
                        >
                          {getStatusText(activity.status)}
                        </Badge>
                      </div>
                    ))}
                    {day.activities.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        لا توجد أنشطة
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-4">
            {filteredSchedule.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 rtl:space-x-reverse flex-1">
                      <div className={cn(
                        "p-3 rounded-full",
                        activity.type === 'fertilizer' && "bg-green-100",
                        activity.type === 'pesticide' && "bg-blue-100",
                        activity.type === 'monitoring' && "bg-yellow-100"
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                          <h3 className="font-semibold text-lg">{activity.title}</h3>
                          <Badge className={getStatusColor(activity.status)}>
                            {getStatusText(activity.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">المنتج</Label>
                            <div className="font-medium">{activity.product}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">الجرعة</Label>
                            <div className="font-medium">{activity.dosage}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">التاريخ والوقت</Label>
                            <div className="font-medium">
                              {new Date(activity.date).toLocaleDateString('ar-TN')} - {activity.time}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">الطقس</Label>
                            <div className={cn(
                              "font-medium flex items-center",
                              getWeatherSuitabilityColor(activity.weatherSuitability)
                            )}>
                              {activity.weatherSuitability === 'good' && <CheckCircle className="h-3 w-3 ml-1" />}
                              {activity.weatherSuitability === 'warning' && <AlertCircle className="h-3 w-3 ml-1" />}
                              {activity.weatherSuitability === 'poor' && <AlertCircle className="h-3 w-3 ml-1" />}
                              {activity.weatherSuitability === 'good' ? 'مناسب' : 
                               activity.weatherSuitability === 'warning' ? 'تحذير' : 'غير مناسب'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">طريقة التطبيق:</span> {activity.method}
                        </div>
                        
                        {activity.notes && (
                          <div className="mt-2 p-2 bg-secondary/50 rounded text-sm">
                            <span className="font-medium">ملاحظات:</span> {activity.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {activity.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateActivityStatus(activity.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateActivityStatus(activity.id, 'cancelled')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {activity.reminders && (
                        <Badge variant="outline" className="text-xs">
                          <Bell className="h-3 w-3 ml-1" />
                          تذكير
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedule.length}</div>
                <div className="text-xs text-muted-foreground">إجمالي الأنشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {schedule.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">في الانتظار</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {schedule.filter(a => a.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">مكتمل</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {schedule.filter(a => a.status === 'overdue').length}
                </div>
                <div className="text-xs text-muted-foreground">متأخر</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
