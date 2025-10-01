import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Droplets, 
  CloudRain, 
  Thermometer,
  Wind,
  Sun,
  Calculator,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Leaf,
  Target,
  Waves,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IrrigationSchedule {
  date: string;
  recommended: boolean;
  waterAmount: number;
  duration: string;
  bestTime: string;
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    suitability: string;
  };
  efficiency: number;
  cost: number;
  soilMoisture: number;
  notes: string;
}

interface WeatherForecast {
  date: string;
  station: string;
  temperature: {
    max: number;
    min: number;
    avg: number;
  };
  humidity: number;
  windSpeed: number;
  precipitation: number;
  solarRadiation: number;
  evapotranspiration: number;
  soilMoisture: number;
  irrigationNeed: number;
}

const cropOptions = [
  { id: 'olive', name: 'الزيتون', stages: ['إزهار', 'عقد الثمار', 'تطور الثمار', 'نضج', 'سكون'] },
  { id: 'tomato', name: 'الطماطم', stages: ['إنبات', 'نمو خضري', 'إزهار', 'إثمار', 'نضج'] },
  { id: 'wheat', name: 'القمح', stages: ['إنبات', 'تكوين الأشطاء', 'استطالة الساق', 'إزهار', 'امتلاء الحبوب', 'نضج'] },
  { id: 'citrus', name: 'الحمضيات', stages: ['إزهار', 'عقد الثمار', 'تطور الثمار', 'قطف', 'سكون'] },
  { id: 'potato', name: 'البطاطا', stages: ['ظهور', 'نمو خضري', 'تكوين درنات', 'انتفاخ درنات', 'نضج'] }
];

const irrigationSystems = [
  { id: 'drip', name: 'الري بالتنقيط', efficiency: 90 },
  { id: 'sprinkler', name: 'الري بالرش', efficiency: 75 },
  { id: 'furrow', name: 'الري بالخطوط', efficiency: 60 },
  { id: 'flood', name: 'الري بالغمر', efficiency: 40 }
];

const tunisianStations = [
  { id: 'tunis-center', name: 'تونس العاصمة' },
  { id: 'sfax-center', name: 'صفاقس' },
  { id: 'sousse-center', name: 'سوسة' },
  { id: 'kairouan', name: 'القيروان' },
  { id: 'gabes', name: 'قابس' },
  { id: 'bizerte', name: 'بنزرت' }
];

