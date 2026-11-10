import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { apiFetch } from '../lib/apiFetch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Users,
  Settings,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Server,
  Database,
  Globe,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Zap,
  Bell,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Crown,
  Star,
  Award,
  Target,
  PieChart,
  LineChart,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  WifiOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText,
  Folder,
  Archive,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Share,
  Flag,
  AlertCircle,
  Info,
  CheckSquare,
  Pause,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';

interface AdminPanelProps {
  adminId?: string;
  onUserAction?: (action: string, userId: string) => void;
  onSystemAction?: (action: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  adminId = 'admin_001',
  onUserAction,
  onSystemAction
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "farmer" });
  const [savingUser, setSavingUser] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const endpoints = ["/api/admin/overview", `/api/admin/users?page=${usersPage}&limit=50`, "/api/admin/system-metrics", "/api/admin/usage-analytics", "/api/admin/security-events", "/api/admin/activity-logs", "/api/admin/subscriptions"];
      const responses = await Promise.all(endpoints.map((url) => apiFetch(url)));
      const payloads = await Promise.all(responses.map(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) throw new Error(payload.message || payload.error || `Admin API failed (${response.status})`);
        return payload;
      }));
      const [dashboard, usersData, metricsData, analyticsData, securityData, activityData, subscriptionsData] = payloads;
      setDashboardData(dashboard.data || null);
      setUsers(Array.isArray(usersData.data) ? usersData.data : []);
      setUsersTotal(Number(usersData.pagination?.total ?? 0));
      setUsersTotalPages(Math.max(1, Number(usersData.pagination?.totalPages ?? 1)));
      setSystemMetrics(metricsData.data || null);
      setAnalytics(analyticsData.data || null);
      setSecurityEvents(Array.isArray(securityData.data) ? securityData.data : []);
      setActivityLogs(Array.isArray(activityData.data) ? activityData.data : []);
      setSubscriptions(Array.isArray(subscriptionsData.data) ? subscriptionsData.data : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin data";
      setLoadError(message);
      console.error("Admin data load failed:", message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to update user status");
      setUsers((previous) => previous.map((user) => user.id === userId ? payload.data : user));
      setSelectedUser((current) => current?.id === userId ? payload.data : current);
    } catch (error) { setLoadError(error instanceof Error ? error.message : "User update failed"); }
  };

  const handleUserRoleUpdate = async (userId: string, role: string) => {
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to update user role");
      setUsers((previous) => previous.map((user) => user.id === userId ? payload.data : user));
      setSelectedUser(payload.data);
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Role update failed"); }
  };

  const handleUserDelete = async (userId: string) => {
    if (!window.confirm(isArabic ? "هل أنت متأكد من حذف المستخدم نهائيًا؟ سيتم حذف حساب تسجيل الدخول أيضًا." : "Permanently delete this user and their authentication account?")) return;
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to delete user");
      setUsers((previous) => previous.filter((user) => user.id !== userId));
      setSelectedUser(null);
      await fetchDashboardData();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "User deletion failed"); }
  };

  const handleCreateUser = async () => {
    if (!newUser.email.trim() || newUser.password.length < 12) {
      setLoadError(isArabic ? "أدخل بريدًا صحيحًا وكلمة مرور من 12 حرفًا على الأقل." : "Enter a valid email and a password of at least 12 characters.");
      return;
    }
    try {
      setSavingUser(true);
      const response = await apiFetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to create user");
      setCreateUserOpen(false);
      setNewUser({ email: "", password: "", full_name: "", role: "farmer" });
      await fetchDashboardData();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "User creation failed"); }
    finally { setSavingUser(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'farmer': return 'bg-green-100 text-green-800';
      case 'agronomist': return 'bg-blue-100 text-blue-800';
      case 'trader': return 'bg-orange-100 text-orange-800';
      case 'veterinarian': return 'bg-teal-100 text-teal-800';
      case 'inspector': return 'bg-indigo-100 text-indigo-800';
      case 'government': return 'bg-red-100 text-red-800';
      case 'investor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return isArabic ? `${days} يوم، ${hours} ساعة، ${minutes} دقيقة` : `${days}d ${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-TN').format(num);
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">{isArabic ? 'جاري تحميل لوحة الإدارة...' : 'Loading admin panel...'}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isArabic ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription>
            {loadError || (isArabic ? 'فشل في تحميل بيانات الإدارة' : 'Failed to load admin data')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-800" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'لوحة تحكم مدير المنصة' : 'Admin Panel Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة المستخدمين والصلاحيات ومراقبة النظام' : 'User management, permissions and system monitoring'}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageSwitcher />
          <Button onClick={() => setCreateUserOpen(true)} size="sm"><UserPlus className="h-4 w-4 mr-2" />{isArabic ? "إضافة مستخدم" : "Add user"}</Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {loadError && dashboardData && (
        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{isArabic ? "تعذّر تنفيذ العملية" : "Operation failed"}</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'إجمالي المستخدمين' : 'Total Users'}</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(dashboardData.summary?.totalUsers || 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'مستخدمون نشطون' : 'Active Users'}</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.summary?.activeUsers == null ? "—" : formatNumber(dashboardData.summary.activeUsers)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'مستخدمون جدد' : 'New Users'}</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.summary?.newUsers == null ? "—" : formatNumber(dashboardData.summary.newUsers)}</p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'الإيرادات' : 'Revenue'}</p>
                <p className="text-xl font-bold text-orange-600">{dashboardData.summary?.totalRevenue == null ? "—" : formatCurrency(dashboardData.summary.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'إيرادات شهرية' : 'Monthly Recurring'}</p>
                <p className="text-xl font-bold text-teal-600">{dashboardData.summary?.monthlyRecurring == null ? "—" : formatCurrency(dashboardData.summary.monthlyRecurring)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'تذاكر الدعم' : 'Support Tickets'}</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.summary?.supportTickets == null ? "—" : formatNumber(dashboardData.summary.supportTickets)}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'وقت التشغيل' : 'System Uptime'}</p>
                <p className="text-sm font-bold text-indigo-600">{formatUptime(dashboardData.summary?.systemUptime || 0)}</p>
              </div>
              <Server className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'تنبيهات أمنية' : 'Security Alerts'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary?.securityAlerts == null ? "—" : formatNumber(dashboardData.summary.securityAlerts)}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              {isArabic ? 'صحة النظام' : 'System Health'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Cpu className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.cpuUsage == null ? "—" : `${systemMetrics.server.cpuUsage.toFixed(1)}%`}</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام المعالج' : 'CPU Usage'}</p>
                <Progress value={systemMetrics.server?.cpuUsage ?? 0} className="w-full mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <MemoryStick className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.memoryUsage == null ? "—" : `${systemMetrics.server.memoryUsage.toFixed(1)}%`}</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام الذاكرة' : 'Memory Usage'}</p>
                <Progress value={systemMetrics.server?.memoryUsage ?? 0} className="w-full mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.diskUsage == null ? "—" : `${systemMetrics.server.diskUsage.toFixed(1)}%`}</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام القرص' : 'Disk Usage'}</p>
                <Progress value={systemMetrics.server?.diskUsage ?? 0} className="w-full mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                  <Zap className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.responseTime || 0}ms</p>
                <p className="text-xs text-gray-600">{isArabic ? 'زمن الاستجابة' : 'Response Time'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">{isArabic ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="users">{isArabic ? 'المستخدمون' : 'Users'}</TabsTrigger>
          <TabsTrigger value="system">{isArabic ? 'النظام' : 'System'}</TabsTrigger>
          <TabsTrigger value="security">{isArabic ? 'الأمان' : 'Security'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="subscriptions">{isArabic ? 'الاشتراكات' : 'Subscriptions'}</TabsTrigger>
          <TabsTrigger value="activity">{isArabic ? 'الأنشطة' : 'Activity'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {isArabic ? 'المستخدمون الجدد' : 'Recent Users'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {dashboardData.recentUsers?.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{isArabic ? (user.full_name_ar || user.full_name || user.email) : (user.full_name || user.email)}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getRoleColor(user.role)}>
                                {isArabic ? user.roleArabic : user.role}
                              </Badge>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </p>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-3 w-3 mr-1" />
                            {isArabic ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  {isArabic ? 'الأنشطة الأخيرة' : 'Recent Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {dashboardData.recentActivity?.slice(0, 8).map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-3 rtl:space-x-reverse p-3 border rounded-lg">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.status === 'success' ? 'bg-green-100' : 
                          activity.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {activity.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                           activity.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" /> :
                           <AlertCircle className="h-4 w-4 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{isArabic ? activity.actionArabic : activity.action}</h4>
                          <p className="text-xs text-gray-600">{isArabic ? activity.userNameArabic : activity.userName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Security Alerts */}
          {dashboardData.securityAlerts?.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <Shield className="h-5 w-5 mr-2" />
                  {isArabic ? 'تنبيهات أمنية نشطة' : 'Active Security Alerts'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.securityAlerts.map((alert: any) => (
                    <Alert key={alert.id} className="border-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{isArabic ? alert.typeArabic : alert.type}</AlertTitle>
                      <AlertDescription className="flex items-center justify-between">
                        <span>{isArabic ? alert.descriptionArabic : alert.description}</span>
                        <div className="flex space-x-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => setSelectedEvent(alert)}>
                            {isArabic ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في المستخدمين...' : 'Search users...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الدور' : 'Role'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الأدوار' : 'All Roles'}</SelectItem>
                  <SelectItem value="farmer">{isArabic ? 'فلاح' : 'Farmer'}</SelectItem>
                  <SelectItem value="agronomist">{isArabic ? 'خبير زراعي' : 'Agronomist'}</SelectItem>
                  <SelectItem value="trader">{isArabic ? 'تاجر' : 'Trader'}</SelectItem>
                  <SelectItem value="veterinarian">{isArabic ? 'طبيب بيطري' : 'Veterinarian'}</SelectItem>
                  <SelectItem value="admin">{isArabic ? 'مدير' : 'Admin'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="active">{isArabic ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{isArabic ? 'غير نشط' : 'Inactive'}</SelectItem>
                  <SelectItem value="suspended">{isArabic ? 'موقوف' : 'Suspended'}</SelectItem>
                  <SelectItem value="pending">{isArabic ? 'معلق' : 'Pending'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {isArabic ? 'المستخدم' : 'User'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {isArabic ? 'الدور' : 'Role'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {isArabic ? 'الحالة' : 'Status'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {isArabic ? 'آخر دخول' : 'Last Login'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {isArabic ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{isArabic ? "لا توجد سجلات مستخدمين متاحة في قاعدة البيانات." : "No user records are available in the database."}</td></tr>
                    ) : users
                      .filter(user => {
                        const matchesSearch = !searchQuery || 
                          (user.firstName || user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.firstNameArabic.includes(searchQuery) ||
                          user.lastNameArabic.includes(searchQuery);
                        const matchesRole = filterRole === 'all' || user.role === filterRole;
                        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
                        return matchesSearch && matchesRole && matchesStatus;
                      })
                      .slice(0, 20)
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {isArabic ? `${user.firstNameArabic} ${user.lastNameArabic}` : `${user.firstName} ${user.lastName}`}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400">{user.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={getRoleColor(user.role)}>
                              {isArabic ? user.roleArabic : user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <div className="flex items-center mt-1 space-x-1">
                              {user.emailVerified && <CheckCircle className="h-3 w-3 text-green-500" />}
                              {user.twoFactorEnabled && <Shield className="h-3 w-3 text-blue-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.loginCount ?? "—"} {isArabic ? 'دخول' : 'logins'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                <Eye className="h-3 w-3 mr-1" />
                                {isArabic ? 'عرض' : 'View'}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3 mr-1" />
                                {isArabic ? 'تحرير' : 'Edit'}
                              </Button>
                              {user.status === 'active' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600"
                                  onClick={() => handleUserStatusUpdate(user.id, 'suspended')}
                                >
                                  <UserX className="h-3 w-3 mr-1" />
                                  {isArabic ? 'إيقاف' : 'Suspend'}
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600"
                                  onClick={() => handleUserStatusUpdate(user.id, 'active')}
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  {isArabic ? 'تفعيل' : 'Activate'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t p-3 text-sm">
                <span>{isArabic ? `إجمالي ${usersTotal} مستخدم` : `${usersTotal} users total`}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={usersPage <= 1 || loading} onClick={() => setUsersPage((page) => Math.max(1, page - 1))}>{isArabic ? "السابق" : "Previous"}</Button>
                  <span>{usersPage} / {usersTotalPages}</span>
                  <Button size="sm" variant="outline" disabled={usersPage >= usersTotalPages || loading} onClick={() => setUsersPage((page) => Math.min(usersTotalPages, page + 1))}>{isArabic ? "التالي" : "Next"}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {isArabic ? 'نمو المستخدمين' : 'User Growth'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.overview.totalUsers)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'إجمالي المستخدمين' : 'Total Users'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{analytics.overview.activeUsers == null ? "—" : formatNumber(analytics.overview.activeUsers)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'نشطون' : 'Active'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{analytics.overview.newUsers == null ? "—" : formatNumber(analytics.overview.newUsers)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'جدد هذا الشهر' : 'New This Month'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{isArabic ? 'معدل الاحتفاظ' : 'Retention Rate'}</span>
                        <span className="font-semibold">{analytics.overview.retentionRate == null ? "—" : `${analytics.overview.retentionRate}%`}</span>
                      </div>
                      <Progress value={analytics.overview.retentionRate ?? 0} className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    {isArabic ? 'تحليل الإيرادات' : 'Revenue Analytics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{analytics.subscriptions?.totalRevenue == null ? "—" : formatCurrency(analytics.subscriptions.totalRevenue)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{analytics.subscriptions?.monthlyRecurringRevenue == null ? "—" : formatCurrency(analytics.subscriptions.monthlyRecurringRevenue)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'إيرادات شهرية' : 'Monthly Recurring'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analytics.subscriptions?.subscriptionsByPlan || {}).map(([plan, data]: [string, any]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{plan}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{formatNumber(data.count)} {isArabic ? 'مستخدم' : 'users'}</span>
                            <span className="text-sm text-green-600">+{data.growth}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}><DialogContent><DialogHeader><DialogTitle>{isArabic ? "إضافة مستخدم" : "Create user"}</DialogTitle><DialogDescription>{isArabic ? "إنشاء حساب جديد في Supabase." : "Create a Supabase Auth account and public user record."}</DialogDescription></DialogHeader><div className="space-y-3"><Input placeholder={isArabic ? "الاسم الكامل" : "Full name"} value={newUser.full_name} onChange={(event) => setNewUser((current) => ({ ...current, full_name: event.target.value }))} /><Input type="email" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} /><Input type="password" placeholder={isArabic ? "كلمة المرور (12 حرفًا على الأقل)" : "Password (12+ characters)"} value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} /><Select value={newUser.role} onValueChange={(role) => setNewUser((current) => ({ ...current, role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["farmer", "agronomist", "trader", "veterinarian", "inspector", "admin", "government", "investor"].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select><Button className="w-full" onClick={handleCreateUser} disabled={savingUser}>{savingUser ? (isArabic ? "جارٍ الإنشاء..." : "Creating...") : (isArabic ? "إنشاء المستخدم" : "Create user")}</Button></div></DialogContent></Dialog>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? (selectedUser.full_name_ar || selectedUser.full_name || selectedUser.email) : (selectedUser.full_name || selectedUser.email)}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? 'تفاصيل المستخدم والنشاط' : 'User details and activity'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px]"><label className="text-sm font-medium">{isArabic ? "تغيير الدور" : "Change role"}</label>
                  <Select value={selectedUser.role} onValueChange={(value) => handleUserRoleUpdate(selectedUser.id, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["farmer", "agronomist", "trader", "veterinarian", "inspector", "admin", "government", "investor"].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
                </div>
                <Button variant="destructive" onClick={() => handleUserDelete(selectedUser.id)}><Trash2 className="h-4 w-4 mr-2" />{isArabic ? "حذف المستخدم" : "Delete user"}</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'الهاتف' : 'Phone'}</label>
                  <p className="text-sm">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'الدور' : 'Role'}</label>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {isArabic ? selectedUser.roleArabic : selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'الحالة' : 'Status'}</label>
                  <Badge className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{isArabic ? 'إحصائيات الاستخدام' : 'Usage Statistics'}</label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-600">{selectedUser.loginCount ?? "—"}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'عدد مرات الدخول' : 'Total Logins'}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-600">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-xs text-gray-600">{isArabic ? 'آخر دخول' : 'Last Login'}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-purple-600">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-xs text-gray-600">{isArabic ? 'تاريخ التسجيل' : 'Member Since'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{isArabic ? 'الحماية والأمان' : 'Security & Protection'}</label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    {selectedUser.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{isArabic ? 'البريد موثق' : 'Email Verified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUser.phoneVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{isArabic ? 'الهاتف موثق' : 'Phone Verified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUser.twoFactorEnabled ? (
                      <Shield className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{isArabic ? 'المصادقة الثنائية' : '2FA Enabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        {isArabic ? 'آخر تحديث' : 'Last updated'}: {new Date(dashboardData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default AdminPanel;
