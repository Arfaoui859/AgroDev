import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { 
  CloudRain, 
  Thermometer,
  Wind,
  Sun,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Droplets,
  Sprout,
  Zap,
  Eye,
  Settings,
  Bell,
  MapPin,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  Activity,
  Layers,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherCondition {
  date: string;
  temperature: {
    max: number;
    min: number;
    avg: number;
  };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: string;
  solarRadiation: number;
  uvIndex: number;
  atmosphericPressure: number;
}

interface OptimizedTask {
  taskId: string;
  taskType: 'irrigation' | 'fertilization' | 'spraying' | 'planting' | 'harvesting';
  cropType: string;
  scheduledDate: string;
  weatherSuitability: number;
  weatherConditions: WeatherCondition;
  recommendations: string[];
  status: 'optimal' | 'suitable' | 'postpone' | 'critical';
  postponeReason?: string;
  alternativeDate?: string;
  urgencyLevel: number;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  isActive: boolean;
  recommendations: string[];
}

const taskTypes = [
  { id: 'irrigation', name: 'الري', icon: Droplets, color: 'text-blue-600' },
  { id: 'fertilization', name: 'التسميد', icon: Sprout, color: 'text-green-600' },
  { id: 'spraying', name: 'الرش', icon: Zap, color: 'text-purple-600' },
  { id: 'planting', name: 'الزراعة', icon: Target, color: 'text-orange-600' },
  { id: 'harvesting', name: 'الحصاد', icon: Activity, color: 'text-yellow-600' }
];

const cropOptions = [
  { id: 'olive', name: 'الزيتون' },
  { id: 'tomato', name: 'الطماطم' },
  { id: 'wheat', name: 'القمح' },
  { id: 'citrus', name: 'الحمضيات' },
  { id: 'potato', name: 'البطاطا' }
];

const tunisianLocations = [
  { id: 'tunis', name: 'تونس العاصمة' },
  { id: 'sfax', name: 'صفاقس' },
  { id: 'sousse', name: 'سوسة' },
  { id: 'kairouan', name: 'القيروان' },
  { id: 'gabes', name: 'قابس' }
];

export default function WeatherCropPlanner() {
  const [farmConfig, setFarmConfig] = useState({
    location: 'tunis',
    cropType: 'olive',
    farmSize: 2.5,
    priorityLevel: 'medium'
  });

  const [plannedTasks, setPlannedTasks] = useState([
    {
      taskId: 'task-1',
      taskType: 'irrigation',
      cropType: 'olive',
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      taskId: 'task-2',
      taskType: 'fertilization',
      cropType: 'olive',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      taskId: 'task-3',
      taskType: 'spraying',
      cropType: 'olive',
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]);

  const [optimizedSchedule, setOptimizedSchedule] = useState<OptimizedTask[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<WeatherCondition[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [recommendations, setRecommendations] = useState({
    immediate: [],
    weekly: [],
    strategic: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoOptimization, setAutoOptimization] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    taskType: 'irrigation',
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  const generateOptimizedSchedule = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather-crop-planner/smart-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...farmConfig,
          plannedTasks,
          weatherPeriod: 14
        }),
      });

      const data = await response.json();
      setOptimizedSchedule(data.optimizedSchedule || []);
      setWeatherForecast(data.weatherForecast || []);
      setRecommendations(data.recommendations || { immediate: [], weekly: [], strategic: [] });

      // Fetch weather alerts
      const alertsResponse = await fetch(`/api/weather-crop-planner/alerts/${farmConfig.location}`);
      const alertsData = await alertsResponse.json();
      setWeatherAlerts(alertsData.activeAlerts || []);

    } catch (error) {
      console.error('Error generating optimized schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateOptimizedSchedule();
  }, [farmConfig, autoOptimization]);

  const getTaskIcon = (taskType: string) => {
    const task = taskTypes.find(t => t.id === taskType);
    if (!task) return <Activity className="h-5 w-5" />;
    
    const IconComponent = task.icon;
    return <IconComponent className={cn("h-5 w-5", task.color)} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-100 text-green-800';
      case 'suitable': return 'bg-blue-100 text-blue-800';
      case 'postpone': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'optimal': return 'مثالي';
      case 'suitable': return 'مناسب';
      case 'postpone': return 'يُفضل التأجيل';
      case 'critical': return 'غير مناسب';
      default: return 'غير محدد';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const addNewTask = () => {
    const task = {
      taskId: `task-${Date.now()}`,
      taskType: newTask.taskType,
      cropType: farmConfig.cropType,
      scheduledDate: newTask.scheduledDate
    };
    setPlannedTasks(prev => [...prev, task]);
    setShowTaskDialog(false);
    setNewTask({
      taskType: 'irrigation',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-TN', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartData = weatherForecast.map(day => ({
    date: formatDate(day.date),
    temp: day.temperature.avg,
    humidity: day.humidity,
    precipitation: day.precipitation,
    wind: day.windSpeed
  }));

  const taskDistribution = taskTypes.map(type => ({
    name: type.name,
    count: optimizedSchedule.filter(task => task.taskType === type.id).length,
    color: type.color
  }));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تخطيط المهام الزراعية بناءً على الطقس</h1>
          <p className="text-muted-foreground">
            نظام ذكي لتحسين جدولة المهام الزراعية حسب الظروف الجوية
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              checked={autoOptimization}
              onCheckedChange={setAutoOptimization}
            />
            <Label>التحسين التلقائي</Label>
          </div>
          <Button onClick={generateOptimizedSchedule} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 ml-2", isLoading && "animate-spin")} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Farm Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 ml-2" />
            إعدادات المزرعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="location">الموقع</Label>
              <Select value={farmConfig.location} onValueChange={(value) => setFarmConfig(prev => ({...prev, location: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {tunisianLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cropType">نوع المحصول</Label>
              <Select value={farmConfig.cropType} onValueChange={(value) => setFarmConfig(prev => ({...prev, cropType: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحصول" />
                </SelectTrigger>
                <SelectContent>
                  {cropOptions.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="farmSize">مساحة المزرعة (هكتار)</Label>
              <Input
                id="farmSize"
                type="number"
                value={farmConfig.farmSize}
                onChange={(e) => setFarmConfig(prev => ({...prev, farmSize: parseFloat(e.target.value) || 1}))}
                min="0.1"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="priority">مستوى الأولوية</Label>
              <Select value={farmConfig.priorityLevel} onValueChange={(value) => setFarmConfig(prev => ({...prev, priorityLevel: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Bell className="h-5 w-5 ml-2" />
              تنبيهات جوية نشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weatherAlerts.map((alert) => (
                <div key={alert.id} className={cn("p-3 rounded-lg border", getSeverityColor(alert.severity))}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <div className="mt-2">
                        <Label className="text-xs font-medium">التوصيات:</Label>
                        <ul className="text-xs mt-1 space-y-1">
                          {alert.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 ml-1 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity === 'critical' ? 'حرج' :
                       alert.severity === 'high' ? 'عالي' :
                       alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">الجدول المحسّن</TabsTrigger>
          <TabsTrigger value="weather">تحليل الطقس</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">الجدول المحسّن للمهام الزراعية</h2>
            <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="h-4 w-4 ml-2" />
                  إضافة مهمة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مهمة زراعية جديدة</DialogTitle>
                  <DialogDescription>
                    أضف مهمة زراعية جديدة للجدولة الذكية
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="taskType">نوع المهمة</Label>
                    <Select value={newTask.taskType} onValueChange={(value) => setNewTask(prev => ({...prev, taskType: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المهمة" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="taskDate">التاريخ المطلوب</Label>
                    <Input
                      id="taskDate"
                      type="date"
                      value={newTask.scheduledDate}
                      onChange={(e) => setNewTask(prev => ({...prev, scheduledDate: e.target.value}))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={addNewTask}>
                    إضافة المهمة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {optimizedSchedule.map((task, index) => (
              <Card key={task.taskId} className={cn(
                "hover:shadow-md transition-shadow",
                task.status === 'critical' && "ring-2 ring-red-500 ring-opacity-50",
                task.status === 'optimal' && "ring-2 ring-green-500 ring-opacity-30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1">
                      <div className={cn(
                        "p-3 rounded-full",
                        task.status === 'optimal' ? "bg-green-100" :
                        task.status === 'suitable' ? "bg-blue-100" :
                        task.status === 'postpone' ? "bg-yellow-100" : "bg-red-100"
                      )}>
                        {getTaskIcon(task.taskType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                          <h3 className="font-semibold text-lg">
                            {taskTypes.find(t => t.id === task.taskType)?.name || task.taskType}
                          </h3>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Badge>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(task.scheduledDate)}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-3">
                          <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">ملاءمة الطقس</Label>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Progress value={task.weatherSuitability} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{task.weatherSuitability}%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">الظروف الجوية</Label>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                              <Thermometer className="h-3 w-3" />
                              <span>{task.weatherConditions.temperature.avg}°م</span>
                              <Wind className="h-3 w-3 mr-2" />
                              <span>{task.weatherConditions.windSpeed} كم/س</span>
                              <CloudRain className="h-3 w-3 mr-2" />
                              <span>{task.weatherConditions.precipitation} مم</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">مستوى الإلحاح</Label>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Gauge className="h-4 w-4" />
                              <span className="text-sm font-medium">{task.urgencyLevel}%</span>
                            </div>
                          </div>
                        </div>

                        {task.postponeReason && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-3">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">سبب التأجيل:</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">{task.postponeReason}</p>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium">التوصيات:</Label>
                          <ul className="mt-1 space-y-1">
                            {task.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="flex items-start space-x-2 rtl:space-x-reverse">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      {task.status === 'optimal' && <Play className="h-5 w-5 text-green-600" />}
                      {task.status === 'postpone' && <Pause className="h-5 w-5 text-yellow-600" />}
                      {task.status === 'critical' && <SkipForward className="h-5 w-5 text-red-600" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CloudRain className="h-5 w-5 ml-2" />
                توقعات الطقس للأسبوع القادم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="temp" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="درجة الحرارة (°م)" />
                    <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="الرطوبة (%)" />
                    <Area type="monotone" dataKey="precipitation" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="الأمطار (مم)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wind className="h-5 w-5 ml-2" />
                  سرعة الرياح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="wind" fill="#8b5cf6" name="سرعة الرياح (كم/س)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 ml-2" />
                  ملخص الطقس الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Thermometer className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">أعلى حرارة</span>
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {Math.max(...chartData.map(d => d.temp))}°م
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CloudRain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">إجمالي الأمطار</span>
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {chartData.reduce((sum, d) => sum + d.precipitation, 0).toFixed(1)} مم
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">متوسط الرطوبة</span>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {Math.round(chartData.reduce((sum, d) => sum + d.humidity, 0) / chartData.length)}%
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Wind className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">متوسط الرياح</span>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {Math.round(chartData.reduce((sum, d) => sum + d.wind, 0) / chartData.length)} كم/س
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 ml-2" />
                  توزيع المهام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskDistribution.map((task, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {getTaskIcon(taskTypes[index]?.id || '')}
                        <span className="text-sm">{task.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="w-24">
                          <Progress value={(task.count / optimizedSchedule.length) * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{task.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 ml-2" />
                  إحصائيات الملاءمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {optimizedSchedule.filter(t => t.status === 'optimal').length}
                      </div>
                      <div className="text-sm text-muted-foreground">مهام مثالية</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {optimizedSchedule.filter(t => t.status === 'postpone').length}
                      </div>
                      <div className="text-sm text-muted-foreground">مهام مؤجلة</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>متوسط الملاءمة الجوية</span>
                      <span className="font-medium">
                        {optimizedSchedule.length > 0 ? 
                          Math.round(optimizedSchedule.reduce((sum, task) => sum + task.weatherSuitability, 0) / optimizedSchedule.length) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={optimizedSchedule.length > 0 ? 
                        optimizedSchedule.reduce((sum, task) => sum + task.weatherSuitability, 0) / optimizedSchedule.length : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تحليل الاتجاهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600 mb-2">العوامل الإيجابية</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 ml-1" />
                      ظروف جوية مستقرة
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 ml-1" />
                      رطوبة مناسبة للنمو
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 ml-1" />
                      رياح معتدلة للرش
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-yellow-600 mb-2">نقاط الانتباه</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 ml-1" />
                      احتمالية أمطار متقطعة
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 ml-1" />
                      تقلبات في درجات الحرارة
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 ml-1" />
                      رياح قوية في بعض الأيام
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-blue-600 mb-2">التوصيات العامة</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <Target className="h-3 w-3 text-blue-600 ml-1" />
                      مراقبة يومية للطقس
                    </li>
                    <li className="flex items-center">
                      <Target className="h-3 w-3 text-blue-600 ml-1" />
                      مرونة في الجدولة
                    </li>
                    <li className="flex items-center">
                      <Target className="h-3 w-3 text-blue-600 ml-1" />
                      تحضير خطط بديلة
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6">
            {recommendations.immediate && recommendations.immediate.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <Bell className="h-5 w-5 ml-2" />
                    توصيات فورية (خلال 48 ساعة)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendations.immediate.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recommendations.weekly && recommendations.weekly.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-600">
                    <Calendar className="h-5 w-5 ml-2" />
                    توصيات أسبوعية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendations.weekly.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse p-3 bg-yellow-50 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recommendations.strategic && recommendations.strategic.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-600">
                    <TrendingUp className="h-5 w-5 ml-2" />
                    توصيات استراتيجية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendations.strategic.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse p-3 bg-blue-50 rounded-lg">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 ml-2" />
                  نصائح محلية لمنطقة {tunisianLocations.find(loc => loc.id === farmConfig.location)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">خصائص المنطقة</h4>
                    <ul className="text-sm space-y-1">
                      <li>• مناخ متوسطي معتدل</li>
                      <li>• موسم أمطار من أكتوبر إلى أبريل</li>
                      <li>• صيف حار وجاف</li>
                      <li>• رياح شمالية غربية سائدة</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">أفضل الممارسات</h4>
                    <ul className="text-sm space-y-1">
                      <li>• الري في الصباح الباكر</li>
                      <li>• تجنب الرش عند الرياح القوية</li>
                      <li>• الاستفادة من مياه الأمطار</li>
                      <li>• مراقبة تقلبات الطقس المفاجئة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
