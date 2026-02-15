import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarDays, 
  Sprout,
  Thermometer,
  CloudRain,
  Sun,
  Wind,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  MapPin,
  TrendingUp,
  BookOpen,
  Star,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyActivity {
  month: string;
  monthNumber: number;
  activities: string[];
  temperature: {
    min: number;
    max: number;
  };
  rainfall: number;
  recommendations: string[];
}

interface PlantingCalendar {
  governorate: string;
  year: number;
  calendar: MonthlyActivity[];
  generalAdvice: string[];
  climateInfo: {
    type: string;
    characteristics: string[];
    challenges: string[];
  };
}

interface CropRecommendation {
  crop: string;
  plantingMonths: number[];
  harvestMonths: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  profitability: number;
  waterRequirement: 'low' | 'medium' | 'high';
  description: string;
  tips: string[];
}

const tunisianGovernorates = [
  { id: 'tunis', name: 'تونس العاصمة' },
  { id: 'ariana', name: 'أريانة' },
  { id: 'ben_arous', name: 'بن عروس' },
  { id: 'manouba', name: 'منوبة' },
  { id: 'nabeul', name: 'نابل' },
  { id: 'zaghouan', name: 'زغوان' },
  { id: 'bizerte', name: 'بنزرت' },
  { id: 'beja', name: 'باجة' },
  { id: 'jendouba', name: 'جندوبة' },
  { id: 'kef', name: 'الكاف' },
  { id: 'siliana', name: 'سليانة' },
  { id: 'kairouan', name: 'القيروان' },
  { id: 'kasserine', name: 'القصرين' },
  { id: 'sidi_bouzid', name: 'سيدي بوزيد' },
  { id: 'sousse', name: 'سوسة' },
  { id: 'monastir', name: 'المنستير' },
  { id: 'mahdia', name: 'المهدية' },
  { id: 'sfax', name: 'صفاقس' },
  { id: 'gabes', name: 'قابس' },
  { id: 'medenine', name: 'مدنين' },
  { id: 'tataouine', name: 'تطاوين' },
  { id: 'gafsa', name: 'قفصة' },
  { id: 'tozeur', name: 'توزر' },
  { id: 'kebili', name: 'قبلي' }
];

const cropRecommendations: CropRecommendation[] = [
  {
    crop: 'الزيتون',
    plantingMonths: [10, 11, 2, 3],
    harvestMonths: [10, 11, 12],
    difficulty: 'medium',
    profitability: 85,
    waterRequirement: 'medium',
    description: 'محصول تقليدي تونسي مربح ومقاوم للجفاف',
    tips: [
      'اختر الأصناف المحلية المتكيفة',
      'ازرع في تربة جيدة التصريف',
      'تجنب المناطق المعرضة للصقيع'
    ]
  },
  {
    crop: 'الطماطم',
    plantingMonths: [2, 3, 4, 8, 9],
    harvestMonths: [5, 6, 7, 11, 12],
    difficulty: 'medium',
    profitability: 75,
    waterRequirement: 'high',
    description: 'محصول عالي الطلب يحتاج عناية مستمرة',
    tips: [
      'استخدم البيوت المحمية في الشتاء',
      'اختر أصناف مقاومة للأمراض',
      'وفر ري منتظم ومتوازن'
    ]
  },
  {
    crop: 'القمح',
    plantingMonths: [10, 11, 12],
    harvestMonths: [5, 6],
    difficulty: 'easy',
    profitability: 60,
    waterRequirement: 'medium',
    description: 'محصول استراتيجي أساسي للأمن الغذائي',
    tips: [
      'ازرع مع بداية الأمطار',
      'استخدم التسميد المتوازن',
      'راقب الأمراض الفطرية'
    ]
  },
  {
    crop: 'الحمضيات',
    plantingMonths: [2, 3, 4, 10, 11],
    harvestMonths: [12, 1, 2, 3, 4],
    difficulty: 'hard',
    profitability: 90,
    waterRequirement: 'high',
    description: 'أشجار مثمرة عالية القيمة تحتاج خبرة',
    tips: [
      'وفر حماية من الرياح الباردة',
      'استخدم أنظمة الري بالتنقيط',
      'راقب آفات الحمضيات بانتظام'
    ]
  },
  {
    crop: 'البطاطا',
    plantingMonths: [1, 2, 8, 9],
    harvestMonths: [4, 5, 6, 11, 12],
    difficulty: 'medium',
    profitability: 70,
    waterRequirement: 'medium',
    description: 'محصول سريع النمو عالي الطلب',
    tips: [
      'اختر تقاوي معتمدة خالية من الأمراض',
      'ازرع في تربة خفيفة جيدة التهوية',
      'تجنب الري المفرط قبل النضج'
    ]
  },
  {
    crop: 'التمر',
    plantingMonths: [3, 4, 10, 11],
    harvestMonths: [9, 10, 11],
    difficulty: 'hard',
    profitability: 95,
    waterRequirement: 'medium',
    description: 'محصول صحراوي عالي القيمة للتصدير',
    tips: [
      'يحتاج مناخ حار وجاف',
      'التلقيح اليدوي ضروري',
      'صبر طويل حتى بداية الإنتاج'
    ]
  }
];

