import { DataProvenanceBanner } from "../components/DataProvenanceBanner";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const usersRequestSequence = React.useRef(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserName, setCreateUserName] = useState('');
  const [createUserRole, setCreateUserRole] = useState('farmer');
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [userCreateNotice, setUserCreateNotice] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Core administrator experience depends only on verified overview and
      // user-directory data. Optional modules must not hide the user list.
      const dashboardResponse = await apiFetch('/api/admin/overview');
      const dashboard = await dashboardResponse.json().catch(() => null);

      if (!dashboardResponse.ok) {
        throw new Error(`${dashboard?.code ? `${dashboard.code}: ` : ''}${dashboard?.message || `Overview unavailable (HTTP ${dashboardResponse.status})`}`);
      }
      setDashboardData(dashboard?.data || null);

      const optionalEndpoints = [
        ['/api/admin/system-metrics', setSystemMetrics],
        ['/api/admin/usage-analytics', setAnalytics],
        ['/api/admin/security-events', setSecurityEvents],
        ['/api/admin/activity-logs', setActivityLogs],
        ['/api/admin/subscriptions', setSubscriptions],
      ] as const;

      await Promise.all(optionalEndpoints.map(async ([url, setter]) => {
        try {
          const response = await apiFetch(url);
          const body = await response.json().catch(() => null);
          if (response.ok && body?.success) {
            setter(body.data);
          } else {
            setter(null as any);
          }
        } catch {
          setter(null as any);
        }
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin data is unavailable';
      setLoadError(message);
      setDashboardData(null);
      setUsers([]);
      setSystemMetrics(null);
      setAnalytics(null);
      setSecurityEvents([]);
      setActivityLogs([]);
      setSubscriptions([]);
      console.error('Error fetching admin data:', message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    const requestId = ++usersRequestSequence.current;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filterRole !== 'all') params.set('role', filterRole);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const response = await apiFetch(`/api/admin/users?${params.toString()}`);
      const body = await response.json().catch(() => null);
      if (requestId !== usersRequestSequence.current) return;
      if (!response.ok || !body?.success) throw new Error(body?.message || `User directory unavailable (HTTP ${response.status})`);
      setUsers(Array.isArray(body.data) ? body.data : []);
      setUserPagination(body.pagination || { page, pageSize: 50, total: (body.data || []).length, totalPages: 1 });
      setUserPage(page);
    } catch (error) {
      if (requestId === usersRequestSequence.current) setRoleChangeError(error instanceof Error ? error.message : 'User directory unavailable');
    } finally {
      if (requestId === usersRequestSequence.current) setUsersLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUsers(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery, filterRole, filterStatus]);

  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null);

  const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    setEditUserLoading(true);
    setRoleChangeError(null);
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(editingUser.id)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: editFullName }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || body?.code || `Profile update failed (HTTP ${response.status})`);
      if (selectedUser?.id === editingUser.id) setSelectedUser({ ...selectedUser, fullName: editFullName, firstName: editFullName.split(/\s+/)[0], lastName: editFullName.split(/\s+/).slice(1).join(' '), firstNameArabic: editFullName.split(/\s+/)[0], lastNameArabic: editFullName.split(/\s+/).slice(1).join(' ') });
      setEditingUser(null);
      await loadUsers(userPage);
    } catch (error) {
      setRoleChangeError(error instanceof Error ? error.message : 'Profile update failed');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserLoading(true);
    setRoleChangeError(null);
    setUserCreateNotice(null);
    try {
      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createUserEmail, fullName: createUserName, role: createUserRole }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || body?.code || `User invitation failed (HTTP ${response.status})`);
      setCreateUserOpen(false);
      setCreateUserEmail('');
      setCreateUserName('');
      setCreateUserRole('farmer');
      setUserCreateNotice(isArabic ? 'تم إرسال دعوة إنشاء الحساب بنجاح.' : 'Account invitation sent successfully.');
      await loadUsers(1);
    } catch (error) {
      setRoleChangeError(error instanceof Error ? error.message : 'User invitation failed');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleRoleChange = async (user: any, nextRole: string) => {
    if (!nextRole || nextRole === user.role) return;
    const confirmed = window.confirm(
      isArabic
        ? `تأكيد تغيير صلاحية ${user.email} إلى ${nextRole}؟`
        : `Change ${user.email}'s role to ${nextRole}?`,
    );
    if (!confirmed) return;

    setRoleChangeError(null);
    setRoleChangeUserId(user.id);
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(user.id)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || `Role update failed (HTTP ${response.status})`);
      }
      await loadUsers(userPage);
    } catch (error) {
      setRoleChangeError(error instanceof Error ? error.message : 'Role update failed');
    } finally {
      setRoleChangeUserId(null);
    }
  };


  const handleAccountStatusChange = async (user: any, isActive: boolean) => {
    const confirmed = window.confirm(
      isArabic
        ? (isActive ? `تأكيد إعادة تفعيل الحساب ${user.email}؟` : `تأكيد إيقاف الحساب ${user.email}؟`)
        : (isActive ? `Reactivate ${user.email}?` : `Suspend ${user.email}?`),
    );
    if (!confirmed) return;

    setRoleChangeError(null);
    setRoleChangeUserId(user.id);
    try {
      const response = await apiFetch(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || `Account status update failed (HTTP ${response.status})`);
      }
      await loadUsers(userPage);
    } catch (error) {
      setRoleChangeError(error instanceof Error ? error.message : 'Account status update failed');
    } finally {
      setRoleChangeUserId(null);
    }
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
    const dataSourceUnavailable = loadError?.includes('DASHBOARD_DATA_SOURCE_NOT_CONNECTED');
    return (
      <div className="container mx-auto p-6 space-y-4" dir={isArabic ? 'rtl' : 'ltr'}>
        <Alert className={dataSourceUnavailable ? "border-amber-400 bg-amber-50" : "border-red-500 bg-red-50"}>
          {dataSourceUnavailable ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>
            {dataSourceUnavailable
              ? (isArabic ? 'تم الوصول إلى لوحة الإدارة، لكن البيانات غير مربوطة بعد' : 'Admin access granted; data source is not connected yet')
              : (isArabic ? 'تعذّر تحميل لوحة الإدارة' : 'Admin panel could not be loaded')}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{loadError || (isArabic ? 'بيانات الإدارة غير متاحة' : 'Admin data is unavailable')}</p>
            {dataSourceUnavailable && (
              <p>
                {isArabic
                  ? 'تسجيل دخولك وصلاحية Admin منفصلان عن بيانات الإحصائيات. لن نعرض أرقاماً تجريبية أو مستخدمين وهميين.'
                  : 'Your administrator sign-in is separate from live dashboard data. AgroGrowth will not display fabricated metrics or user records.'}
              </p>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      <DataProvenanceBanner className="mb-4" />
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
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

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
                <p className="text-2xl font-bold text-green-600">{formatNumber(dashboardData.summary?.activeUsers || 0)}</p>
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
                <p className="text-2xl font-bold text-purple-600">{formatNumber(dashboardData.summary?.newUsers || 0)}</p>
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
                <p className="text-xl font-bold text-orange-600">{dashboardData.summary?.totalRevenue == null ? (isArabic ? 'غير متاح' : 'Not connected') : formatCurrency(dashboardData.summary.totalRevenue)}</p>
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
                <p className="text-xl font-bold text-teal-600">{dashboardData.summary?.monthlyRecurring == null ? (isArabic ? 'غير متاح' : 'Not connected') : formatCurrency(dashboardData.summary.monthlyRecurring)}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.summary?.supportTickets == null ? (isArabic ? 'غير متاح' : 'Not connected') : formatNumber(dashboardData.summary.supportTickets)}</p>
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
                <p className="text-sm font-bold text-indigo-600">{dashboardData.summary?.systemUptime == null ? (isArabic ? 'غير متاح' : 'Not connected') : formatUptime(dashboardData.summary.systemUptime)}</p>
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
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary?.securityAlerts == null ? (isArabic ? 'غير متاح' : 'Not connected') : formatNumber(dashboardData.summary.securityAlerts)}</p>
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
                <p className="text-2xl font-bold">{systemMetrics.server?.cpuUsage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام المعالج' : 'CPU Usage'}</p>
                <Progress value={systemMetrics.server?.cpuUsage || 0} className="w-full mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <MemoryStick className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.memoryUsage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام الذاكرة' : 'Memory Usage'}</p>
                <Progress value={systemMetrics.server?.memoryUsage || 0} className="w-full mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.server?.diskUsage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-600">{isArabic ? 'استخدام القرص' : 'Disk Usage'}</p>
                <Progress value={systemMetrics.server?.diskUsage || 0} className="w-full mt-2" />
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
                            <h4 className="font-medium">{isArabic ? `${user.firstNameArabic} ${user.lastNameArabic}` : `${user.firstName} ${user.lastName}`}</h4>
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
                            {user.createdAt && Number.isFinite(Date.parse(user.createdAt)) ? new Date(user.createdAt).toLocaleDateString() : (isArabic ? 'غير متاح' : 'N/A')}
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
          {roleChangeError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{roleChangeError}</AlertDescription>
            </Alert>
          )}
          {userCreateNotice && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{userCreateNotice}</AlertDescription>
            </Alert>
          )}
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
                  <SelectItem value="inspector">{isArabic ? 'مراقب' : 'Inspector'}</SelectItem>
                  <SelectItem value="government">{isArabic ? 'مؤسسة حكومية' : 'Government'}</SelectItem>
                  <SelectItem value="investor">{isArabic ? 'مستثمر' : 'Investor'}</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setUserCreateNotice(null); setCreateUserOpen(true); }}>
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
                    {users.map((user) => (
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
                              {user.lastLogin && Number.isFinite(Date.parse(user.lastLogin))
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : (isArabic ? 'لم يسجل الدخول بعد' : 'Never logged in')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.loginCount ?? '—'} {isArabic ? 'دخول' : 'logins'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                <Eye className="h-3 w-3 mr-1" />
                                {isArabic ? 'عرض' : 'View'}
                              </Button>
                              <select
                                aria-label={isArabic ? 'تغيير دور المستخدم' : 'Change user role'}
                                className="h-9 max-w-36 rounded-md border bg-background px-2 text-xs"
                                value={user.role}
                                disabled={roleChangeUserId === user.id}
                                onChange={(event) => handleRoleChange(user, event.target.value)}
                              >
                                <option value="farmer">{isArabic ? 'فلاح' : 'Farmer'}</option>
                                <option value="agronomist">{isArabic ? 'خبير زراعي' : 'Agronomist'}</option>
                                <option value="trader">{isArabic ? 'تاجر' : 'Trader'}</option>
                                <option value="veterinarian">{isArabic ? 'طبيب بيطري' : 'Veterinarian'}</option>
                                <option value="inspector">{isArabic ? 'مراقب' : 'Inspector'}</option>
                                <option value="government">{isArabic ? 'مؤسسة حكومية' : 'Government'}</option>
                                <option value="investor">{isArabic ? 'مستثمر' : 'Investor'}</option>
                                <option value="admin">{isArabic ? 'مدير النظام' : 'Administrator'}</option>
                              </select>
                              <Button size="sm" variant="outline" onClick={() => { setEditingUser(user); setEditFullName(user.fullName || ''); }}>
                                <Edit className="h-3 w-3 mr-1" />
                                {isArabic ? 'تحرير' : 'Edit'}
                              </Button>
                              {user.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  disabled={roleChangeUserId === user.id}
                                  onClick={() => handleAccountStatusChange(user, false)}
                                >
                                  <UserX className="h-3 w-3 mr-1" />
                                  {isArabic ? 'إيقاف' : 'Suspend'}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  disabled={roleChangeUserId === user.id}
                                  onClick={() => handleAccountStatusChange(user, true)}
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {isArabic
                    ? `عرض ${users.length} من أصل ${userPagination.total} مستخدم`
                    : `Showing ${users.length} of ${userPagination.total} users`}
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={usersLoading || userPage <= 1} onClick={() => loadUsers(userPage - 1)}>
                    {isArabic ? 'السابق' : 'Previous'}
                  </Button>
                  <span className="text-sm tabular-nums">{userPage} / {Math.max(1, userPagination.totalPages)}</span>
                  <Button type="button" size="sm" variant="outline" disabled={usersLoading || userPage >= userPagination.totalPages} onClick={() => loadUsers(userPage + 1)}>
                    {isArabic ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
              {usersLoading && <p className="px-4 pb-3 text-xs text-muted-foreground">{isArabic ? 'جاري تحديث قائمة المستخدمين...' : 'Updating user directory...'}</p>}
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
                        <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.overview.activeUsers)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'نشطون' : 'Active'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.overview.newUsers)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'جدد هذا الشهر' : 'New This Month'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{isArabic ? 'معدل الاحتفاظ' : 'Retention Rate'}</span>
                        <span className="font-semibold">{analytics.overview.retentionRate}%</span>
                      </div>
                      <Progress value={analytics.overview.retentionRate} className="w-full" />
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
                        <p className="text-xl font-bold text-green-600">{formatCurrency(analytics.subscriptions.totalRevenue)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(analytics.subscriptions.monthlyRecurringRevenue)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'إيرادات شهرية' : 'Monthly Recurring'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(analytics.subscriptions.subscriptionsByPlan).map(([plan, data]: [string, any]) => (
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

        {/* Immutable administrator audit trail */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {isArabic ? 'سجل تدقيق الإدارة' : 'Administrator Audit Trail'}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? 'عمليات الإدارة المسجلة في قاعدة البيانات: تغيير الصلاحيات وحالة الحساب، مع هوية المنفّذ والهدف والتوقيت'
                  : 'Database-recorded role and account-status changes with actor, target and timestamp'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(activityLogs) || activityLogs.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {isArabic
                    ? 'لا توجد سجلات تدقيق متاحة. تأكد من تطبيق database/admin-role-management.sql.'
                    : 'No audit records are available. Confirm database/admin-role-management.sql has been applied.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-3 py-3">{isArabic ? 'العملية' : 'Action'}</th>
                        <th className="px-3 py-3">{isArabic ? 'المنفّذ' : 'Actor'}</th>
                        <th className="px-3 py-3">{isArabic ? 'المستخدم المستهدف' : 'Target user'}</th>
                        <th className="px-3 py-3">{isArabic ? 'قبل' : 'Before'}</th>
                        <th className="px-3 py-3">{isArabic ? 'بعد' : 'After'}</th>
                        <th className="px-3 py-3">{isArabic ? 'التاريخ' : 'Timestamp'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(activityLogs) ? activityLogs : []).map((log: any) => (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="px-3 py-3">
                            <Badge variant="outline">{log.action}</Badge>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">{log.actor_user_id}</td>
                          <td className="px-3 py-3 font-mono text-xs">{log.target_user_id}</td>
                          <td className="px-3 py-3">{String(log.before_data?.role ?? log.before_data?.full_name ?? (typeof log.before_data?.is_active === 'boolean' ? (log.before_data.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'موقوف' : 'Suspended')) : '—'))}</td>
                          <td className="px-3 py-3">{String(log.after_data?.role ?? log.after_data?.full_name ?? (typeof log.after_data?.is_active === 'boolean' ? (log.after_data.is_active ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'موقوف' : 'Suspended')) : '—'))}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open && !editUserLoading) setEditingUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تعديل بيانات المستخدم' : 'Edit user profile'}</DialogTitle>
            <DialogDescription>{editingUser?.email || ''}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-edit-user-name" className="text-sm font-medium">{isArabic ? 'الاسم الكامل' : 'Full name'}</label>
              <Input id="admin-edit-user-name" value={editFullName} onChange={(event) => setEditFullName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={editUserLoading}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
              <Button type="submit" disabled={editUserLoading}>{editUserLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ التغييرات' : 'Save changes')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إضافة مستخدم جديد' : 'Invite a new user'}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? 'سيتم إرسال دعوة عبر البريد الإلكتروني ليُكمل المستخدم إعداد حسابه بنفسه.'
                : 'An invitation email will be sent so the user can finish setting up their own account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-create-user-name" className="text-sm font-medium">{isArabic ? 'الاسم الكامل' : 'Full name'}</label>
              <Input id="admin-create-user-name" value={createUserName} onChange={(event) => setCreateUserName(event.target.value)} required maxLength={120} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="admin-create-user-email" className="text-sm font-medium">{isArabic ? 'البريد الإلكتروني' : 'Email address'}</label>
              <Input id="admin-create-user-email" type="email" value={createUserEmail} onChange={(event) => setCreateUserEmail(event.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <label htmlFor="admin-create-user-role" className="text-sm font-medium">{isArabic ? 'الدور' : 'Platform role'}</label>
              <select id="admin-create-user-role" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={createUserRole} onChange={(event) => setCreateUserRole(event.target.value)}>
                <option value="farmer">{isArabic ? 'فلاح' : 'Farmer'}</option>
                <option value="agronomist">{isArabic ? 'خبير زراعي' : 'Agronomist'}</option>
                <option value="trader">{isArabic ? 'تاجر' : 'Trader'}</option>
                <option value="veterinarian">{isArabic ? 'طبيب بيطري' : 'Veterinarian'}</option>
                <option value="inspector">{isArabic ? 'مراقب' : 'Inspector'}</option>
                <option value="government">{isArabic ? 'مؤسسة حكومية' : 'Government'}</option>
                <option value="investor">{isArabic ? 'مستثمر' : 'Investor'}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)} disabled={createUserLoading}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
              <Button type="submit" disabled={createUserLoading}>{createUserLoading ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : (isArabic ? 'إرسال الدعوة' : 'Send invitation')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? `${selectedUser.firstNameArabic} ${selectedUser.lastNameArabic}` : `${selectedUser.firstName} ${selectedUser.lastName}`}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? 'تفاصيل المستخدم والنشاط' : 'User details and activity'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{isArabic ? 'الهاتف' : 'Phone'}</label>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'غير مربوط بمصدر موثوق' : 'Not connected to a verified source'}</p>
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

              <div className="space-y-3">
                <label className="text-sm font-medium">{isArabic ? 'بيانات الحساب المسجّلة' : 'Recorded account data'}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? 'تاريخ إنشاء الحساب' : 'Account created'}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedUser.createdAt && Number.isFinite(Date.parse(selectedUser.createdAt))
                        ? new Date(selectedUser.createdAt).toLocaleString()
                        : (isArabic ? 'غير متاح' : 'Not available')}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? 'آخر تسجيل دخول مسجّل' : 'Last recorded sign-in'}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedUser.lastLogin && Number.isFinite(Date.parse(selectedUser.lastLogin))
                        ? new Date(selectedUser.lastLogin).toLocaleString()
                        : (isArabic ? 'لم يُسجّل' : 'Not recorded')}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? 'معرّف الحساب' : 'Account ID'}</p>
                    <p className="mt-1 break-all font-mono text-xs">{selectedUser.id}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? 'عدد مرات الدخول غير متاح حالياً لأن سجلّ جلسات الدخول غير مربوط بلوحة الإدارة.'
                    : 'Total login count is unavailable because sign-in session analytics are not connected to the admin panel.'}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">{isArabic ? 'حالة التحقق والأمان' : 'Verification & security status'}</label>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className={selectedUser.emailVerified ? 'border-green-500 text-green-700' : 'border-amber-500 text-amber-700'}>
                    {selectedUser.emailVerified
                      ? (isArabic ? 'البريد الإلكتروني موثّق' : 'Email verified')
                      : (isArabic ? 'البريد الإلكتروني غير موثّق' : 'Email not verified')}
                  </Badge>
                  <Badge variant="outline">
                    {isArabic ? 'الهاتف: غير مربوط' : 'Phone verification: not connected'}
                  </Badge>
                  <Badge variant="outline">
                    {isArabic ? 'المصادقة الثنائية: غير متاحة' : '2FA status: unavailable'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? 'حالة توثيق البريد مأخوذة من سجل المستخدم في قاعدة البيانات. لا يتم افتراض حالة الهاتف أو المصادقة الثنائية.'
                    : 'Email verification is read from the public user profile record. Phone verification and 2FA are not inferred when no verified source is connected.'}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        {isArabic ? 'حالة المصدر' : 'Data source status'}: {isArabic ? 'بيانات المستخدمين من قاعدة البيانات' : 'User data loaded from the database'}
      </div>
    </div>
  );
};

export default AdminPanel;
