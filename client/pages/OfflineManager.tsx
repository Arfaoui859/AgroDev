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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  Wifi,
  WifiOff,
  Download,
  Upload,
  Database,
  RefreshCw,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  HardDrive,
  Activity,
} from "lucide-react";
import { useOffline } from "../hooks/useOffline";
import { offlineStorage } from "../lib/offline-storage";

interface StorageStats {
  totalSize: number;
  usedSize: number;
  remainingSize: number;
  itemCount: number;
  oldestItem: Date | null;
  newestItem: Date | null;
}

interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: Date;
  attempts: number;
  status: "pending" | "syncing" | "failed" | "success";
}

const OfflineManager: React.FC = () => {
  const {
    isOnline,
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
    syncData,
  } = useOffline();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    maxCacheSize: 50,
    enableBackgroundSync: true,
    retainOfflineData: 7,
  });

  useEffect(() => {
    loadStorageStats();
    loadSyncQueue();
    loadSettings();
  }, []);

  const loadStorageStats = async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("خطأ في تحميل إحصائيات التخزين:", error);
    }
  };

  const loadSyncQueue = async () => {
    try {
      const queue = await offlineStorage.getSyncQueue();
      setSyncQueue(
        queue.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          status: item.synced ? "success" : "pending",
        })),
      );
    } catch (error) {
      console.error("خطأ في تحميل قائمة المزامنة:", error);
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("offline-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem("offline-settings", JSON.stringify(newSettings));
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await offlineStorage.clearStorage();
      await loadStorageStats();
      await loadSyncQueue();
    } catch (error) {
      console.error("خطأ في مسح الذاكرة المؤقتة:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      await loadSyncQueue();
    } catch (error) {
      console.error("خطأ في المزامنة:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const sizes = ["بايت", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "منذ ثواني";
    if (diffInSeconds < 3600)
      return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400)
      return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إدارة الوضع بدون إنترنت
          </h1>
          <p className="text-gray-600">تحكم في البيانات المحلية والمزامنة</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isOnline ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            {isOnline ? "متصل" : "غير متصل"}
          </Badge>
          <Badge
            variant={isOfflineMode ? "secondary" : "outline"}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            {isOfflineMode
              ? "الوضع بدون إنترنت مفعل"
              : "الوضع بدون إنترنت معطل"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="storage">التخزين</TabsTrigger>
          <TabsTrigger value="sync">المزامنة</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  حالة الاتصال
                </CardTitle>
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isOnline ? "متصل" : "غير متصل"}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {isOnline ? "جاهز للمزامنة" : "يعمل بدون إنترنت"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  البيانات المخزنة
                </CardTitle>
                <Database className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storageStats?.itemCount || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {storageStats ? formatBytes(storageStats.usedSize) : "0 بايت"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  قائمة المزامنة
                </CardTitle>
                <RefreshCw className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncQueue.filter((item) => item.status === "pending").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">في انتظار المزامنة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  المساحة المتاحة
                </CardTitle>
                <HardDrive className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {storageStats
                    ? Math.round(
                        (storageStats.remainingSize / storageStats.totalSize) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-600 mt-1">متبقي</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  حالة المزامنة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>تفعيل الوضع بدون إنترنت</span>
                  <Switch
                    checked={isOfflineMode}
                    onCheckedChange={
                      isOfflineMode ? disableOfflineMode : enableOfflineMode
                    }
                  />
                </div>
                {storageStats && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>استخدام التخزين</span>
                      <span>
                        {Math.round(
                          (storageStats.usedSize / storageStats.totalSize) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (storageStats.usedSize / storageStats.totalSize) * 100
                      }
                      className="h-2"
                    />
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleSyncNow}
                    disabled={!isOnline || isSyncing}
                    className="w-full"
                    variant="outline"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري المزامنة...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        مزامنة الآن
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClearCache}
                    disabled={isClearing}
                    variant="destructive"
                    className="w-full"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        جاري المسح...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        مسح الذاكرة المؤقتة
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات التخزين</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storageStats ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          المساحة المستخدمة
                        </span>
                        <span className="text-sm font-medium">
                          {formatBytes(storageStats.usedSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          المساحة الإجمالية
                        </span>
                        <span className="text-sm font-medium">
                          {formatBytes(storageStats.totalSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          عدد العناصر
                        </span>
                        <span className="text-sm font-medium">
                          {storageStats.itemCount}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {storageStats.oldestItem && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">أقدم بيانات</span>
                          <span>{formatTimeAgo(storageStats.oldestItem)}</span>
                        </div>
                      )}
                      {storageStats.newestItem && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">أحدث بيانات</span>
                          <span>{formatTimeAgo(storageStats.newestItem)}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">
                    جاري تحميل الإحصائيات...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة التخزين المحلي</CardTitle>
              <CardDescription>
                عرض وإدارة البيانات المخزنة محليًا
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storageStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {storageStats.itemCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        إجمالي العناصر
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatBytes(storageStats.usedSize)}
                      </div>
                      <div className="text-sm text-gray-600">مساحة مستخدمة</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatBytes(storageStats.remainingSize)}
                      </div>
                      <div className="text-sm text-gray-600">مساحة متبقية</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(
                          (storageStats.usedSize / storageStats.totalSize) *
                            100,
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        نسبة الاستخدام
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>استخدام التخزين</span>
                      <span>
                        {formatBytes(storageStats.usedSize)} /{" "}
                        {formatBytes(storageStats.totalSize)}
                      </span>
                    </div>
                    <Progress
                      value={
                        (storageStats.usedSize / storageStats.totalSize) * 100
                      }
                      className="h-3"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={loadStorageStats} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      تحديث الإحصائيات
                    </Button>
                    <Button
                      onClick={handleClearCache}
                      variant="destructive"
                      disabled={isClearing}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      مسح البيانات
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">جاري تحميل بيانات التخزين...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                قائمة انتظار المزامنة
              </CardTitle>
              <CardDescription>
                العمليات في انتظار المزامنة مع الخادم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    إجمالي العمليات: {syncQueue.length} | في الانتظار:{" "}
                    {
                      syncQueue.filter((item) => item.status === "pending")
                        .length
                    }{" "}
                    | مكتملة:{" "}
                    {
                      syncQueue.filter((item) => item.status === "success")
                        .length
                    }
                  </div>
                  <Button
                    onClick={handleSyncNow}
                    disabled={!isOnline || isSyncing}
                    size="sm"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1" />
                        مزامنة الآن
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {syncQueue.length > 0 ? (
                    syncQueue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                item.status === "success"
                                  ? "default"
                                  : item.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {item.status === "success" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : item.status === "failed" ? (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {item.status === "success"
                                ? "مكتمل"
                                : item.status === "failed"
                                  ? "فشل"
                                  : "في الانتظار"}
                            </Badge>
                            <span className="font-medium">{item.method}</span>
                            <span className="text-sm text-gray-600">
                              {item.endpoint}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(item.timestamp)} | المحاولات:{" "}
                            {item.attempts}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                      <p className="text-gray-500">
                        لا توجد عمليات في انتظار المزامنة
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الوضع بدون إنترنت
              </CardTitle>
              <CardDescription>تخصيص سلوك التخزين والمزامنة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">المزامنة التلقائية</Label>
                    <p className="text-sm text-gray-600">
                      مزامنة البيانات تلقائيًا عند توفر الاتصال
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) =>
                      saveSettings({ ...settings, autoSync: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">المزامنة في الخلفية</Label>
                    <p className="text-sm text-gray-600">
                      تمكين المزامنة في الخلفية عند إغلاق التطبيق
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableBackgroundSync}
                    onCheckedChange={(checked) =>
                      saveSettings({
                        ...settings,
                        enableBackgroundSync: checked,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>فترة المزامنة (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={settings.syncInterval}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        syncInterval: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="60"
                  />
                  <p className="text-sm text-gray-600">
                    كل {settings.syncInterval} دقيقة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>الحد الأقصى لحجم الذاكرة المؤقتة (MB)</Label>
                  <Input
                    type="number"
                    value={settings.maxCacheSize}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        maxCacheSize: parseInt(e.target.value),
                      })
                    }
                    min="10"
                    max="500"
                  />
                  <p className="text-sm text-gray-600">
                    أقصى مساحة تخزين مسموحة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>فترة الاحتفاظ بالبيانات (بالأيام)</Label>
                  <Input
                    type="number"
                    value={settings.retainOfflineData}
                    onChange={(e) =>
                      saveSettings({
                        ...settings,
                        retainOfflineData: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="30"
                  />
                  <p className="text-sm text-gray-600">
                    حذف البيانات المحلية القديمة تلقائيًا
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    saveSettings({
                      autoSync: true,
                      syncInterval: 5,
                      maxCacheSize: 50,
                      enableBackgroundSync: true,
                      retainOfflineData: 7,
                    })
                  }
                  variant="outline"
                >
                  استعادة الإعدادات الافتراضية
                </Button>
                <Button onClick={loadStorageStats}>حفظ الإعدادات</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineManager;