export default function CropPlanner() {
  const [selectedGovernorate, setSelectedGovernorate] = useState('tunis');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [plantingCalendar, setPlantingCalendar] = useState<PlantingCalendar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const fetchPlantingCalendar = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/weather-irrigation/planting-calendar/${selectedGovernorate}?year=${selectedYear}`);
      const data = await response.json();
      setPlantingCalendar(data);
    } catch (error) {
      console.error('Error fetching planting calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantingCalendar();
  }, [selectedGovernorate, selectedYear]);

  const getMonthData = (monthNumber: number) => {
    return plantingCalendar?.calendar.find(month => month.monthNumber === monthNumber);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'صعب';
      default: return 'غير محدد';
    }
  };

  const getWaterRequirementColor = (requirement: string) => {
    switch (requirement) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getWaterRequirementText = (requirement: string) => {
    switch (requirement) {
      case 'low': return 'قليل';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      default: return 'غير محدد';
    }
  };

  const getCropsForMonth = (monthNumber: number) => {
    return cropRecommendations.filter(crop => 
      crop.plantingMonths.includes(monthNumber)
    );
  };

  const getHarvestCropsForMonth = (monthNumber: number) => {
    return cropRecommendations.filter(crop => 
      crop.harvestMonths.includes(monthNumber)
    );
  };

  const currentMonthData = getMonthData(selectedMonth);
  const currentMonthCrops = getCropsForMonth(selectedMonth);
  const currentMonthHarvests = getHarvestCropsForMonth(selectedMonth);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقويم الزراعة الذكي</h1>
          <p className="text-muted-foreground">
            تخطيط زراعي مبني على الطقس والمناخ المحلي
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر الولاية" />
            </SelectTrigger>
            <SelectContent>
              {tunisianGovernorates.map((gov) => (
                <SelectItem key={gov.id} value={gov.id}>
                  {gov.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Climate Information */}
      {plantingCalendar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sun className="h-5 w-5 ml-2" />
              معلومات المناخ - {tunisianGovernorates.find(g => g.id === selectedGovernorate)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">خصائص المناخ</h4>
                <ul className="space-y-1">
                  {plantingCalendar.climateInfo.characteristics.map((char, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">التحديات المناخية</h4>
                <ul className="space-y-1">
                  {plantingCalendar.climateInfo.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">التقويم الشهري</TabsTrigger>
          <TabsTrigger value="crops">دليل المحاصيل</TabsTrigger>
          <TabsTrigger value="current">الشهر الحالي</TabsTrigger>
          <TabsTrigger value="planning">التخطيط</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {plantingCalendar?.calendar.map((month, index) => (
              <Card key={index} className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                month.monthNumber === selectedMonth && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedMonth(month.monthNumber)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{month.month}</h3>
                    <Badge variant="outline">
                      {month.activities.length} نشاط
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span>{month.temperature.max}° / {month.temperature.min}°</span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <CloudRain className="h-4 w-4 text-blue-500" />
                        <span>{month.rainfall} مم</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">الأنشطة الزراعية</h4>
                      <div className="space-y-1">
                        {month.activities.slice(0, 3).map((activity, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center">
                            <Sprout className="h-3 w-3 ml-1 flex-shrink-0" />
                            {activity}
                          </div>
                        ))}
                        {month.activities.length > 3 && (
                          <div className="text-xs text-primary">
                            +{month.activities.length - 3} أنشطة أخرى
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="crops" className="space-y-4">
          <div className="grid gap-4">
            {cropRecommendations.map((crop, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Leaf className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{crop.crop}</h3>
                        <p className="text-muted-foreground">{crop.description}</p>
                      </div>
                    </div>
                    <div className="text-left rtl:text-right">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn(
                            "h-4 w-4",
                            i < Math.floor(crop.profitability / 20) ? "text-yellow-400 fill-current" : "text-gray-300"
                          )} />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">الربحية: {crop.profitability}%</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">أشهر الزراعة</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {crop.plantingMonths.map((month) => (
                          <Badge key={month} variant="outline" className="text-xs">
                            {['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][month]}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">أشهر الحصاد</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {crop.harvestMonths.map((month) => (
                          <Badge key={month} variant="secondary" className="text-xs">
                            {['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][month]}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">مستوى الصعوبة</Label>
                      <div className="mt-1">
                        <Badge className={getDifficultyColor(crop.difficulty)}>
                          {getDifficultyText(crop.difficulty)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">احتياج المياه</Label>
                      <div className={cn("mt-1 font-medium", getWaterRequirementColor(crop.waterRequirement))}>
                        {getWaterRequirementText(crop.waterRequirement)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">نصائح الزراعة</h4>
                    <ul className="space-y-1">
                      {crop.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start">
                          <Target className="h-4 w-4 text-primary mt-0.5 ml-2 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {currentMonthData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 ml-2" />
                    {currentMonthData.month} {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    الأنشطة الزراعية والظروف المناخية للشهر المحدد
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <Thermometer className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">درجة الحرارة</h4>
                      </div>
                      <div className="text-2xl font-bold">
                        {currentMonthData.temperature.max}° / {currentMonthData.temperature.min}°
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <CloudRain className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">معدل الأمطار</h4>
                      </div>
                      <div className="text-2xl font-bold">{currentMonthData.rainfall} مم</div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <Sprout className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-medium">الأنشطة</h4>
                      </div>
                      <div className="text-2xl font-bold">{currentMonthData.activities.length}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">الأنشطة الزراعية</h4>
                      <div className="space-y-2">
                        {currentMonthData.activities.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse p-2 bg-secondary/50 rounded">
                            <Sprout className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{activity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">التوصيات الشهرية</h4>
                      <div className="space-y-2">
                        {currentMonthData.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse p-2 bg-blue-50 rounded">
                            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Crops for Current Month */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sprout className="h-5 w-5 ml-2 text-green-600" />
                      محاصيل للزراعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentMonthCrops.length > 0 ? (
                      <div className="space-y-3">
                        {currentMonthCrops.map((crop, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{crop.crop}</span>
                              <Badge className={getDifficultyColor(crop.difficulty)}>
                                {getDifficultyText(crop.difficulty)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{crop.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        لا توجد محاصيل موصى بزراعتها هذا الشهر
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 ml-2 text-orange-600" />
                      محاصيل للحصاد
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentMonthHarvests.length > 0 ? (
                      <div className="space-y-3">
                        {currentMonthHarvests.map((crop, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{crop.crop}</span>
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={cn(
                                    "h-3 w-3",
                                    i < Math.floor(crop.profitability / 20) ? "text-yellow-400 fill-current" : "text-gray-300"
                                  )} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{crop.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        لا توجد محاصيل للحصاد هذا الشهر
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>التقويم السنوي</CardTitle>
                  <CardDescription>
                    انقر على أي تاريخ لمعرفة الأنشطة المناسبة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">خطة الزراعة السنوية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">الربع الأول (يناير - مارس)</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• زراعة القمح والشعير</div>
                        <div>• تقليم الأشجار المثمرة</div>
                        <div>• تحضير البيوت المحمية</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">الربع الثاني (أبريل - يونيو)</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• زراعة الخضروات الصيفية</div>
                        <div>• بداية موسم الري المكثف</div>
                        <div>• مكافحة الآفات الربيعية</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">الربع الثالث (يوليو - سبتمبر)</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• حصاد الحبوب</div>
                        <div>• قطف الفواكه الصيفية</div>
                        <div>• تحضير الأرض للزراعة الخريفية</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">الربع الرابع (أكتوبر - ديسمبر)</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• قطف الزيتون والتمر</div>
                        <div>• زراعة المحاصيل الشتوية</div>
                        <div>• تحضيرات الحماية من الصقيع</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">نصائح عامة</CardTitle>
                </CardHeader>
                <CardContent>
                  {plantingCalendar && (
                    <div className="space-y-2">
                      {plantingCalendar.generalAdvice.map((advice, index) => (
                        <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse">
                          <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{advice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
