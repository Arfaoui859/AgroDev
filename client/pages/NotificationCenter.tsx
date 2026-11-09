import React, { useState, useEffect, useCallback } from 'react';
import { DataProvenanceBanner } from "@/components/DataProvenanceBanner";
import { supabase } from "@/lib/supabase";
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Settings,
  Filter,
  Search,
  Archive,
  Trash2,
  X as MarkAsUnread,
  Check as MarkAsRead,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Phone,
  Globe,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CloudRain,
  Thermometer,
  Droplets,
  Leaf,
  Bug,
  ShieldAlert,
  Calendar,
  MapPin,
  Users,
  Brain,
  Target,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Radio,
  Satellite,
  Gauge,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  Server,
  Cpu,
  HardDrive,
  Monitor,
  Router,
  Radio as Sensor,
  Bluetooth,
  Rss,
  PlayCircle,
  PauseCircle,
  Square,
  RefreshCw,
  RotateCcw,
  FastForward,
  Rewind,
  SkipForward,
  SkipBack,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Download,
  Upload,
  Share2,
  Copy,
  Edit,
  Save,
  FileText,
  Image,
  Video,
  Music,
  Mic,
  Camera,
  Webcam,
  QrCode,
  Scan,
  Fingerprint,
  Shield,
  Lock,
  Unlock,
  Key,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Crown,
  Award,
  Star,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Link,
  Paperclip,
  Scissors,
  Highlighter,
  Pen,
  PenTool,
  Paintbrush,
  Palette,
  Pipette,
  Ruler,
  Square as SquareIcon,
  Circle,
  Triangle,
  Pentagon,
  Hexagon,
  Octagon,
  Diamond,
  Heart,
  Spade,
  Club
} from 'lucide-react';

// ============ TYPES & INTERFACES ============

