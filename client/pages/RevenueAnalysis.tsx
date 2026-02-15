import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Package,
  Star,
  MapPin,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface RevenueRecord {
  id: string;
  farmerId: string;
  cropType: string;
  varietyName: string;
  quantitySold: number;
  unit: "kg" | "ton" | "quintals" | "pieces";
  pricePerUnit: number;
  totalRevenue: number;
  currency: string;
  saleDate: string;
  buyer: string;
  marketLocation: string;
  qualityGrade: "A" | "B" | "C" | "Premium";
  seasonYear: number;
  harvestDate: string;
  storageTime: number;
  transportationCost: number;
  marketingCost: number;
  netRevenue: number;
}

interface MarketPrice {
  cropType: string;
  currentPrice: number;
  priceChange: number;
  marketTrend: "rising" | "falling" | "stable";
  demandLevel: "high" | "medium" | "low";
  recommendations: string[];
}

const RevenueAnalysis: React.FC = () => {
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueRecord | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCrop, setFilterCrop] = useState<string>("");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [filterQuality, setFilterQuality] = useState<string>("");

  const [formData, setFormData] = useState({
    cropType: "",
    varietyName: "",
    quantitySold: "",
    unit: "kg" as RevenueRecord["unit"],
    pricePerUnit: "",
    saleDate: new Date().toISOString().split("T")[0],
    buyer: "",
    marketLocation: "",
    qualityGrade: "A" as RevenueRecord["qualityGrade"],
    harvestDate: "",
    storageTime: "0",
    transportationCost: "0",
    marketingCost: "0",
  });

  const cropTypes = [
    "قمح",
    "شعير",
    "زيتون",
    "حمضيات",
    "طماطم",
    "خيار",
    "فلفل",
    "باذنجان",
    "جزر",
    "بطاطس",
    "بص��",
    "عنب",
    "تفاح",
    "رمان",
    "تين",
    "لوز",
  ];

  const marketLocations = [
    "سوق الحبوب - تونس",
    "سوق الخضار - أريانة",
    "سوق الفواكه - نابل",
    "سوق الزيتون - صفاقس",
    "سوق الحمضيات - بنزرت",
    "سوق مجاز الباب",
    "سوق القيروان",
    "سوق قابس",
    "سوق جندوبة",
    "تصدير",
  ];

  useEffect(() => {
    fetchRevenues();
    fetchMarketPrices();
  }, [filterCrop, filterSeason, filterQuality]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterCrop && filterCrop !== "all")
        params.append("cropType", filterCrop);
      if (filterSeason && filterSeason !== "all")
        params.append("seasonYear", filterSeason);

      const response = await fetch(`/api/revenues?${params}`);
      const data = await response.json();

      if (data.success) {
        setRevenues(data.data.revenues);
      }
    } catch (error) {
      console.error("Error fetching revenues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      // Mock market prices data
      const mockPrices: MarketPrice[] = [
        {
          cropType: "قمح",
          currentPrice: 1.2,
          priceChange: 5.3,
          marketTrend: "rising",
          demandLevel: "high",
          recommendations: [
            "أسعار مرتفعة - وقت مثالي للبيع",
            "توقع استقرار الأسعار الأسبوع المقبل",
          ],
        },
        {
          cropType: "زيتون",
          currentPrice: 2.8,
          priceChange: -2.1,
          marketTrend: "falling",
          demandLevel: "medium",
          recommendations: [
            "انخفاض طفيف في الأسعار",
            "انتظر موسم ��لزيت للحصول على أسعار أفضل",
          ],
        },
        {
          cropType: "طماطم",
          currentPrice: 1.8,
          priceChange: 0.0,
          marketTrend: "stable",
          demandLevel: "high",
          recommendations: ["أسعار مستقرة مع طلب عالي", "يمكن البيع بأمان"],
        },
      ];
      setMarketPrices(mockPrices);
    } catch (error) {
      console.error("Error fetching market prices:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalRevenue =
        parseFloat(formData.quantitySold) * parseFloat(formData.pricePerUnit);
      const transportationCost = parseFloat(formData.transportationCost);
      const marketingCost = parseFloat(formData.marketingCost);
      const netRevenue = totalRevenue - transportationCost - marketingCost;

      const revenueData = {
        farmerId: "current-farmer",
        cropType: formData.cropType,
        varietyName: formData.varietyName,
        quantitySold: parseFloat(formData.quantitySold),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalRevenue,
        currency: "TND",
        saleDate: formData.saleDate,
        buyer: formData.buyer,
        marketLocation: formData.marketLocation,
        qualityGrade: formData.qualityGrade,
        seasonYear: new Date(formData.saleDate).getFullYear(),
        harvestDate: formData.harvestDate,
        storageTime: parseInt(formData.storageTime),
        transportationCost,
        marketingCost,
        netRevenue,
      };

      const url = editingRevenue
        ? `/api/revenues/${editingRevenue.id}`
        : "/api/revenues";
      const method = editingRevenue ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(revenueData),
      });

      const data = await response.json();

      if (data.success) {
        fetchRevenues();
        resetForm();
        setIsAddDialogOpen(false);
        setEditingRevenue(null);
      }
    } catch (error) {
      console.error("Error saving revenue:", error);
    }
  };

  const handleEdit = (revenue: RevenueRecord) => {
    setEditingRevenue(revenue);
    setFormData({
      cropType: revenue.cropType,
      varietyName: revenue.varietyName,
      quantitySold: revenue.quantitySold.toString(),
      unit: revenue.unit,
      pricePerUnit: revenue.pricePerUnit.toString(),
      saleDate: revenue.saleDate,
      buyer: revenue.buyer,
      marketLocation: revenue.marketLocation,
      qualityGrade: revenue.qualityGrade,
      harvestDate: revenue.harvestDate,
      storageTime: revenue.storageTime.toString(),
      transportationCost: revenue.transportationCost.toString(),
      marketingCost: revenue.marketingCost.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      try {
        const response = await fetch(`/api/revenues/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchRevenues();
        }
      } catch (error) {
        console.error("Error deleting revenue:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cropType: "",
      varietyName: "",
      quantitySold: "",
      unit: "kg",
      pricePerUnit: "",
      saleDate: new Date().toISOString().split("T")[0],
      buyer: "",
      marketLocation: "",
      qualityGrade: "A",
      harvestDate: "",
      storageTime: "0",
      transportationCost: "0",
      marketingCost: "0",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getQualityColor = (grade: string) => {
    switch (grade) {
      case "Premium":
        return "bg-purple-100 text-purple-800";
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-yellow-100 text-yellow-800";
      case "C":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "rising" || change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === "falling" || change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredRevenues = revenues.filter((revenue) => {
    const matchesSearch =
      revenue.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.varietyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.buyer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesQuality =
      !filterQuality ||
      filterQuality === "all" ||
      revenue.qualityGrade === filterQuality;

    return matchesSearch && matchesQuality;
  });

  const totalRevenue = filteredRevenues.reduce(
    (sum, revenue) => sum + revenue.totalRevenue,
    0,
  );
  const totalNetRevenue = filteredRevenues.reduce(
    (sum, revenue) => sum + revenue.netRevenue,
    0,
  );
  const avgPricePerUnit =
    filteredRevenues.length > 0
      ? filteredRevenues.reduce(
          (sum, revenue) => sum + revenue.pricePerUnit,
          0,
        ) / filteredRevenues.length
      : 0;

  const cropTotals = filteredRevenues.reduce(
    (acc, revenue) => {
      acc[revenue.cropType] =
        (acc[revenue.cropType] || 0) + revenue.totalRevenue;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليل الإيرادات</h1>
          <p className="text-gray-600">
            تتبع المبيعات وتحليل الأرباح من المحاصيل
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة بيع جديد
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle>
                {editingRevenue ? "تعديل سجل البيع" : "إضافة بيع جديد"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType">نوع المحصول</Label>
                  <Select
                    value={formData.cropType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cropType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحصول" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes.map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="varietyName">اسم الصنف</Label>
                  <Input
                    id="varietyName"
                    value={formData.varietyName}
                    onChange={(e) =>
                      setFormData({ ...formData, varietyName: e.target.value })
                    }
                    placeholder="مثال: صنف محلي"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantitySold">الكمية المباعة</Label>
                  <Input
                    id="quantitySold"
                    type="number"
                    step="0.01"
                    value={formData.quantitySold}
                    onChange={(e) =>
                      setFormData({ ...formData, quantitySold: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">الوحدة</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">كيلوغرام</SelectItem>
                      <SelectItem value="ton">طن</SelectItem>
                      <SelectItem value="quintals">قنطار</SelectItem>
                      <SelectItem value="pieces">قطعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">السعر للوحدة (دينار)</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    value={formData.pricePerUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerUnit: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">درجة الجودة</Label>
                  <Select
                    value={formData.qualityGrade}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, qualityGrade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">ممتاز</SelectItem>
                      <SelectItem value="A">جيد جداً</SelectItem>
                      <SelectItem value="B">جيد</SelectItem>
                      <SelectItem value="C">مقبول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saleDate">تاريخ البيع</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, saleDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harvestDate">تاريخ الحصاد</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) =>
                      setFormData({ ...formData, harvestDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer">المشتري</Label>
                <Input
                  id="buyer"
                  value={formData.buyer}
                  onChange={(e) =>
                    setFormData({ ...formData, buyer: e.target.value })
                  }
                  placeholder="اسم المشتري أو الشركة"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketLocation">مكان السوق</Label>
                <Select
                  value={formData.marketLocation}
                  onValueChange={(value) =>
                    setFormData({ ...formData, marketLocation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مكان السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storageTime">مدة التخزين (أيام)</Label>
                  <Input
                    id="storageTime"
                    type="number"
                    value={formData.storageTime}
                    onChange={(e) =>
                      setFormData({ ...formData, storageTime: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportationCost">
                    تكلفة النقل (دينار)
                  </Label>
                  <Input
                    id="transportationCost"
                    type="number"
                    step="0.01"
                    value={formData.transportationCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transportationCost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketingCost">تكلفة التسويق (دينار)</Label>
                  <Input
                    id="marketingCost"
                    type="number"
                    step="0.01"
                    value={formData.marketingCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        marketingCost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  {editingRevenue ? "تحديث السجل" : "إضافة السجل"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingRevenue(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الإيرادات
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              من {filteredRevenues.length} عملية بيع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              صافي الإيرادات
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalNetRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">بعد خصم التكاليف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط السعر</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {avgPricePerUnit.toFixed(2)} د.ت
            </div>
            <p className="text-xs text-gray-600 mt-1">للوحدة الواحدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أفضل محصول</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">
              {Object.keys(cropTotals).length > 0
                ? Object.keys(cropTotals).reduce((a, b) =>
                    cropTotals[a] > cropTotals[b] ? a : b,
                  )
                : "لا يوجد"}
            </div>
            <p className="text-xs text-gray-600 mt-1">حسب الإيرادات</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أسعار السوق الحالية
          </CardTitle>
          <CardDescription>
            مراقبة أسعار المحاصيل واتجاهات السوق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketPrices.map((price, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{price.cropType}</h3>
                    {getTrendIcon(price.marketTrend, price.priceChange)}
                  </div>

                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {price.currentPrice.toFixed(2)} د.ت
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-sm ${price.priceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {price.priceChange >= 0 ? "+" : ""}
                      {price.priceChange}%
                    </span>
                    <span
                      className={`text-sm ${getDemandColor(price.demandLevel)}`}
                    >
                      طلب{" "}
                      {price.demandLevel === "high"
                        ? "عالي"
                        : price.demandLevel === "medium"
                          ? "متوسط"
                          : "منخفض"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {price.recommendations.map((rec, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        • {rec}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المحصول أو المشتري..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>المحصول</Label>
              <Select value={filterCrop} onValueChange={setFilterCrop}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المحاصيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحاصيل</SelectItem>
                  {cropTypes.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الموسم</Label>
              <Select value={filterSeason} onValueChange={setFilterSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المواسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواسم</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>درجة الجودة</Label>
              <Select value={filterQuality} onValueChange={setFilterQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الدرجات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الدرجات</SelectItem>
                  <SelectItem value="Premium">ممتاز</SelectItem>
                  <SelectItem value="A">جيد جداً</SelectItem>
                  <SelectItem value="B">جيد</SelectItem>
                  <SelectItem value="C">مقبول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>سجلات المبيعات</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRevenues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>لا توجد مبيعات مسجلة</p>
              <p className="text-sm">ابدأ بإضافة أول عملية بيع</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRevenues.map((revenue) => (
                <Card
                  key={revenue.id}
                  className="border-r-4 border-r-green-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">🌾</div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {revenue.cropType}
                            </h3>
                            <span className="text-gray-500">-</span>
                            <span className="text-gray-700">
                              {revenue.varietyName}
                            </span>
                            <Badge
                              className={getQualityColor(revenue.qualityGrade)}
                            >
                              {revenue.qualityGrade === "Premium"
                                ? "ممتاز"
                                : revenue.qualityGrade === "A"
                                  ? "جيد جداً"
                                  : revenue.qualityGrade === "B"
                                    ? "جيد"
                                    : "مقبول"}
                            </Badge>
                          </div>

                          <p className="text-gray-600 text-sm mt-1">
                            {revenue.quantitySold} {revenue.unit} ×{" "}
                            {revenue.pricePerUnit.toFixed(2)} د.ت
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(revenue.saleDate).toLocaleDateString(
                                "ar-TN",
                              )}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {revenue.marketLocation}
                            </span>

                            <span>المشتري: {revenue.buyer}</span>

                            {revenue.storageTime > 0 && (
                              <span>تخزين: {revenue.storageTime} يوم</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(revenue.totalRevenue)}
                          </div>
                          {(revenue.transportationCost > 0 ||
                            revenue.marketingCost > 0) && (
                            <div className="text-sm text-gray-600">
                              صافي: {formatCurrency(revenue.netRevenue)}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(revenue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(revenue.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalysis;
