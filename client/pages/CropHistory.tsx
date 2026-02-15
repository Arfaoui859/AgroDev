import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Search, 
  Calendar, 
  MapPin, 
  Eye,
  Trash2,
  Download,
  Filter,
  Plus,
  BarChart3,
  AlertCircle,
  Lightbulb,
  Star,
  Activity,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface CropRecommendation {
  id: string;
  name: string;
  suitabilityScore: number;
  profitability: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  estimatedProfit: number;
}

interface RecommendationHistory {
  id: string;
  locationData: {
    method: string;
    governorate?: string;
    city?: string;
    region?: string;
    address?: string;
    weatherData?: {
      temperature: number;
      humidity: number;
      description: string;
    };
  };
  recommendations: CropRecommendation[];
  timestamp: string;
  topRecommendation?: CropRecommendation;
}

export default function CropHistory() {
  const [history, setHistory] = useState<RecommendationHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<RecommendationHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    // Load history from localStorage
    const saved = localStorage.getItem('cropRecommendationHistory');
    if (saved) {
      const parsedHistory: RecommendationHistory[] = JSON.parse(saved);
      // Add top recommendation to each history entry
      const enrichedHistory = parsedHistory.map(entry => ({
        ...entry,
        topRecommendation: entry.recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore)[0]
      }));
      setHistory(enrichedHistory);
      setFilteredHistory(enrichedHistory);
    }
  }, []);

  useEffect(() => {
    // Filter and sort history
    let filtered = history.filter((entry) => {
      const location = getLocationString(entry.locationData);
      const matchesSearch = location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.topRecommendation?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      let matchesPeriod = true;

      if (filterPeriod === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = entryDate >= weekAgo;
      } else if (filterPeriod === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesPeriod = entryDate >= monthAgo;
      } else if (filterPeriod === "quarter") {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        matchesPeriod = entryDate >= quarterAgo;
      }

      return matchesSearch && matchesPeriod;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "location":
          return getLocationString(a.locationData).localeCompare(getLocationString(b.locationData), 'ar');
        case "profitability":
          return (b.topRecommendation?.estimatedProfit || 0) - (a.topRecommendation?.estimatedProfit || 0);
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [history, searchTerm, sortBy, filterPeriod]);

  const getLocationString = (locationData: RecommendationHistory['locationData']) => {
    if (locationData.governorate) {
      return `${locationData.city || ''}, ${locationData.governorate}`;
    }
    return locationData.address || 'موقع غير محدد';
  };

  const deleteEntry = (id: string) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('cropRecommendationHistory', JSON.stringify(updatedHistory));
    toast.success("تم حذف السجل بنجاح");
  };

  const viewEntry = (entry: RecommendationHistory) => {
    // Store the historical data as current for viewing
    localStorage.setItem('selectedLocation', JSON.stringify(entry.locationData));
    navigate('/recommendations');
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: "مخاطر منخفضة", color: "bg-green-500" },
      medium: { label: "مخاطر متوسطة", color: "bg-yellow-500" },
      high: { label: "مخاطر عالية", color: "bg-red-500" }
    };
    const riskConfig = config[risk as keyof typeof config];
    return <Badge className={`${riskConfig.color} text-white text-xs`}>{riskConfig.label}</Badge>;
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crop-recommendations-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير السجل بنجاح");
  };

  const calculateAverageProfit = () => {
    if (history.length === 0) return 0;
    const totalProfit = history.reduce((sum, entry) => sum + (entry.topRecommendation?.estimatedProfit || 0), 0);
    return Math.round(totalProfit / history.length);
  };

  const getMostRecommendedCrop = () => {
    const cropCounts: { [key: string]: number } = {};
    history.forEach(entry => {
      if (entry.topRecommendation) {
        cropCounts[entry.topRecommendation.name] = (cropCounts[entry.topRecommendation.name] || 0) + 1;
      }
    });
    
    return Object.entries(cropCounts).reduce((a, b) => 
      cropCounts[a[0]] > cropCounts[b[0]] ? a : b
    )?.[0] || 'لا يوجد';
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">لا توجد توصيات سابقة</h2>
        <p className="text-muted-foreground mb-6">
          لم تقم بطلب أي توصيات محاصيل بعد. ابدأ أول تحليل لك الآن
        </p>
        <Button onClick={() => navigate('/location')}>
          <Plus className="w-4 h-4 ml-2" />
          طلب توصيات جديدة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">سجل توصيات المحاصيل</h1>
        <p className="text-muted-foreground">
          عرض وإدارة جميع توصيات المحاصيل السابقة ({history.length} سجل)
        </p>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{history.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي التوصيات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{calculateAverageProfit().toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">متوسط الربح المتوقع</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-600">{getMostRecommendedCrop()}</div>
            <div className="text-sm text-muted-foreground">الأكثر توصية</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(history.map(h => getLocationString(h.locationData))).size}
            </div>
            <div className="text-sm text-muted-foreground">مواقع مختلفة</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Filter className="w-5 h-5" />
            <span>البحث والتصفية</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الموقع أو المحصول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="فترة زمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
                <SelectItem value="quarter">آخر 3 شهور</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">التاريخ</SelectItem>
                <SelectItem value="location">الموقع</SelectItem>
                <SelectItem value="profitability">الربحية</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportHistory} className="w-full">
              <Download className="w-4 h-4 ml-2" />
              تصدير السجل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          ��رض {filteredHistory.length} من أصل {history.length} سجل
        </p>
        <Button onClick={() => navigate('/location')} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          توصيات جديدة
        </Button>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground text-center">
              لم يتم العثور على سجلات تطابق معايير البحث والفلترة المحددة
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  {/* Main Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h3 className="text-lg font-semibold">{getLocationString(entry.locationData)}</h3>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 ml-1" />
                        {format(new Date(entry.timestamp), 'dd MMM yyyy', { locale: ar })}
                      </Badge>
                    </div>

                    {/* Top Recommendation */}
                    {entry.topRecommendation && (
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="font-medium">أفضل توصية:</span>
                          <span className="font-bold text-primary">{entry.topRecommendation.name}</span>
                          {getRiskBadge(entry.topRecommendation.riskLevel)}
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span>ملاءمة: {entry.topRecommendation.suitabilityScore}%</span>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <span>ربحية: {entry.topRecommendation.profitability}%</span>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>ربح متوقع: {entry.topRecommendation.estimatedProfit.toLocaleString()} جنيه</span>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Lightbulb className="w-4 h-4 text-orange-600" />
                            <span>فئة: {entry.topRecommendation.category}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Weather Conditions */}
                    {entry.locationData.weatherData && (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <MapPin className="w-4 h-4" />
                          <span>{getLocationString(entry.locationData)}</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Activity className="w-4 h-4" />
                          <span>{Math.round(entry.locationData.weatherData.temperature)}°C</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Clock className="w-4 h-4" />
                          <span>{entry.locationData.weatherData.description}</span>
                        </div>
                      </div>
                    )}

                    {/* Additional Recommendations Count */}
                    <div className="text-sm text-muted-foreground">
                      <span>إجمالي {entry.recommendations.length} توصية محصول</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 rtl:space-x-reverse lg:flex-col lg:space-x-0 lg:space-y-2">
                    <Button
                      size="sm"
                      onClick={() => viewEntry(entry)}
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التوصيات
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteEntry(entry.id)}
                      className="flex-1 lg:flex-none text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate('/location')}>
          <Plus className="w-4 h-4 ml-2" />
          طلب توصيات جديدة
        </Button>
        <Button onClick={() => navigate('/recommendations')} variant="outline">
          <Lightbulb className="w-4 h-4 ml-2" />
          عرض آخر التوصيات
        </Button>
      </div>
    </div>
  );
}