interface IoTSensor {
  id: string;
  name: string;
  nameArabic: string;
  type: 'soil_moisture' | 'soil_ph' | 'temperature' | 'humidity' | 'light' | 'pressure' | 'wind' | 'rainfall';
  typeArabic: string;
  fieldId: string;
  fieldName: string;
  location: {
    lat: number;
    lng: number;
    description: string;
    descriptionArabic: string;
  };
  status: 'online' | 'offline' | 'warning' | 'error';
  statusArabic: string;
  batteryLevel: number;
  signalStrength: number;
  lastReading: {
    value: number;
    unit: string;
    timestamp: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  thresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  calibrationDate: string;
  manufacturer: string;
  model: string;
  installationDate: string;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  typeArabic: string;
  category: 'system' | 'weather' | 'crop' | 'market' | 'sensor' | 'security' | 'admin' | 'ai_prediction';
  categoryArabic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  priorityArabic: string;
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  data?: any;
  actionRequired: boolean;
  actions?: Array<{
    label: string;
    labelArabic: string;
    action: string;
    type: 'primary' | 'secondary' | 'danger';
  }>;
  channels: Array<'in_app' | 'push' | 'email' | 'sms' | 'whatsapp'>;
  source: {
    type: 'iot_sensor' | 'ai_model' | 'api' | 'user' | 'system';
    id: string;
    name: string;
  };
  targetUsers: string[];
  targetRoles: string[];
  targetRegions?: string[];
  timestamp: string;
  readAt?: string;
  archivedAt?: string;
  respondedAt?: string;
  response?: string;
  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;
  confidence?: number; // For AI predictions
  expiresAt?: string;
  metadata?: {
    relatedFieldId?: string;
    relatedCropId?: string;
    weatherConditions?: any;
    marketData?: any;
    sensorData?: any;
  };
}

interface NotificationRule {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  isActive: boolean;
  conditions: {
    sensorType?: string;
    thresholdValue?: number;
    operator?: 'greater_than' | 'less_than' | 'equals' | 'between';
    timeWindow?: number; // minutes
    fieldIds?: string[];
    cropTypes?: string[];
    weatherConditions?: string[];
    marketConditions?: any;
  };
  actions: {
    notificationLevel: 'low' | 'medium' | 'high' | 'critical';
    channels: Array<'in_app' | 'push' | 'email' | 'sms' | 'whatsapp'>;
    targetRoles: string[];
    autoActions?: Array<{
      type: 'irrigation' | 'alert_farmer' | 'contact_expert' | 'create_task';
      parameters: any;
    }>;
  };
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface NotificationPreferences {
  userId: string;
  categories: {
    [key: string]: {
      enabled: boolean;
      channels: Array<'in_app' | 'push' | 'email' | 'sms' | 'whatsapp'>;
      minPriority: 'low' | 'medium' | 'high' | 'critical';
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
    emergencyOnly: boolean;
  };
  frequency: {
    digestEnabled: boolean;
    digestTime: string; // HH:mm
    maxNotificationsPerHour: number;
    groupSimilar: boolean;
  };
  contacts: {
    email: string;
    phone: string;
    whatsapp?: string;
    alternateEmail?: string;
    emergencyContact?: string;
  };
  language: 'ar' | 'en';
  updatedAt: string;
}


// Sensor and notification values are loaded from authenticated persistence; no demo records are seeded.\n\n// ============ MAIN COMPONENT ============

export default function NotificationCenter() {
  const { isArabic } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sensors] = useState<IoTSensor[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const loadNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setNotifications([]);
      setLastUpdated(null);
      return;
    }
    const response = await fetch("/api/notifications?limit=100", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) {
      setNotifications([]);
      throw new Error(`Notification feed unavailable (HTTP ${response.status})`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    setNotifications(rows.map((raw: any): Notification => {
      const priority = raw.priority === "normal" ? "medium" : raw.priority || "medium";
      const category = raw.category === "agrogrowth_agent" ? "system" : raw.category || "system";
      const type = priority === "urgent" || priority === "critical" ? "critical" : priority === "high" ? "warning" : "info";
      const actionUrl = raw.action_url || undefined;
      return {
        id: String(raw.id),
        type,
        typeArabic: type === "critical" ? "حرج" : type === "warning" ? "تحذير" : "معلومات",
        category,
        categoryArabic: category === "system" ? "نظام" : category,
        priority,
        priorityArabic: priority === "high" ? "عالي" : priority === "low" ? "منخفض" : "متوسط",
        title: raw.title || "",
        titleArabic: raw.title || "",
        message: raw.message || "",
        messageArabic: raw.message || "",
        data: raw.metadata || {},
        actionRequired: Boolean(actionUrl),
        actions: actionUrl ? [{ label: "Open", labelArabic: "فتح", action: actionUrl, type: "primary" }] : [],
        channels: ["in_app"],
        source: { type: "system", id: raw.metadata?.agent_source || "agrogrowth", name: "AgroGrowth" },
        targetUsers: [],
        targetRoles: [],
        timestamp: raw.created_at || new Date().toISOString(),
        readAt: raw.read_at || undefined,
        archivedAt: raw.archived_at || undefined,
        isRead: Boolean(raw.read_at),
        isArchived: Boolean(raw.archived_at),
        isStarred: Boolean(raw.is_starred),
      };
    }));
    setLastUpdated(new Date().toISOString());
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        if (active) await loadNotifications();
      } catch (error) {
        console.error("Unable to refresh persisted notifications:", error);
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [loadNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const categoryMatch = filterCategory === 'all' || notification.category === filterCategory;
    const priorityMatch = filterPriority === 'all' || notification.priority === filterPriority;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'unread' && !notification.isRead) ||
      (filterStatus === 'read' && notification.isRead) ||
      (filterStatus === 'starred' && notification.isStarred);
    const searchMatch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.titleArabic.includes(searchQuery) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.messageArabic.includes(searchQuery);
    
    return categoryMatch && priorityMatch && statusMatch && searchMatch;
  });

  // Get icon for notification type
  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'critical') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (type === 'warning') return <AlertCircle className="h-5 w-5 text-orange-500" />;
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    
    switch (category) {
      case 'sensor': return <Sensor className="h-5 w-5 text-blue-500" />;
      case 'weather': return <CloudRain className="h-5 w-5 text-indigo-500" />;
      case 'crop': return <Leaf className="h-5 w-5 text-green-500" />;
      case 'market': return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'ai_prediction': return <Brain className="h-5 w-5 text-purple-500" />;
      case 'security': return <Shield className="h-5 w-5 text-red-500" />;
      case 'system': return <Server className="h-5 w-5 text-gray-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get sensor status icon
  const getSensorStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Radio className="h-4 w-4 text-gray-500" />;
    }
  };

