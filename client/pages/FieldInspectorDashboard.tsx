import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Calendar,
  MapPin,
  Camera,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Eye,
  Edit,
  Plus,
  Upload,
  Download,
  Printer,
  Search,
  Filter,
  Settings,
  User,
  Phone,
  Mail,
  Navigation,
  Compass,
  Target,
  Timer,
  Activity,
  BarChart3,
  TrendingUp,
  Award,
  Shield,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckSquare,
  AlertCircle,
  Image,
  Video,
  Mic,
  Paperclip,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Share,
  ExternalLink,
  Zap,
  Users,
  Building,
  Leaf,
  Sprout,
  TreePine,
  Beaker,
  Microscope,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain
} from 'lucide-react';

interface FieldInspectorDashboardProps {
  inspectorId?: string;
  onVisitSchedule?: (visitData: any) => void;
  onNoteCreate?: (noteData: any) => void;
  onReportGenerate?: (reportData: any) => void;
}

const FieldInspectorDashboard: React.FC<FieldInspectorDashboardProps> = ({
  inspectorId = 'inspector_001',
  onVisitSchedule,
  onNoteCreate,
  onReportGenerate
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newVisitDialog, setNewVisitDialog] = useState(false);
  const [newNoteDialog, setNewNoteDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardResponse,
        visitsResponse,
        notesResponse,
        assessmentsResponse,
        reportsResponse,
        trackingResponse
      ] = await Promise.all([
        fetch('/api/field-inspector/overview'),
        fetch('/api/field-inspector/visits'),
        fetch('/api/field-inspector/notes'),
        fetch('/api/field-inspector/quality-assessments'),
        fetch('/api/field-inspector/reports'),
        fetch('/api/field-inspector/recommendation-tracking')
      ]);

      const [
        dashboard,
        visitsData,
        notesData,
        assessmentsData,
        reportsData,
        trackingData
      ] = await Promise.all([
        dashboardResponse.json(),
        visitsResponse.json(),
        notesResponse.json(),
        assessmentsResponse.json(),
        reportsResponse.json(),
        trackingResponse.json()
      ]);

      setDashboardData(dashboard.data);
      setVisits(visitsData.data);
      setNotes(notesData.data);
      setAssessments(assessmentsData.data);
      setReports(reportsData.data);
      setTracking(trackingData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitStatusUpdate = async (visitId: string, newStatus: string) => {
    try {
      setVisits(prev => 
        prev.map(visit => 
          visit.id === visitId ? { ...visit, status: newStatus } : visit
        )
      );
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'postponed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'info': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString(isArabic ? 'ar-TN' : 'en-TN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">{isArabic ? 'جاري تحميل بيانات المراقب...' : 'Loading inspector data...'}</span>
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
            {isArabic ? 'فشل في تحميل بيانات المراقب' : 'Failed to load inspector data'}
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
          <h1 className="text-3xl font-bold text-blue-800" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'لوحة تحكم مراقب الحقول' : 'Field Inspector Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'جدولة الزيارات وتسجيل الملاحظات الميدانية' : 'Visit scheduling and field notes management'}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="text-sm"
          >
            {isArabic ? 'English' : 'العربية'}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Inspector Profile Quick View */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{isArabic ? dashboardData.profile.nameArabic : dashboardData.profile.name}</h2>
              <p className="text-gray-600">{isArabic ? 'مراقب حقول مرخص' : 'Licensed Field Inspector'}</p>
              <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-1 text-blue-600" />
                  <span>{dashboardData.profile.licenseNumber}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-1 text-green-600" />
                  <span>{dashboardData.profile.assignedRegions?.length || 0} {isArabic ? 'منطقة' : 'regions'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-1 text-yellow-600" />
                  <span>{dashboardData.profile.experience} {isArabic ? 'سنوات خبرة' : 'years exp'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={dashboardData.profile.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isArabic ? 
                  (dashboardData.profile.availability === 'available' ? 'متاح' : 'غير متاح') :
                  dashboardData.profile.availability
                }
              </Badge>
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm">{dashboardData.profile.performance?.averageQualityScore || 0}/5</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'زيارات اليوم' : 'Today Visits'}</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.summary?.todayVisits || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'زيارات قادمة' : 'Upcoming'}</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.summary?.upcomingVisits || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'زيارات مكتملة' : 'Completed'}</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.summary?.completedVisits || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'تقارير معلقة' : 'Pending Reports'}</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.summary?.pendingReports || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'توصيات نشطة' : 'Active Recs'}</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.summary?.activeRecommendations || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'متابعات متأخرة' : 'Overdue'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary?.overdueFollowUps || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'مشاكل حرجة' : 'Critical Issues'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary?.criticalIssues || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{isArabic ? 'متوسط الجودة' : 'Avg Quality'}</p>
                <p className="text-2xl font-bold text-teal-600">{dashboardData.summary?.averageQualityScore || 0}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">{isArabic ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="visits">{isArabic ? 'الزيارات' : 'Visits'}</TabsTrigger>
          <TabsTrigger value="notes">{isArabic ? 'الملاحظات' : 'Notes'}</TabsTrigger>
          <TabsTrigger value="assessments">{isArabic ? 'التقييمات' : 'Assessments'}</TabsTrigger>
          <TabsTrigger value="tracking">{isArabic ? 'المتابعة' : 'Tracking'}</TabsTrigger>
          <TabsTrigger value="reports">{isArabic ? 'التقارير' : 'Reports'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {isArabic ? 'جدول اليوم' : 'Today\'s Schedule'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {visits
                      .filter(visit => visit.scheduledDate === new Date().toISOString().split('T')[0])
                      .slice(0, 5)
                      .map((visit) => (
                        <div key={visit.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{isArabic ? visit.farmNameArabic : visit.farmName}</h4>
                            <Badge className={getStatusColor(visit.status)}>
                              {visit.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{visit.scheduledTime} ({visit.estimatedDuration} {isArabic ? 'دقيقة' : 'min'})</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{isArabic ? visit.farmLocationArabic : visit.farmLocation}</span>
                            </div>
                            <div className="flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              <span>{isArabic ? visit.visitTypeArabic : visit.visitType}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-3">
                            {visit.status === 'scheduled' && (
                              <Button size="sm" onClick={() => handleVisitStatusUpdate(visit.id, 'in_progress')}>
                                <PlayCircle className="h-3 w-3 mr-1" />
                                {isArabic ? 'بدء' : 'Start'}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSelectedVisit(visit)}>
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

            {/* Recent Field Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {isArabic ? 'الملاحظات الأخيرة' : 'Recent Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {notes.slice(0, 6).map((note) => (
                      <div key={note.id} className={`p-3 rounded-lg border ${getSeverityColor(note.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{isArabic ? note.titleArabic : note.title}</h4>
                          <Badge className={getSeverityColor(note.severity)}>
                            {note.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {isArabic ? note.farmNameArabic : note.farmName} • {isArabic ? note.categoryArabic : note.category}
                        </p>
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {isArabic ? note.descriptionArabic : note.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDateTime(note.timestamp)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {note.mediaFiles?.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Camera className="h-3 w-3 mr-1" />
                                {note.mediaFiles.length}
                              </Badge>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setSelectedNote(note)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quality Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {isArabic ? 'اتجاهات الجودة' : 'Quality Trends'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{dashboardData.qualityTrends?.thisMonth || 0}%</p>
                  <p className="text-sm text-gray-600">{isArabic ? 'متوسط الجودة هذا الشهر' : 'This Month Average'}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">{dashboardData.qualityTrends?.lastMonth || 0}%</p>
                  <p className="text-sm text-gray-600">{isArabic ? 'الشهر الماضي' : 'Last Month'}</p>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${(dashboardData.qualityTrends?.improvement || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(dashboardData.qualityTrends?.improvement || 0) >= 0 ? '+' : ''}{dashboardData.qualityTrends?.improvement || 0}%
                  </p>
                  <p className="text-sm text-gray-600">{isArabic ? 'التحسن' : 'Improvement'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في الزيارات...' : 'Search visits...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="scheduled">{isArabic ? 'مجدول' : 'Scheduled'}</SelectItem>
                  <SelectItem value="in_progress">{isArabic ? 'جاري' : 'In Progress'}</SelectItem>
                  <SelectItem value="completed">{isArabic ? 'مكتمل' : 'Completed'}</SelectItem>
                  <SelectItem value="postponed">{isArabic ? 'مؤجل' : 'Postponed'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الأولوية' : 'Priority'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
                  <SelectItem value="urgent">{isArabic ? 'عاجل' : 'Urgent'}</SelectItem>
                  <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
                  <SelectItem value="medium">{isArabic ? 'متوسط' : 'Medium'}</SelectItem>
                  <SelectItem value="low">{isArabic ? 'منخفض' : 'Low'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setNewVisitDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'جدولة زيارة' : 'Schedule Visit'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visits
              .filter(visit => {
                const matchesSearch = !searchQuery || 
                  visit.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  visit.farmNameArabic.includes(searchQuery) ||
                  visit.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = filterStatus === 'all' || visit.status === filterStatus;
                const matchesPriority = filterPriority === 'all' || visit.priority === filterPriority;
                return matchesSearch && matchesStatus && matchesPriority;
              })
              .map((visit) => (
                <Card key={visit.id} className={`hover:shadow-lg transition-shadow ${visit.priority === 'urgent' ? 'border-red-300' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{isArabic ? visit.farmNameArabic : visit.farmName}</CardTitle>
                      <div className="flex space-x-1">
                        <Badge className={getPriorityColor(visit.priority)}>
                          {visit.priority}
                        </Badge>
                        <Badge className={getStatusColor(visit.status)}>
                          {visit.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {isArabic ? visit.farmerNameArabic : visit.farmerName} • {isArabic ? visit.visitTypeArabic : visit.visitType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{visit.scheduledDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-green-600" />
                          <span>{visit.scheduledTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Timer className="h-4 w-4 mr-2 text-purple-600" />
                          <span>{visit.estimatedDuration} {isArabic ? 'دقيقة' : 'min'}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                          <span className="text-xs truncate">{isArabic ? visit.farmLocationArabic : visit.farmLocation}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{isArabic ? 'الأهداف' : 'Objectives'}</h4>
                        <div className="flex flex-wrap gap-1">
                          {(isArabic ? visit.objectivesArabic : visit.objectives)?.slice(0, 2).map((objective: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {objective}
                            </Badge>
                          ))}
                          {visit.objectives?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{visit.objectives.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3">
                        <div className="flex space-x-2">
                          {visit.status === 'scheduled' && (
                            <Button size="sm" onClick={() => handleVisitStatusUpdate(visit.id, 'in_progress')}>
                              <PlayCircle className="h-3 w-3 mr-1" />
                              {isArabic ? 'بدء' : 'Start'}
                            </Button>
                          )}
                          {visit.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleVisitStatusUpdate(visit.id, 'completed')}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {isArabic ? 'إنهاء' : 'Complete'}
                            </Button>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelectedVisit(visit)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في الملاحظات...' : 'Search notes...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الفئة' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                  <SelectItem value="crop_condition">{isArabic ? 'حالة المحاصيل' : 'Crop Condition'}</SelectItem>
                  <SelectItem value="soil_health">{isArabic ? 'صحة التربة' : 'Soil Health'}</SelectItem>
                  <SelectItem value="pest_disease">{isArabic ? 'آفات وأمراض' : 'Pest & Disease'}</SelectItem>
                  <SelectItem value="irrigation">{isArabic ? 'الري' : 'Irrigation'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setNewNoteDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة ملاحظة' : 'Add Note'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes
              .filter(note => {
                const matchesSearch = !searchQuery || 
                  note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  note.titleArabic.includes(searchQuery) ||
                  note.farmName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = filterStatus === 'all' || note.category === filterStatus;
                return matchesSearch && matchesCategory;
              })
              .map((note) => (
                <Card key={note.id} className={`hover:shadow-lg transition-shadow border ${getSeverityColor(note.severity)}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{isArabic ? note.titleArabic : note.title}</CardTitle>
                      <Badge className={getSeverityColor(note.severity)}>
                        {note.severity}
                      </Badge>
                    </div>
                    <CardDescription>
                      {isArabic ? note.farmNameArabic : note.farmName} • {isArabic ? note.categoryArabic : note.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {isArabic ? note.descriptionArabic : note.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{isArabic ? note.locationArabic : note.location}</span>
                        <span>•</span>
                        <span>{formatDateTime(note.timestamp)}</span>
                      </div>

                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(isArabic ? note.tagsArabic : note.tags)?.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {note.mediaFiles?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Camera className="h-3 w-3 mr-1" />
                              {note.mediaFiles.length}
                            </Badge>
                          )}
                          {note.followUpRequired && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              <Flag className="h-3 w-3 mr-1" />
                              {isArabic ? 'متابعة' : 'Follow-up'}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelectedNote(note)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {isArabic ? assessment.cropTypeArabic : assessment.cropType}
                    </CardTitle>
                    <Badge className={getQualityColor(assessment.overallQuality)}>
                      {assessment.overallQuality}
                    </Badge>
                  </div>
                  <CardDescription>
                    {assessment.area} {isArabic ? 'هكتار' : 'hectares'} • {isArabic ? assessment.cropVarietyArabic : assessment.cropVariety}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{isArabic ? 'نتيجة الجودة' : 'Quality Score'}</span>
                        <span className="text-sm font-bold">{assessment.qualityScore}%</span>
                      </div>
                      <Progress value={assessment.qualityScore} className="w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-xs text-gray-600">{isArabic ? 'المظهر' : 'Appearance'}</label>
                        <p className="font-medium">{assessment.assessment.appearance.score}%</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">{isArabic ? 'الصحة' : 'Health'}</label>
                        <p className="font-medium">{assessment.assessment.health.score}%</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">{isArabic ? 'النضج' : 'Maturity'}</label>
                        <p className="font-medium">{assessment.assessment.maturity.score}%</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">{isArabic ? 'الإنتاج المتوقع' : 'Expected Yield'}</label>
                        <p className="font-medium">{assessment.assessment.yield.expectedYield} {isArabic ? 'كجم/هكتار' : 'kg/ha'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{isArabic ? 'تاريخ الزراعة' : 'Planted'}: {new Date(assessment.plantingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Sprout className="h-4 w-4 mr-2 text-green-600" />
                        <span>{isArabic ? 'مرحلة النمو' : 'Growth Stage'}: {isArabic ? assessment.growthStageArabic : assessment.growthStage}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <Badge className={`grade-${assessment.assessment.yield.qualityGrade.toLowerCase()}`}>
                        {isArabic ? 'درجة' : 'Grade'} {assessment.assessment.yield.qualityGrade}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setSelectedAssessment(assessment)}>
                        <Eye className="h-3 w-3 mr-1" />
                        {isArabic ? 'عرض' : 'View'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracking.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {isArabic ? item.farmNameArabic : item.farmName}
                    </CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isArabic ? item.categoryArabic : item.category} • {isArabic ? item.farmerNameArabic : item.farmerName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">{isArabic ? 'التوصية' : 'Recommendation'}</h4>
                      <p className="text-sm text-gray-700">{isArabic ? item.recommendationArabic : item.recommendation}</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{isArabic ? 'التقدم' : 'Progress'}</span>
                        <span className="text-sm font-bold">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">{isArabic ? 'الموعد النهائي' : 'Deadline'}:</span>
                        <p className="font-medium">{new Date(item.deadline).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'الأولوية' : 'Priority'}:</span>
                        <Badge className={getPriorityColor(item.priority)} size="sm">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>{isArabic ? item.assignedToArabic : item.assignedTo}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        {isArabic ? 'متابعة' : 'Track'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isArabic ? 'التقارير الميدانية' : 'Field Reports'}</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'إنشاء تقرير' : 'Create Report'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{isArabic ? report.titleArabic : report.title}</CardTitle>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isArabic ? report.reportTypeArabic : report.reportType} • {report.period.startDate} to {report.period.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{isArabic ? 'إجمالي الزيارات' : 'Total Visits'}:</span>
                        <p className="font-bold text-blue-600">{report.summary.totalVisits}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'زيارات مكتملة' : 'Completed'}:</span>
                        <p className="font-bold text-green-600">{report.summary.completedVisits}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'مزارع مزارة' : 'Farms Visited'}:</span>
                        <p className="font-bold text-purple-600">{report.summary.farmsVisited}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'مشاكل محددة' : 'Issues Found'}:</span>
                        <p className="font-bold text-orange-600">{report.summary.issuesIdentified}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">{isArabic ? 'النتائج الرئيسية' : 'Key Findings'}</h4>
                      <div className="space-y-1">
                        {report.keyFindings?.slice(0, 2).map((finding: any, index: number) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{isArabic ? finding.categoryArabic : finding.category}</span>
                              <Badge className={getSeverityColor(finding.severity)} size="sm">
                                {finding.severity}
                              </Badge>
                            </div>
                            <p className="mt-1 text-gray-700 line-clamp-2">
                              {isArabic ? finding.findingArabic : finding.finding}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {isArabic ? 'تم الإنشاء' : 'Created'}: {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-1">
                        {report.exportFormats?.map((format: any) => (
                          <Button key={format.format} size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            {format.format.toUpperCase()}
                          </Button>
                        ))}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  {isArabic ? 'نظرة عامة على الأداء' : 'Performance Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboardData.profile?.performance?.totalVisits || 0}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'إجمالي الزيارات' : 'Total Visits'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboardData.profile?.performance?.completedOnTime || 0}%</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'في الوقت المحدد' : 'On Time Completion'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{dashboardData.profile?.performance?.averageQualityScore || 0}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'متوسط تقييم الجودة' : 'Avg Quality Score'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{dashboardData.profile?.performance?.farmerSatisfaction || 0}</p>
                      <p className="text-xs text-gray-600">{isArabic ? 'رضا الفلاحين' : 'Farmer Satisfaction'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {isArabic ? 'اتجاهات الجودة' : 'Quality Trends'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isArabic ? 'هذا الشهر' : 'This Month'}</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-blue-600">{dashboardData.qualityTrends?.thisMonth || 0}%</span>
                      <TrendingUp className="h-4 w-4 ml-1 text-green-500" />
                    </div>
                  </div>
                  <Progress value={dashboardData.qualityTrends?.thisMonth || 0} className="w-full" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isArabic ? 'الشهر الماضي' : 'Last Month'}</span>
                    <span className="text-lg font-bold text-gray-600">{dashboardData.qualityTrends?.lastMonth || 0}%</span>
                  </div>
                  <Progress value={dashboardData.qualityTrends?.lastMonth || 0} className="w-full" />

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{isArabic ? 'التحسن' : 'Improvement'}</span>
                      <span className={`text-lg font-bold ${(dashboardData.qualityTrends?.improvement || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(dashboardData.qualityTrends?.improvement || 0) >= 0 ? '+' : ''}{dashboardData.qualityTrends?.improvement || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Workload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                {isArabic ? 'عبء العمل الحالي' : 'Current Workload'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.profile?.currentWorkload?.scheduledVisits || 0}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'زيارات مجدولة' : 'Scheduled Visits'}</p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.profile?.currentWorkload?.pendingReports || 0}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'تقارير معلقة' : 'Pending Reports'}</p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.profile?.currentWorkload?.overdueFollowUps || 0}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'متابعات متأخرة' : 'Overdue Follow-ups'}</p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.profile?.currentWorkload?.activeRecommendations || 0}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'توصيات نشطة' : 'Active Recommendations'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visit Details Modal */}
      {selectedVisit && (
        <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? selectedVisit.farmNameArabic : selectedVisit.farmName}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? 'تفاصيل الزيارة الميدانية' : 'Field visit details'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{isArabic ? 'نوع الزيارة' : 'Visit Type'}</Label>
                  <p className="text-sm">{isArabic ? selectedVisit.visitTypeArabic : selectedVisit.visitType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{isArabic ? 'الأولوية' : 'Priority'}</Label>
                  <Badge className={getPriorityColor(selectedVisit.priority)}>
                    {selectedVisit.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">{isArabic ? 'التاريخ والوقت' : 'Date & Time'}</Label>
                  <p className="text-sm">{selectedVisit.scheduledDate} {selectedVisit.scheduledTime}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{isArabic ? 'المدة المقدرة' : 'Duration'}</Label>
                  <p className="text-sm">{selectedVisit.estimatedDuration} {isArabic ? 'دقيقة' : 'minutes'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{isArabic ? 'أهداف الزيارة' : 'Visit Objectives'}</Label>
                <ul className="mt-2 space-y-1">
                  {(isArabic ? selectedVisit.objectivesArabic : selectedVisit.objectives)?.map((objective: string, index: number) => (
                    <li key={index} className="text-sm flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label className="text-sm font-medium">{isArabic ? 'المعدات المطلوبة' : 'Required Equipment'}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(isArabic ? selectedVisit.equipmentArabic : selectedVisit.equipment)?.map((item: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedVisit.weather && (
                <div>
                  <Label className="text-sm font-medium">{isArabic ? 'الطقس المتوقع' : 'Expected Weather'}</Label>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{isArabic ? 'الحالة' : 'Condition'}:</span>
                        <p>{isArabic ? selectedVisit.weather.expectedConditionArabic : selectedVisit.weather.expectedCondition}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'الحرارة' : 'Temperature'}:</span>
                        <p>{selectedVisit.weather.temperature}°C</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{isArabic ? 'سرعة الرياح' : 'Wind Speed'}:</span>
                        <p>{selectedVisit.weather.windSpeed} km/h</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                <p className="text-sm mt-1">{isArabic ? selectedVisit.notesArabic : selectedVisit.notes}</p>
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

export default FieldInspectorDashboard;
