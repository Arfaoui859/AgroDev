import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Calendar, 
  Eye,
  Trash2,
  Download,
  Filter,
  Plus,
  AlertCircle,
  Stethoscope,
  Camera,
  TrendingUp,
  BarChart3,
  Clock,
  Leaf,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface DiagnosisHistory {
  id: string;
  images: string[];
  cropType: string;
  plantPart: string;
  symptoms?: string;
  additionalInfo?: string;
  timestamp: string;
  confidence: number;
  diagnosis: {
    disease: string;
    confidence: number;
    severity: string;
    description: string;
    treatment: string[];
    prevention: string[];
  };
}

export default function DiseaseHistory() {
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DiagnosisHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCrop, setFilterCrop] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const navigate = useNavigate();

  useEffect(() => {
    // Load history from localStorage
    const saved = localStorage.getItem('diseaseHistory');
    if (saved) {
      const parsedHistory = JSON.parse(saved);
      setHistory(parsedHistory);
      setFilteredHistory(parsedHistory);
    }
  }, []);

  useEffect(() => {
    // Filter and sort history
    let filtered = history.filter((entry) => {
      const matchesSearch = entry.diagnosis.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (entry.symptoms && entry.symptoms.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCrop = filterCrop === "all" || entry.cropType === filterCrop;
      const matchesSeverity = filterSeverity === "all" || entry.diagnosis.severity === filterSeverity;
      
      return matchesSearch && matchesCrop && matchesSeverity;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "confidence":
          return b.diagnosis.confidence - a.diagnosis.confidence;
        case "disease":
          return a.diagnosis.disease.localeCompare(b.diagnosis.disease, 'ar');
        case "crop":
          return a.cropType.localeCompare(b.cropType, 'ar');
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [history, searchTerm, filterCrop, filterSeverity, sortBy]);

  const deleteEntry = (id: string) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('diseaseHistory', JSON.stringify(updatedHistory));
    toast.success("تم حذف السجل بنجاح");
  };

  const viewEntry = (entry: DiagnosisHistory) => {
    localStorage.setItem('currentDiagnosis', JSON.stringify(entry));
    navigate(`/disease-diagnosis/${entry.id}`);
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      'منخفض': { label: "منخفض", color: "bg-green-500" },
      'متوسط': { label: "متوسط", color: "bg-yellow-500" },
      'عالي': { label: "عالي", color: "bg-red-500" },
      'low': { label: "منخفض", color: "bg-green-500" },
      'medium': { label: "متوسط", color: "bg-yellow-500" },
      'high': { label: "عالي", color: "bg-red-500" }
    };
    const severityConfig = config[severity as keyof typeof config] || { label: severity, color: "bg-gray-500" };
    return <Badge className={`${severityConfig.color} text-white text-xs`}>{severityConfig.label}</Badge>;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disease-diagnosis-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير السجل بنجاح");
  };

  const cropTypeMap: { [key: string]: string } = {
    'olive': 'زيتون',
    'citrus': 'حمضيات',
    'wheat': 'قمح صلب',
    'tomato': 'طماطم',
    'artichoke': 'خرشوف',
    'pepper': 'فلفل',
    'potato': 'بطاطس',
    'grape': 'عنب',
    'fig': 'تين',
    'pomegranate': 'رمان',
    'other': 'أخرى'
  };

  const plantPartMap: { [key: string]: string } = {
    'leaves': 'أوراق',
    'fruit': 'ثمار',
    'stem': 'ساق',
    'roots': 'جذور',
    'flowers': 'أزهار',
    'bark': 'لحاء',
    'whole-plant': 'النبات كاملاً'
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = history.length;
    const highConfidence = history.filter(h => h.diagnosis.confidence >= 90).length;
    const severeDiseases = history.filter(h => h.diagnosis.severity === 'عالي' || h.diagnosis.severity === 'high').length;
    const mostCommonCrop = history.reduce((acc, h) => {
      acc[h.cropType] = (acc[h.cropType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const topCrop = Object.entries(mostCommonCrop).sort(([,a], [,b]) => b - a)[0];
    
    return {
      total,
      highConfidence,
      severeDiseases,
      topCrop: topCrop ? cropTypeMap[topCrop[0]] || topCrop[0] : 'لا يوجد'
    };
  };

  const stats = getStatistics();

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Stethoscope className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">لا توجد تشخيصات سابقة</h2>
        <p className="text-muted-foreground mb-6">
          لم تقم بإجراء أي تشخيص للأمراض بعد. ابدأ أول تشخيص لك الآن
        </p>
        <Button onClick={() => navigate('/disease-upload')}>
          <Plus className="w-4 h-4 ml-2" />
          إجراء تشخيص جديد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">سجل تشخيص الأمراض</h1>
        <p className="text-muted-foreground">
          عرض وإدارة جميع تشخيصات الأمراض السابقة ({history.length} سجل)
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي التشخيصات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
            <div className="text-sm text-muted-foreground">تشخيص دقيق (+90%)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.severeDiseases}</div>
            <div className="text-sm text-muted-foreground">حالة خطيرة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.topCrop}</div>
            <div className="text-sm text-muted-foreground">الأكثر تشخيصاً</div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المرض أو المحصول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger>
                <SelectValue placeholder="نوع المحصول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحاصيل</SelectItem>
                {Object.entries(cropTypeMap).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="مستوى الخطورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="منخفض">منخفض</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="عالي">عالي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">التاريخ</SelectItem>
                <SelectItem value="confidence">دقة التشخيص</SelectItem>
                <SelectItem value="disease">اسم المرض</SelectItem>
                <SelectItem value="crop">نوع المحصول</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportHistory} className="w-full">
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {filteredHistory.length} من أصل {history.length} سجل
        </p>
        <Button onClick={() => navigate('/disease-upload')} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          تشخيص جديد
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
                      <h3 className="text-lg font-semibold text-primary">{entry.diagnosis.disease}</h3>
                      {getSeverityBadge(entry.diagnosis.severity)}
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 ml-1" />
                        {format(new Date(entry.timestamp), 'dd MMM yyyy', { locale: ar })}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Leaf className="w-4 h-4 text-green-600" />
                        <span>{cropTypeMap[entry.cropType] || entry.cropType}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span>{plantPartMap[entry.plantPart] || entry.plantPart}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <span className={getConfidenceColor(entry.diagnosis.confidence)}>
                          دقة: {Math.round(entry.diagnosis.confidence)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Camera className="w-4 h-4 text-orange-600" />
                        <span>{entry.images.length} صورة</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <p className="text-muted-foreground line-clamp-2">
                        {entry.diagnosis.description}
                      </p>
                    </div>

                    {entry.symptoms && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">الأعراض: </span>
                        <span className="text-muted-foreground line-clamp-1">{entry.symptoms}</span>
                      </div>
                    )}

                    {/* Treatment Summary */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium text-muted-foreground ml-2">العلاج:</span>
                      {entry.diagnosis.treatment.slice(0, 2).map((treatment, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {treatment.length > 30 ? treatment.substring(0, 30) + '...' : treatment}
                        </Badge>
                      ))}
                      {entry.diagnosis.treatment.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.diagnosis.treatment.length - 2} أخرى
                        </Badge>
                      )}
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
                      عرض التفاصيل
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
        <Button onClick={() => navigate('/disease-upload')}>
          <Camera className="w-4 h-4 ml-2" />
          إجراء تشخيص جديد
        </Button>
        <Button onClick={() => navigate('/disease-guide')} variant="outline">
          <TrendingUp className="w-4 h-4 ml-2" />
          دليل الأمراض
        </Button>
      </div>
    </div>
  );
}