  // Persist notification actions against the authenticated user's records.
  const persistNotificationRequest = async (path: string, method: string, body?: unknown) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sign in is required.");
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success !== true) throw new Error(payload.message || payload.code || `HTTP ${response.status}`);
    return payload;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await persistNotificationRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, "PATCH");
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
      ));
    } catch (error) { console.error("Could not mark notification read:", error); }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      await persistNotificationRequest(`/api/notifications/${encodeURIComponent(notificationId)}/unread`, "PATCH");
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: false, readAt: undefined } : notif
      ));
    } catch (error) { console.error("Could not mark notification unread:", error); }
  };

  const toggleStar = async (notificationId: string) => {
    try {
      await persistNotificationRequest(`/api/notifications/${encodeURIComponent(notificationId)}/star`, "PATCH");
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, isStarred: !notif.isStarred } : notif
      ));
    } catch (error) { console.error("Could not star notification:", error); }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      await persistNotificationRequest(`/api/notifications/${encodeURIComponent(notificationId)}/archive`, "PATCH");
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, isArchived: true, archivedAt: new Date().toISOString() } : notif
      ));
    } catch (error) { console.error("Could not archive notification:", error); }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await persistNotificationRequest(`/api/notifications/${encodeURIComponent(notificationId)}`, "DELETE");
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) { console.error("Could not delete notification:", error); }
  };

  const handleBulkAction = async (action: string) => {
    const actionMap: Record<string, string> = {
      mark_read: "read",
      mark_unread: "unread",
      archive: "archive",
      delete: "delete",
    };
    const serverAction = actionMap[action];
    if (!serverAction || !selectedNotifications.length) return;
    try {
      await persistNotificationRequest("/api/notifications/bulk", "PATCH", {
        action: serverAction,
        ids: selectedNotifications,
      });
      if (action === "delete") {
        setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
      } else if (action === "archive") {
        setNotifications(prev => prev.map(notif => selectedNotifications.includes(notif.id)
          ? { ...notif, isArchived: true, archivedAt: new Date().toISOString() } : notif));
      } else {
        const read = action === "mark_read";
        setNotifications(prev => prev.map(notif => selectedNotifications.includes(notif.id)
          ? { ...notif, isRead: read, readAt: read ? new Date().toISOString() : undefined } : notif));
      }
    } catch (error) {
      console.error("Bulk notification action failed:", error);
    } finally {
      setSelectedNotifications([]);
    }
  };

  // Get notification priority badge
  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[priority as keyof typeof variants] || 'secondary';
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 space-y-8">
      <DataProvenanceBanner />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="relative">
            <Bell className="h-8 w-8 text-blue-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              {isArabic ? 'مركز الإشعارات الذكي' : 'Smart Notification Center'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'مراقبة وإدارة جميع التنبيهات والإشعارات الزراعية' : 'Monitor and manage all agricultural alerts and notifications'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{isArabic ? "تحديث من قاعدة البيانات" : "Database-backed feed"}</span>
          <Button variant="outline" size="sm" onClick={() => void loadNotifications()}>
            <RefreshCw className="h-4 w-4 mr-2" />{isArabic ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>{isArabic ? "الإشعارات المعروضة محفوظة في قاعدة البيانات، وليست بيانات تجريبية." : "Displayed notifications are persisted database records, not demo data."}</span>
          </div>
          <span className="text-xs text-muted-foreground">{isArabic ? "آخر تحديث: " : "Last refresh: "}{lastUpdated ? new Date(lastUpdated).toLocaleString() : (isArabic ? "غير متوفر" : "Unavailable")}</span>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">{isArabic ? 'لوحة التحكم' : 'Dashboard'}</TabsTrigger>
          <TabsTrigger value="notifications">{isArabic ? 'الإشعارات' : 'Notifications'}</TabsTrigger>
          <TabsTrigger value="sensors">{isArabic ? 'الحساسات' : 'Sensors'}</TabsTrigger>
          <TabsTrigger value="rules">{isArabic ? 'القواعد' : 'Rules'}</TabsTrigger>
          <TabsTrigger value="settings">{isArabic ? 'ال��عدادات' : 'Settings'}</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notification Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <BarChart3 className="h-5 w-5" />
                  <span>{isArabic ? 'ملخص الإشعارات' : 'Notification Summary'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-lg font-bold text-red-600">{notifications.filter(n => n.type === 'critical').length}</p>
                    <p className="text-xs text-muted-foreground">{isArabic ? 'حرجة' : 'Critical'}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-lg font-bold text-orange-600">{notifications.filter(n => n.type === 'warning').length}</p>
                    <p className="text-xs text-muted-foreground">{isArabic ? 'تحذيرات' : 'Warnings'}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Info className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-lg font-bold text-blue-600">{notifications.filter(n => n.type === 'info').length}</p>
                    <p className="text-xs text-muted-foreground">{isArabic ? 'معلومات' : 'Info'}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-lg font-bold text-green-600">{notifications.filter(n => n.type === 'success').length}</p>
                    <p className="text-xs text-muted-foreground">{isArabic ? 'نجح' : 'Success'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" size="sm">
                  <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'إنشاء قاعدة جديدة' : 'Create New Rule'}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Send className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'إرسال إشعار' : 'Send Notification'}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'إعدادات الحساسات' : 'Sensor Settings'}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'تصدير التقارير' : 'Export Reports'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>{isArabic ? 'الإشعارات الحرجة الأخير��' : 'Recent Critical Notifications'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.filter(n => n.type === 'critical' || n.priority === 'critical').slice(0, 3).map((notification) => (
                  <Alert key={notification.id} className="border-red-200 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        {getNotificationIcon(notification.type, notification.category)}
                        <div>
                          <h4 className="font-medium">{isArabic ? notification.titleArabic : notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isArabic ? notification.messageArabic : notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Button size="sm" onClick={() => markAsRead(notification.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {notification.actions && notification.actions.length > 0 && (
                          <Button size="sm" variant="outline">
                            {isArabic ? notification.actions[0].labelArabic : notification.actions[0].label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isArabic ? 'البحث في الإشعارات...' : 'Search notifications...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={isArabic ? 'الفئة' : 'Category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isArabic ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                    <SelectItem value="sensor">{isArabic ? 'حساسات' : 'Sensors'}</SelectItem>
                    <SelectItem value="weather">{isArabic ? 'طقس' : 'Weather'}</SelectItem>
                    <SelectItem value="crop">{isArabic ? 'محاصيل' : 'Crops'}</SelectItem>
                    <SelectItem value="market">{isArabic ? 'سوق' : 'Market'}</SelectItem>
                    <SelectItem value="ai_prediction">{isArabic ? 'تنبؤ ذكي' : 'AI Prediction'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={isArabic ? 'الأولوية' : 'Priority'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isArabic ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
                    <SelectItem value="critical">{isArabic ? 'حرج' : 'Critical'}</SelectItem>
                    <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
                    <SelectItem value="medium">{isArabic ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="low">{isArabic ? 'منخفض' : 'Low'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</SelectItem>
                    <SelectItem value="unread">{isArabic ? 'غير مقروء' : 'Unread'}</SelectItem>
                    <SelectItem value="read">{isArabic ? 'مقروء' : 'Read'}</SelectItem>
                    <SelectItem value="starred">{isArabic ? 'مميز' : 'Starred'}</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="secondary">
                  {filteredNotifications.length} {isArabic ? 'إشعار' : 'notifications'}
                </Badge>
              </div>

              {/* Bulk Actions */}
              {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length} {isArabic ? 'محدد' : 'selected'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_read')}>
                    <MarkAsRead className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'تعليم كمقروء' : 'Mark Read'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_unread')}>
                    <MarkAsUnread className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'تعليم كغير مقروء' : 'Mark Unread'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                    <Archive className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'أرشفة' : 'Archive'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`cursor-pointer transition-all duration-200 hover:shadow-md ${!notification.isRead ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications(prev => [...prev, notification.id]);
                          } else {
                            setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                          <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {isArabic ? notification.titleArabic : notification.title}
                          </h4>
                          <Badge variant={getPriorityBadge(notification.priority) as any} className="text-xs">
                            {isArabic ? notification.priorityArabic : notification.priority}
                          </Badge>
                          {notification.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {notification.confidence}% {isArabic ? 'ثقة' : 'confidence'}
                            </Badge>
                          )}
                          {notification.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {isArabic ? notification.messageArabic : notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-muted-foreground">
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{isArabic ? notification.categoryArabic : notification.category}</span>
                          <span>•</span>
                          <span>{notification.source.name}</span>
                        </div>

                        {/* Action Buttons */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex space-x-2 rtl:space-x-reverse mt-3">
                            {notification.actions.map((action, index) => (
                              <Button key={index} size="sm" variant={action.type === 'primary' ? 'default' : 'outline'}>
                                {isArabic ? action.labelArabic : action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0 ml-4 rtl:mr-4 rtl:ml-0">
                      <Button size="sm" variant="ghost" onClick={() => toggleStar(notification.id)}>
                        <Star className={`h-3 w-3 ${notification.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)}>
                        {notification.isRead ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => archiveNotification(notification.id)}>
                        <Archive className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNotification(notification.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sensors Tab */}
        <TabsContent value="sensors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensors.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {isArabic ? "لا توجد حساسات فعلية مسجلة لهذا الحساب أو لم يتم ربط تدفق قراءاتها بعد. لن نعرض قياسات تجريبية." : "No real sensors are registered for this account or a reading stream is not connected. Demo readings are not shown."}
                </CardContent>
              </Card>
            )}
            {sensors.map((sensor) => (
              <Card key={sensor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{isArabic ? sensor.nameArabic : sensor.name}</CardTitle>
                      <CardDescription>{isArabic ? sensor.typeArabic : sensor.type}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getSensorStatusIcon(sensor.status)}
                      <Badge variant={sensor.status === 'online' ? 'default' : sensor.status === 'warning' ? 'secondary' : 'destructive'}>
                        {isArabic ? sensor.statusArabic : sensor.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Reading */}
                    <div className="text-center p-4 border rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-primary">
                        {sensor.lastReading.value.toFixed(1)} {sensor.lastReading.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'آخر قراءة' : 'Last Reading'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sensor.lastReading.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Status Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{isArabic ? 'البطارية' : 'Battery'}</span>
                          <span>{sensor.batteryLevel}%</span>
                        </div>
                        <Progress value={sensor.batteryLevel} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{isArabic ? 'الإشارة' : 'Signal'}</span>
                          <span>{sensor.signalStrength}%</span>
                        </div>
                        <Progress value={sensor.signalStrength} className="h-2" />
                      </div>
                    </div>

                    {/* Threshold Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{isArabic ? 'النطاق الأمثل' : 'Optimal Range'}</span>
                        <span>{sensor.thresholds.optimal.min} - {sensor.thresholds.optimal.max} {sensor.lastReading.unit}</span>
                      </div>
                      <div className="relative">
                        <Progress value={
                          ((sensor.lastReading.value - sensor.thresholds.min) / (sensor.thresholds.max - sensor.thresholds.min)) * 100
                        } className="h-3" />
                        <div className="absolute top-0 left-0 h-3 bg-green-200 rounded"
                             style={{
                               left: `${((sensor.thresholds.optimal.min - sensor.thresholds.min) / (sensor.thresholds.max - sensor.thresholds.min)) * 100}%`,
                               width: `${((sensor.thresholds.optimal.max - sensor.thresholds.optimal.min) / (sensor.thresholds.max - sensor.thresholds.min)) * 100}%`
                             }}>
                        </div>
                      </div>
                    </div>

                    {/* Location and Details */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <MapPin className="h-3 w-3" />
                        <span>{isArabic ? sensor.location.descriptionArabic : sensor.location.description}</span>
                      </div>
                      <div>
                        <span>{isArabic ? 'الطراز:' : 'Model:'} {sensor.manufacturer} {sensor.model}</span>
                      </div>
                      <div>
                        <span>{isArabic ? 'آخر معايرة:' : 'Last Calibration:'} {new Date(sensor.calibrationDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button size="sm" variant="outline" className="flex-1">
                        <LineChart className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                        {isArabic ? 'البيانات' : 'Data'}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                        {isArabic ? 'إعدادات' : 'Settings'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isArabic ? 'قواعد الإشعارات التلقائية' : 'Notification Rules'}</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'إنشاء قاعدة' : 'Create Rule'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Soil Moisture Alert',
                    nameArabic: 'تنبيه رطوبة التربة',
                    description: 'Alert when soil moisture drops below 25%',
                    descriptionArabic: 'تنبيه عند انخفاض رطوبة التربة أقل من 25%',
                    isActive: true,
                    triggerCount: 12,
                    lastTriggered: '2024-01-20 14:30'
                  },
                  {
                    name: 'Weather Warning',
                    nameArabic: 'تحذير الطقس',
                    description: 'Alert for severe weather conditions',
                    descriptionArabic: 'تنبيه لظروف الطقس القاسية',
                    isActive: true,
                    triggerCount: 5,
                    lastTriggered: '2024-01-19 08:15'
                  },
                  {
                    name: 'Price Drop Alert',
                    nameArabic: 'تنبيه انخفاض السعر',
                    description: 'Alert when crop price drops by 10%',
                    descriptionArabic: 'تنبيه عند انخفاض سعر المحصول بنسبة 10%',
                    isActive: false,
                    triggerCount: 3,
                    lastTriggered: '2024-01-18 16:45'
                  }
                ].map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <Switch checked={rule.isActive} />
                      <div>
                        <h4 className="font-medium">{isArabic ? rule.nameArabic : rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{isArabic ? rule.descriptionArabic : rule.description}</p>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-xs text-muted-foreground">
                          <span>{isArabic ? 'مرات التفعيل:' : 'Triggered:'} {rule.triggerCount}</span>
                          <span>•</span>
                          <span>{isArabic ? 'آخر مرة:' : 'Last:'} {rule.lastTriggered}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'تفضيلات الإشعارات' : 'Notification Preferences'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { category: 'sensor', nameArabic: 'حساسات', name: 'Sensors' },
                  { category: 'weather', nameArabic: 'طقس', name: 'Weather' },
                  { category: 'crop', nameArabic: 'محاصيل', name: 'Crops' },
                  { category: 'market', nameArabic: 'سوق', name: 'Market' },
                  { category: 'ai_prediction', nameArabic: 'تنبؤ ذكي', name: 'AI Predictions' }
                ].map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getNotificationIcon('info', category.category)}
                      <span>{isArabic ? category.nameArabic : category.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                          <Bell className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                          <Mail className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                          <Phone className="h-3 w-3" />
                        </Button>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'ساعات الهدوء' : 'Quiet Hours'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch defaultChecked />
                  <Label>{isArabic ? 'تفعيل ساعات الهدوء' : 'Enable quiet hours'}</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? 'البداية' : 'Start Time'}</Label>
                    <Input type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? 'النهاية' : 'End Time'}</Label>
                    <Input type="time" defaultValue="07:00" />
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch />
                  <Label className="text-sm">{isArabic ? 'السماح بالإشعارات الحرجة فقط' : 'Critical notifications only'}</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input type="email" defaultValue="ahmed@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input type="tel" defaultValue="+962 79 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'واتساب (اختياري)' : 'WhatsApp (Optional)'}</Label>
                  <Input type="tel" placeholder="+962 79 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'جهة اتصال طوارئ' : 'Emergency Contact'}</Label>
                  <Input type="tel" placeholder="+962 79 999 8888" />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button>
                  <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
