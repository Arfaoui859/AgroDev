import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History as HistoryIcon,
  Search,
  Calendar,
  MapPin,
  Leaf,
  Eye,
  Trash2,
  Download,
  Filter,
  Plus,
  FileText,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface HistoryEntry {
  id: string;
  location: string;
  area: string;
  cropType: string;
  ph: string;
  timestamp: string;
  score?: number;
  status?: string;
  nitrogen?: string;
  phosphorus?: string;
  potassium?: string;
  moisture?: string;
  notes?: string;
}

const cropTypeMap: { [key: string]: string } = {
  olive: "زيتون",
  citrus: "حمضيات",
  wheat: "قمح صلب",
  tomato: "طماطم",
  artichoke: "خرشوف",
  vegetables: "خضروات",
  fruits: "فواكه",
  grains: "حبوب",
  trees: "أشجار مثمرة",
  other: "أخرى",
};

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCrop, setFilterCrop] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const navigate = useNavigate();

  useEffect(() => {
    // Load history from localStorage
    const saved = localStorage.getItem("soilHistory");
    if (saved) {
      const parsedHistory = JSON.parse(saved);
      setHistory(parsedHistory);
      setFilteredHistory(parsedHistory);
    }
  }, []);

  useEffect(() => {
    // Filter and sort history
    let filtered = history.filter((entry) => {
      const matchesSearch =
        entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cropTypeMap[entry.cropType]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCrop = filterCrop === "all" || entry.cropType === filterCrop;

      return matchesSearch && matchesCrop;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "location":
          return a.location.localeCompare(b.location, "ar");
        case "crop":
          return (cropTypeMap[a.cropType] || a.cropType).localeCompare(
            cropTypeMap[b.cropType] || b.cropType,
            "ar",
          );
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [history, searchTerm, filterCrop, sortBy]);

  const deleteEntry = (id: string) => {
    const updatedHistory = history.filter((entry) => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("soilHistory", JSON.stringify(updatedHistory));
    toast.success("تم حذف السجل بنجاح");
  };

  const viewEntry = (entry: HistoryEntry) => {
    // Set as current analysis and navigate to enhanced analysis page
    localStorage.setItem("currentAnalysis", JSON.stringify(entry));
    navigate("/enhanced-analysis");
  };

  const getStatusBadge = (ph: string) => {
    const value = parseFloat(ph);
    if (value >= 6.0 && value <= 7.5) {
      return <Badge className="bg-soil-healthy text-white">ممتاز</Badge>;
    } else if (value >= 5.5 && value <= 8.0) {
      return <Badge className="bg-soil-info text-white">جيد</Badge>;
    } else if (value >= 4.5 && value <= 9.0) {
      return <Badge className="bg-soil-warning text-white">متوسط</Badge>;
    } else {
      return <Badge className="bg-soil-danger text-white">ضعيف</Badge>;
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soil-history-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير السجل بنجاح");
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <HistoryIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">لا توجد سجلات تحليل</h2>
        <p className="text-muted-foreground mb-6">
          لم تقم بإجراء أي تحليل ��لتربة بعد. ابدأ أول تحليل لك الآن
        </p>
        <Button onClick={() => navigate("/")}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة تحليل جديد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <HistoryIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">سجل تحليلات التربة</h1>
        <p className="text-muted-foreground">
          عرض وإدارة جميع تحليلات التربة السابقة ({history.length} سجل)
        </p>
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
                placeholder="البحث في الموقع أو المساحة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب المحصول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحاصيل</SelectItem>
                {Object.entries(cropTypeMap).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">التاريخ</SelectItem>
                <SelectItem value="location">الموقع</SelectItem>
                <SelectItem value="crop">نوع المحصول</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={exportHistory}
              className="w-full"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير السجل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {filteredHistory.length} من أصل {history.length} سجل
        </p>
        <Button onClick={() => navigate("/")} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          تحليل جديد
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
        <div className="grid gap-4">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  {/* Main Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h3 className="text-lg font-semibold">
                        {entry.location}
                      </h3>
                      {getStatusBadge(entry.ph)}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <MapPin className="w-4 h-4" />
                        <span>{entry.area}</span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Leaf className="w-4 h-4" />
                        <span>
                          {cropTypeMap[entry.cropType] || entry.cropType}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(entry.timestamp), "dd MMM yyyy", {
                            locale: ar,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <FileText className="w-4 h-4" />
                        <span>pH: {entry.ph}</span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      {entry.nitrogen && (
                        <span>نيتروجين: {entry.nitrogen} ppm</span>
                      )}
                      {entry.phosphorus && (
                        <span>فوسفور: {entry.phosphorus} ppm</span>
                      )}
                      {entry.potassium && (
                        <span>بوتاسيوم: {entry.potassium} ppm</span>
                      )}
                      {entry.moisture && <span>رطوبة: {entry.moisture}%</span>}
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-2 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 rtl:space-x-reverse lg:flex-col lg:space-x-0 lg:space-y-2">
                    <Button
                      size="sm"
                      onClick={() => viewEntry(entry)}
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التحليل
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

      {/* Summary Statistics */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات السجل</CardTitle>
            <CardDescription>ملخص إحصائي لجميع تحليلات التربة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {history.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  إجمالي التحليلات
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-soil-healthy">
                  {
                    history.filter((h) => {
                      const ph = parseFloat(h.ph);
                      return ph >= 6.0 && ph <= 7.5;
                    }).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  تحليلات ممتازة
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-plant-green">
                  {new Set(history.map((h) => h.cropType)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  أنواع المحاصيل
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-earth-brown">
                  {new Set(history.map((h) => h.location)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  المواقع المختلفة
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