export default function IrrigationScheduler() {
  const [irrigationParams, setIrrigationParams] = useState({
    cropType: 'olive',
    growthStage: 'تطور الثمار',
    farmSize: 2.5,
    soilType: 'clay',
    irrigationSystem: 'drip',
    stationId: 'tunis-center',
    plantingDate: '2024-01-01',
    waterCost: 0.8
  });

  const [schedule, setSchedule] = useState<IrrigationSchedule[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [scheduleSummary, setScheduleSummary] = useState({
    totalWaterNeeded: 0,
    totalCost: 0,
    recommendedIrrigationDays: 0,
    waterSavings: 0,
    efficiencyScore: 0
  });

  const generateSchedule = async () => {
    setIsLoading(true);
    try {
      // Fetch weather forecast
      const weatherResponse = await fetch(`/api/weather-irrigation/forecast/${irrigationParams.stationId}?days=14`);
      const weatherData = await weatherResponse.json();
      setWeatherForecast(weatherData.forecast);

      // Generate irrigation schedule
      const scheduleResponse = await fetch('/api/weather-irrigation/irrigation/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(irrigationParams),
      });
      
      const scheduleData = await scheduleResponse.json();
      setSchedule(scheduleData.schedule);
      setScheduleSummary(scheduleData.summary);
    } catch (error) {
      console.error('Error generating irrigation schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateSchedule();
  }, [irrigationParams.cropType, irrigationParams.stationId, irrigationParams.irrigationSystem]);

  const updateParam = (key: string, value: any) => {
    setIrrigationParams(prev => ({ ...prev, [key]: value }));
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-TN', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartData = schedule.map(day => ({
    date: formatDate(day.date),
    waterAmount: day.waterAmount,
    soilMoisture: day.soilMoisture,
    efficiency: day.efficiency,
    cost: day.cost
  }));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">جدولة الري الذكية</h1>
          <p className="text-muted-foreground">
            نظام ذكي لجدولة الري بناءً على الطقس وحاجة النبات
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              checked={isAutoMode}
              onCheckedChange={setIsAutoMode}
            />
            <Label>الوضع التلقائي</Label>
          </div>
          <Button onClick={generateSchedule} disabled={isLoading}>
            {isLoading ? <RotateCcw className="h-4 w-4 animate-spin ml-2" /> : <Calculator className="h-4 w-4 ml-2" />}
            {isLoading ? 'جاري الحساب...' : 'إعادة حساب'}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 ml-2" />
            إعدادات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cropType">نوع المحصول</Label>
              <Select value={irrigationParams.cropType} onValueChange={(value) => updateParam('cropType', value)}>
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
              <Label htmlFor="growthStage">مرحلة النمو</Label>
              <Select value={irrigationParams.growthStage} onValueChange={(value) => updateParam('growthStage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="مرحلة النمو" />
                </SelectTrigger>
                <SelectContent>
                  {cropOptions.find(c => c.id === irrigationParams.cropType)?.stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
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
                value={irrigationParams.farmSize}
                onChange={(e) => updateParam('farmSize', parseFloat(e.target.value) || 1)}
                min="0.1"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="irrigationSystem">نظام الري</Label>
              <Select value={irrigationParams.irrigationSystem} onValueChange={(value) => updateParam('irrigationSystem', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="نظام الري" />
                </SelectTrigger>
                <SelectContent>
                  {irrigationSystems.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.name} ({system.efficiency}% كفاءة)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stationId">محطة الطقس</Label>
              <Select value={irrigationParams.stationId} onValueChange={(value) => updateParam('stationId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="محطة الطقس" />
                </SelectTrigger>
                <SelectContent>
                  {tunisianStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="waterCost">تكلفة المياه (د.ت/م³)</Label>
              <Input
                id="waterCost"
                type="number"
                value={irrigationParams.waterCost}
                onChange={(e) => updateParam('waterCost', parseFloat(e.target.value) || 0.8)}
                min="0.1"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="plantingDate">تاريخ الزراعة</Label>
              <Input
                id="plantingDate"
                type="date"
                value={irrigationParams.plantingDate}
                onChange={(e) => updateParam('plantingDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-full">
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduleSummary.totalWaterNeeded}</div>
                <div className="text-xs text-muted-foreground">لتر ماء</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduleSummary.totalCost}</div>
                <div className="text-xs text-muted-foreground">د.ت</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduleSummary.recommendedIrrigationDays}</div>
                <div className="text-xs text-muted-foreground">يوم ري</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-purple-100 rounded-full">
                <Waves className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduleSummary.waterSavings}</div>
                <div className="text-xs text-muted-foreground">لتر وفر</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-orange-100 rounded-full">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduleSummary.efficiencyScore}%</div>
                <div className="text-xs text-muted-foreground">الكفاءة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">جدول الري</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="weather">الطقس</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="space-y-4">
            {schedule.map((day, index) => (
              <Card key={index} className={cn(
                "hover:shadow-md transition-shadow",
                day.recommended && "ring-2 ring-blue-500 ring-opacity-30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={cn(
                        "p-3 rounded-full",
                        day.recommended ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        <Droplets className={cn(
                          "h-6 w-6",
                          day.recommended ? "text-blue-600" : "text-gray-400"
                        )} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{formatDate(day.date)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {day.recommended ? 'يُنصح بالري' : 'لا حاجة للري'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getSuitabilityIcon(day.weatherConditions.suitability)}
                      <Badge variant={day.recommended ? "default" : "secondary"}>
                        {day.waterAmount} لتر
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">كمية المياه</Label>
                      <div className="font-medium">{day.waterAmount} لتر</div>
                      <div className="text-xs text-muted-foreground">المدة: {day.duration}</div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">أفضل وقت</Label>
                      <div className="font-medium text-sm">{day.bestTime}</div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">الظروف الجوية</Label>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse text-sm">
                        <Thermometer className="h-3 w-3" />
                        <span>{day.weatherConditions.temperature}°م</span>
                        <Wind className="h-3 w-3 mr-2" />
                        <span>{day.weatherConditions.windSpeed} كم/س</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">التكلفة والكفاءة</Label>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="font-medium">{day.cost.toFixed(2)} د.ت</span>
                        <Badge variant="outline" className="text-xs">
                          {day.efficiency}% كفاءة
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Waves className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">رطوبة التربة: {day.soilMoisture}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.notes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>استهلاك المياه اليومي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value} ${name === 'waterAmount' ? 'لتر' : name === 'cost' ? 'د.ت' : '%'}`,
                          name === 'waterAmount' ? 'كمية المياه' : 
                          name === 'soilMoisture' ? 'رطوبة التربة' : 
                          name === 'efficiency' ? 'الكفاءة' : 'التكلفة'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="waterAmount" fill="#3b82f6" name="كمية المياه" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>رطوبة التربة والكفاءة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="soilMoisture" stroke="#10b981" name="رطوبة التربة" />
                      <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" name="الكفاءة" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تحليل التكلفة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value} د.ت`, 'التكلفة اليومية']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#ef4444" name="التكلفة اليومية" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weatherForecast.slice(0, 6).map((day, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">
                      {formatDate(day.date)}
                    </div>
                    <Badge variant="outline">
                      {day.precipitation > 0 ? `${day.precipitation} مم` : 'جاف'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        {day.temperature.max}° / {day.temperature.min}°
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">رطوبة: {day.humidity}%</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">رياح: {day.windSpeed} كم/س</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">إشعاع: {day.solarRadiation} كيلو وات/م²</span>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        التبخر: {day.evapotranspiration} مم/يوم
                      </div>
                      <div className="text-xs text-muted-foreground">
                        احتياج الري: {day.irrigationNeed.toFixed(1)} مم
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
