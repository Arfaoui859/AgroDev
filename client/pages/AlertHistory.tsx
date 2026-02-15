import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileText,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  X,
  Cloud,
  Bug,
  Droplets,
  TrendingUp,
  Sprout,
  Target,
  ChevronDown,
  RotateCcw,
  MoreVertical,
  Archive,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface AlertData {
  alertId: string;
  userId: string;
  cropId?: string;
  type:
    | "Irrigation"
    | "Disease"
    | "Weather"
    | "Market"
    | "Fertilizer"
    | "Pest"
    | "Harvest"
    | "Planting";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Unread" | "Seen" | "Resolved" | "Dismissed";
  createdAt: Date;
  scheduledFor?: Date;
  relatedData?: any;
  actionSuggestions: string[];
  urgencyScore: number;
}

const AlertHistory: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "all",
    priority: "all",
    status: "all",
    cropId: "all",
  });
  const [sortBy, setSortBy] = useState<"date" | "priority" | "urgency">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const alertIcons = {
    Weather: Cloud,
    Disease: Bug,
    Irrigation: Droplets,
    Market: TrendingUp,
    Fertilizer: Sprout,
    Pest: Bug,
    Harvest: CheckCircle,
    Planting: Target,
  };

  const priorityColors = {
    High: "destructive",
    Medium: "default",
    Low: "secondary",
  };

  const statusColors = {
    Unread: "destructive",
    Seen: "default",
    Resolved: "secondary",
    Dismissed: "outline",
  };

  const typeColors = {
    Weather: "bg-blue-100 text-blue-800",
    Disease: "bg-red-100 text-red-800",
    Irrigation: "bg-cyan-100 text-cyan-800",
    Market: "bg-green-100 text-green-800",
    Fertilizer: "bg-yellow-100 text-yellow-800",
    Pest: "bg-orange-100 text-orange-800",
    Harvest: "bg-purple-100 text-purple-800",
    Planting: "bg-emerald-100 text-emerald-800",
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/alerts/user/user-123?limit=1000");
      const data = await response.json();

      if (data.success) {
        const alertsWithDates = data.data.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          scheduledFor: alert.scheduledFor
            ? new Date(alert.scheduledFor)
            : undefined,
        }));
        setAlerts(alertsWithDates);
      }
    } catch (error) {
      console.error("فشل في جلب تاريخ التنبيهات:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((alert) => alert.createdAt >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((alert) => alert.createdAt <= toDate);
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((alert) => alert.type === filters.type);
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter(
        (alert) => alert.priority === filters.priority,
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((alert) => alert.status === filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "priority":
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case "urgency":
          aValue = a.urgencyScore;
          bValue = b.urgencyScore;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    setFilteredAlerts(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      "التاريخ",
      "العنوان",
      "النوع",
      "الأولوية",
      "الحالة",
      "النتيجة",
    ];
    const csvData = filteredAlerts.map((alert) => [
      alert.createdAt.toLocaleDateString("ar-EG"),
      alert.title,
      alert.type,
      alert.priority,
      alert.status,
      alert.urgencyScore.toFixed(2),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تاريخ_التنبيهات_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تاريخ التنبيهات</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .alert-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
          .high { border-color: #ef4444; background: #fef2f2; }
          .medium { border-color: #f59e0b; background: #fffbeb; }
          .low { border-color: #10b981; background: #f0fdf4; }
          .title { font-weight: bold; margin-bottom: 8px; }
          .date { font-size: 12px; color: #666; }
          .description { margin: 8px 0; }
          .badges { margin-top: 8px; }
          .badge { display: inline-block; padding: 2px 8px; margin-left: 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تاريخ التنبيهات الزراعية</h1>
          <p>التاريخ: ${new Date().toLocaleDateString("ar-EG")}</p>
          <p>عدد التنبيهات: ${filteredAlerts.length}</p>
        </div>
        ${filteredAlerts
          .map(
            (alert) => `
          <div class="alert-item ${alert.priority.toLowerCase()}">
            <div class="title">${alert.title}</div>
            <div class="date">${alert.createdAt.toLocaleDateString("ar-EG")} - ${alert.createdAt.toLocaleTimeString("ar-EG")}</div>
            <div class="description">${alert.description}</div>
            <div class="badges">
              <span class="badge">${alert.type}</span>
              <span class="badge">${alert.priority}</span>
              <span class="badge">${alert.status}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.alertId === alertId
              ? { ...alert, status: status as any }
              : alert,
          ),
        );
      }
    } catch (error) {
      console.error("فشل في تحديث حالة التنبيه:", error);
    }
  };

  const getStatsData = () => {
    const total = filteredAlerts.length;
    const unread = filteredAlerts.filter((a) => a.status === "Unread").length;
    const resolved = filteredAlerts.filter(
      (a) => a.status === "Resolved",
    ).length;
    const high = filteredAlerts.filter((a) => a.priority === "High").length;
    const avgUrgency =
      total > 0
        ? filteredAlerts.reduce((sum, a) => sum + a.urgencyScore, 0) / total
        : 0;

    return { total, unread, resolved, high, avgUrgency };
  };

  const getPaginatedAlerts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAlerts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, searchTerm, filters, sortBy, sortOrder]);

  const stats = getStatsData();
  const paginatedAlerts = getPaginatedAlerts();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            <RotateCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
                <ChevronDown className="h-4 w-4 mr-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileText className="h-4 w-4 ml-2" />
                تصدير إلى CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 ml-2" />
                طباعة PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h1 className="text-3xl font-bold">تاريخ التنبيهات</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">
              إجمالي التنبيهات
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.unread}
            </div>
            <div className="text-sm text-muted-foreground">غير مقروءة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.resolved}
            </div>
            <div className="text-sm text-muted-foreground">محلولة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.high}
            </div>
            <div className="text-sm text-muted-foreground">عالية الأولوية</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(stats.avgUrgency * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">متوسط الإلحاح</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label className="text-right block mb-2">البحث في التنبيهات</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث في العناوين والأوصاف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <Label className="text-right block mb-1">من تاريخ</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-right block mb-1">إلى تاريخ</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-right block mb-1">النوع</Label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 text-sm text-right"
              >
                <option value="all">ج��يع الأنواع</option>
                <option value="Weather">طقس</option>
                <option value="Disease">أمراض</option>
                <option value="Irrigation">ري</option>
                <option value="Market">سوق</option>
                <option value="Fertilizer">تسميد</option>
                <option value="Pest">آفات</option>
                <option value="Harvest">حصاد</option>
                <option value="Planting">زراعة</option>
              </select>
            </div>
            <div>
              <Label className="text-right block mb-1">الأولوية</Label>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 text-sm text-right"
              >
                <option value="all">جميع الأولويات</option>
                <option value="High">عالية</option>
                <option value="Medium">متوسطة</option>
                <option value="Low">منخفضة</option>
              </select>
            </div>
            <div>
              <Label className="text-right block mb-1">الحالة</Label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 text-sm text-right"
              >
                <option value="all">جميع الحالات</option>
                <option value="Unread">غير مقروءة</option>
                <option value="Seen">مقروءة</option>
                <option value="Resolved">محلولة</option>
                <option value="Dismissed">مرفوضة</option>
              </select>
            </div>
            <div>
              <Label className="text-right block mb-1">ترتيب حسب</Label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 border rounded px-2 py-2 text-sm text-right"
                >
                  <option value="date">التاريخ</option>
                  <option value="priority">الأولوية</option>
                  <option value="urgency">الإلحاح</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="px-2"
                >
                  {sortOrder === "desc" ? "↓" : "↑"}
                </Button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({
                  dateFrom: "",
                  dateTo: "",
                  type: "all",
                  priority: "all",
                  status: "all",
                  cropId: "all",
                });
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4 ml-2" />
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              عرض {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} من{" "}
              {filteredAlerts.length} تنبيه
            </div>
            <CardTitle>قائمة التنبيهات</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : paginatedAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">لا توجد تنبيهات</h3>
              <p className="text-muted-foreground">
                لا توجد تنبيهات تطابق معايير البحث والفلترة المحددة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAlerts.map((alert, index) => {
                const IconComponent = alertIcons[alert.type] || AlertTriangle;

                return (
                  <div key={alert.alertId}>
                    <div
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                        alert.status === "Unread"
                          ? "bg-red-50 border-red-200"
                          : alert.status === "Resolved"
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {alert.status === "Unread" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAlertStatus(alert.alertId, "Seen");
                                  }}
                                >
                                  <Eye className="h-4 w-4 ml-2" />
                                  تحديد كمقروء
                                </DropdownMenuItem>
                              )}
                              {alert.status !== "Resolved" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAlertStatus(
                                      alert.alertId,
                                      "Resolved",
                                    );
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  تحديد كمحلول
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAlertStatus(alert.alertId, "Dismissed");
                                }}
                              >
                                <Archive className="h-4 w-4 ml-2" />
                                أرشفة
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[alert.type]}`}
                              >
                                {alert.type === "Weather" && "طقس"}
                                {alert.type === "Disease" && "أمراض"}
                                {alert.type === "Irrigation" && "ري"}
                                {alert.type === "Market" && "سوق"}
                                {alert.type === "Fertilizer" && "تسميد"}
                                {alert.type === "Pest" && "آفات"}
                                {alert.type === "Harvest" && "حصاد"}
                                {alert.type === "Planting" && "زراعة"}
                              </span>
                              <Badge
                                variant={statusColors[alert.status] as any}
                                className="text-xs"
                              >
                                {alert.status === "Unread" && "غير مقروء"}
                                {alert.status === "Seen" && "مقروء"}
                                {alert.status === "Resolved" && "محلول"}
                                {alert.status === "Dismissed" && "مؤرشف"}
                              </Badge>
                              <Badge
                                variant={priorityColors[alert.priority] as any}
                                className="text-xs"
                              >
                                {alert.priority === "High" && "عالية"}
                                {alert.priority === "Medium" && "متوسطة"}
                                {alert.priority === "Low" && "منخفضة"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {alert.createdAt.toLocaleDateString("ar-EG")} -{" "}
                                {alert.createdAt.toLocaleTimeString("ar-EG", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <IconComponent
                                className={`h-5 w-5 ${
                                  alert.priority === "High"
                                    ? "text-red-600"
                                    : alert.priority === "Medium"
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              />
                            </div>
                          </div>

                          <h4 className="font-semibold text-sm mb-1 text-right leading-tight">
                            {alert.title}
                          </h4>

                          <p className="text-xs text-muted-foreground text-right leading-relaxed line-clamp-2 mb-2">
                            {alert.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAlert(alert);
                                  setShowDetailModal(true);
                                }}
                              >
                                <ExternalLink className="h-3 w-3 ml-1" />
                                تفاصيل
                              </Button>
                            </div>

                            {alert.urgencyScore > 0.8 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-red-600 font-medium">
                                  عاجل جداً
                                </span>
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              درجة الإلحاح:{" "}
                              {(alert.urgencyScore * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < paginatedAlerts.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          dir="rtl"
        >
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right flex items-center gap-2">
                  {React.createElement(
                    alertIcons[selectedAlert.type] || AlertTriangle,
                    { className: "h-5 w-5" },
                  )}
                  {selectedAlert.title}
                </DialogTitle>
                <DialogDescription className="text-right">
                  تفاصيل التنبيه وإجراءات العمل المقترحة
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Alert Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(selectedAlert.urgencyScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          درجة الإلحاح
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          تاريخ الإنشاء
                        </div>
                        <div className="font-semibold">
                          {selectedAlert.createdAt.toLocaleDateString("ar-EG")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedAlert.createdAt.toLocaleTimeString("ar-EG")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2 text-right">
                    الوصف التفصيلي
                  </h4>
                  <p className="text-sm text-muted-foreground text-right leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Action Suggestions */}
                {selectedAlert.actionSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-right">
                      الإجراءات المقترحة
                    </h4>
                    <div className="space-y-2">
                      {selectedAlert.actionSuggestions.map(
                        (suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                          >
                            <div className="text-right flex-1">
                              <span className="text-sm">{suggestion}</span>
                            </div>
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Related Data */}
                {selectedAlert.relatedData && (
                  <div>
                    <h4 className="font-semibold mb-3 text-right">
                      البيانات المرتبطة
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-xs text-right" dir="ltr">
                        {JSON.stringify(selectedAlert.relatedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  {selectedAlert.status === "Unread" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateAlertStatus(selectedAlert.alertId, "Seen");
                        setShowDetailModal(false);
                      }}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      تحديد كمقروء
                    </Button>
                  )}
                  {selectedAlert.status !== "Resolved" && (
                    <Button
                      onClick={() => {
                        updateAlertStatus(selectedAlert.alertId, "Resolved");
                        setShowDetailModal(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تحديد كمحلول
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertHistory;
