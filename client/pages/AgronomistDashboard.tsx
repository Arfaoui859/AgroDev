import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  Leaf,
  Activity,
  Target,
  BookOpen,
  GraduationCap,
  FileText,
  Image,
  Star,
  Award,
  Zap,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Send,
  Download,
  Upload,
  Settings,
  Bell,
  Phone,
  Video,
  MessageSquare,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash,
  Share,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Shield,
  PieChart,
  LineChart
} from 'lucide-react';

interface AgronomistDashboardProps {
  expertId?: string;
  onFarmSelect?: (farmId: string) => void;
  onCreateRecommendation?: (farmId: string, recommendation: any) => void;
  onScheduleTraining?: (trainingData: any) => void;
}

interface FarmOverview {
  id: string;
  name: string;
  nameArabic: string;
  farmerName: string;
  farmerNameArabic: string;
  location: string;
  locationArabic: string;
  totalArea: number;
  cultivatedArea: number;
  soilHealth: number;
  cropCount: number;
  healthyPercentage: number;
  alertCount: number;
  lastVisit: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  crops: Array<{
    name: string;
    nameArabic: string;
    area: number;
    health: string;
    stage: string;
    stageArabic: string;
  }>;
  recentAlerts: Array<{
    type: string;
    message: string;
    messageArabic: string;
    severity: string;
    timestamp: string;
  }>;
}

interface DiseaseAnalysis {
  id: string;
  farmId: string;
  farmName: string;
  cropType: string;
  cropTypeArabic: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  aiAnalysis: {
    diseaseDetected: boolean;
    diseaseName?: string;
    diseaseNameArabic?: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedTreatment: string[];
    recommendedTreatmentArabic: string[];
  };
  expertReview: {
    reviewed: boolean;
    reviewedBy?: string;
    reviewedAt?: string;
    expertDiagnosis?: string;
    expertDiagnosisArabic?: string;
    treatmentPlan?: string[];
    treatmentPlanArabic?: string[];
    followUpRequired: boolean;
    followUpDate?: string;
  };
  status: 'pending' | 'reviewed' | 'treated' | 'resolved';
}

interface RecommendationTracking {
  id: string;
  farmId: string;
  farmName: string;
  farmerName: string;
  recommendation: string;
  recommendationArabic: string;
  type: 'irrigation' | 'fertilizer' | 'pesticide' | 'planting' | 'harvesting' | 'soil_treatment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  effectiveness?: number;
  followUpRequired: boolean;
}

interface TrainingProgram {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  type: 'individual' | 'group' | 'online' | 'field_demonstration';
  category: string;
  duration: number;
  maxParticipants: number;
  scheduledDate: string;
  location: string;
  locationArabic: string;
  participants: Array<{
    farmerId: string;
    farmerName: string;
    farmerNameArabic: string;
    registeredAt: string;
    attended?: boolean;
    completionScore?: number;
  }>;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const AgronomistDashboard: React.FC<AgronomistDashboardProps> = ({
  expertId = 'expert_001',
  onFarmSelect,
  onCreateRecommendation,
  onScheduleTraining
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [farms, setFarms] = useState<FarmOverview[]>([]);
  const [diseaseAnalyses, setDiseaseAnalyses] = useState<DiseaseAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationTracking[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<FarmOverview | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        overviewResponse,
        farmsResponse,
        analysesResponse,
        recommendationsResponse,
        trainingResponse
      ] = await Promise.all([
        fetch('/api/agronomist-dashboard/overview'),
        fetch('/api/agronomist-dashboard/farms'),
        fetch('/api/agronomist-dashboard/disease-analyses'),
        fetch('/api/agronomist-dashboard/recommendations'),
        fetch('/api/agronomist-dashboard/training-programs')
      ]);

      const [overview, farmsData, analysesData, recommendationsData, trainingData] = await Promise.all([
        overviewResponse.json(),
        farmsResponse.json(),
        analysesResponse.json(),
        recommendationsResponse.json(),
        trainingResponse.json()
      ]);

      setDashboardData(overview.data);
      setFarms(farmsData.data);
      setDiseaseAnalyses(analysesData.data);
      setRecommendations(recommendationsData.data);
      setTrainingPrograms(trainingData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAnalysis = async (analysisId: string, reviewData: any) => {
    try {
      const response = await fetch(`/api/agronomist-dashboard/disease-analyses/${analysisId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error reviewing analysis:', error);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 75) return 'text-blue-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return isArabic ? 'اليوم' : 'Today';
    if (diffInDays === 1) return isArabic ? 'أمس' : 'Yesterday';
    return isArabic ? `منذ ${diffInDays} أيام` : `${diffInDays} days ago`;
  };

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farm.nameArabic.includes(searchQuery) ||
                         farm.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farm.farmerNameArabic.includes(searchQuery);

    const matchesUrgency = !filterUrgency || filterUrgency === 'all' || farm.urgencyLevel === filterUrgency;

    return matchesSearch && matchesUrgency;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
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
            {isArabic ? 'فشل في تحميل البيانات' : 'Failed to load dashboard data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'لوحة تحكم الخبير الزراعي' : 'Agronomist Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة المزارع والمحاصيل وتدريب الفلاحين' : 'Farm management, crop monitoring, and farmer training'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="text-sm"
          >
            {isArabic ? 'English' : 'العربية'}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المزارع' : 'Total Farms'}</p>
                <p className="text-2xl font-bold">{dashboardData.summary.totalFarms}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'مزارع طارئة' : 'Urgent Farms'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary.urgentFarms}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'تحليلات معلقة' : 'Pending Analyses'}</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.summary.pendingDiseaseAnalyses}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'توصيات متأخرة' : 'Overdue Recommendations'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary.overdueRecommendations}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'متوسط صحة المزارع' : 'Avg Farm Health'}</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.summary.averageFarmHealth}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isArabic ? 'إجمالي التنبيهات' : 'Total Alerts'}</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.summary.totalAlerts}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="farms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="farms">{isArabic ? 'المزارع' : 'Farms'}</TabsTrigger>
          <TabsTrigger value="disease-analysis">{isArabic ? 'تحليل الأمراض' : 'Disease Analysis'}</TabsTrigger>
          <TabsTrigger value="recommendations">{isArabic ? 'التوصيات' : 'Recommendations'}</TabsTrigger>
          <TabsTrigger value="training">{isArabic ? 'التدريب' : 'Training'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="performance">{isArabic ? 'الأداء' : 'Performance'}</TabsTrigger>
        </TabsList>

        {/* Farms Tab */}
        <TabsContent value="farms" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث في المزارع...' : 'Search farms...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'مستوى الأولوية' : 'Urgency Level'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="critical">{isArabic ? 'حرج' : 'Critical'}</SelectItem>
                  <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
                  <SelectItem value="medium">{isArabic ? 'متوسط' : 'Medium'}</SelectItem>
                  <SelectItem value="low">{isArabic ? 'منخفض' : 'Low'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Farms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFarms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {isArabic ? farm.nameArabic : farm.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {isArabic ? farm.farmerNameArabic : farm.farmerName}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{isArabic ? farm.locationArabic : farm.location}</span>
                      </div>
                    </div>
                    <Badge className={getUrgencyColor(farm.urgencyLevel)}>
                      {farm.urgencyLevel}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'صحة التربة' : 'Soil Health'}</span>
                      <span className={`font-medium ${getHealthColor(farm.soilHealth)}`}>
                        {farm.soilHealth}%
                      </span>
                    </div>
                    <Progress value={farm.soilHealth} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-gray-600">{isArabic ? 'المحاصيل' : 'Crops'}</p>
                        <p className="font-medium">{farm.cropCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">{isArabic ? 'صحية' : 'Healthy'}</p>
                        <p className="font-medium">{farm.healthyPercentage}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">{isArabic ? 'تنبيهات' : 'Alerts'}</p>
                        <p className="font-medium text-orange-600">{farm.alertCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1" onClick={() => setSelectedFarm(farm)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض التفاصيل' : 'View Details'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Leaf className="h-5 w-5" />
                            <span>{isArabic ? farm.nameArabic : farm.name}</span>
                          </DialogTitle>
                          <DialogDescription>
                            {isArabic ? `${farm.farmerNameArabic} - ${farm.locationArabic}` : 
                             `${farm.farmerName} - ${farm.location}`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'معلومات المزرعة' : 'Farm Information'}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'المساحة الإجمالية' : 'Total Area'}:</span>
                                  <span>{farm.totalArea} {isArabic ? 'هكتار' : 'hectares'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'المساحة المزروعة' : 'Cultivated Area'}:</span>
                                  <span>{farm.cultivatedArea} {isArabic ? 'هكتار' : 'hectares'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isArabic ? 'آخر زيارة' : 'Last Visit'}:</span>
                                  <span>{formatTimeAgo(farm.lastVisit)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'المحاصيل' : 'Crops'}</h4>
                              <div className="space-y-2">
                                {farm.crops.map((crop, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span>{isArabic ? crop.nameArabic : crop.name}</span>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {crop.health}
                                      </Badge>
                                      <span className="text-xs text-gray-500">{crop.area} ha</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {farm.recentAlerts.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'التنبيهات الأخيرة' : 'Recent Alerts'}</h4>
                              <div className="space-y-2">
                                {farm.recentAlerts.map((alert, index) => (
                                  <Alert key={index} className="py-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                      {isArabic ? alert.messageArabic : alert.message}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button className="flex-1" onClick={() => onFarmSelect?.(farm.id)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {isArabic ? 'تواصل مع الفلاح' : 'Contact Farmer'}
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Calendar className="h-4 w-4 mr-2" />
                              {isArabic ? 'جدولة زيارة' : 'Schedule Visit'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Disease Analysis Tab */}
        <TabsContent value="disease-analysis" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isArabic ? 'تحليل الأمراض المرفوعة' : 'Disease Analysis Queue'}</h3>
            <div className="flex space-x-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="pending">{isArabic ? 'معلق' : 'Pending'}</SelectItem>
                  <SelectItem value="reviewed">{isArabic ? 'تمت المراجعة' : 'Reviewed'}</SelectItem>
                  <SelectItem value="resolved">{isArabic ? 'تم الحل' : 'Resolved'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {diseaseAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{analysis.farmName}</h4>
                      <p className="text-sm text-gray-600">
                        {isArabic ? analysis.cropTypeArabic : analysis.cropType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isArabic ? 'رفع بو��سطة' : 'Uploaded by'} {analysis.uploadedBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(analysis.uploadedAt)}
                      </p>
                    </div>
                    <Badge className={
                      analysis.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      analysis.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {analysis.status}
                    </Badge>
                  </div>

                  {analysis.aiAnalysis.diseaseDetected && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-800">
                          {isArabic ? 'تم اكتشاف مرض' : 'Disease Detected'}
                        </span>
                      </div>
                      <p className="text-sm text-red-700">
                        {isArabic ? analysis.aiAnalysis.diseaseNameArabic : analysis.aiAnalysis.diseaseName}
                      </p>
                      <p className="text-xs text-red-600">
                        {isArabic ? 'مستوى الثقة' : 'Confidence'}: {(analysis.aiAnalysis.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1" onClick={() => setSelectedAnalysis(analysis)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'مراجعة' : 'Review'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{isArabic ? 'مراجعة تحليل المرض' : 'Disease Analysis Review'}</DialogTitle>
                          <DialogDescription>
                            {analysis.farmName} - {isArabic ? analysis.cropTypeArabic : analysis.cropType}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis'}</h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>{isArabic ? 'المرض المكتشف' : 'Disease Detected'}:</strong> {
                                  isArabic ? analysis.aiAnalysis.diseaseNameArabic : analysis.aiAnalysis.diseaseName
                                }</p>
                                <p><strong>{isArabic ? 'الشدة' : 'Severity'}:</strong> {analysis.aiAnalysis.severity}</p>
                                <p><strong>{isArabic ? 'مستوى الثقة' : 'Confidence'}:</strong> {(analysis.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                              </div>
                              
                              <h5 className="font-medium mt-3 mb-2">{isArabic ? 'العلاج الموصى به' : 'Recommended Treatment'}</h5>
                              <ul className="text-sm space-y-1">
                                {(isArabic ? analysis.aiAnalysis.recommendedTreatmentArabic : analysis.aiAnalysis.recommendedTreatment).map((treatment, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <ChevronRight className="h-3 w-3" />
                                    <span>{treatment}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">{isArabic ? 'مراجعة الخبير' : 'Expert Review'}</h4>
                              {!analysis.expertReview.reviewed ? (
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder={isArabic ? 'تشخيص الخبير...' : 'Expert diagnosis...'}
                                    rows={3}
                                  />
                                  <Textarea
                                    placeholder={isArabic ? 'خطة العلاج...' : 'Treatment plan...'}
                                    rows={3}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="followUp" />
                                    <label htmlFor="followUp" className="text-sm">
                                      {isArabic ? 'يتطلب متابعة' : 'Requires follow-up'}
                                    </label>
                                  </div>
                                  <Button onClick={() => handleReviewAnalysis(analysis.id, {
                                    expertDiagnosis: 'Expert diagnosis',
                                    treatmentPlan: ['Treatment step 1', 'Treatment step 2'],
                                    followUpRequired: true
                                  })}>
                                    {isArabic ? 'إرسال المراجعة' : 'Submit Review'}
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2 text-sm">
                                  <p><strong>{isArabic ? 'المراجع' : 'Reviewed by'}:</strong> {analysis.expertReview.reviewedBy}</p>
                                  <p><strong>{isArabic ? 'التشخيص' : 'Diagnosis'}:</strong> {
                                    isArabic ? analysis.expertReview.expertDiagnosisArabic : analysis.expertReview.expertDiagnosis
                                  }</p>
                                  {analysis.expertReview.treatmentPlan && (
                                    <div>
                                      <p><strong>{isArabic ? 'خطة العلاج' : 'Treatment Plan'}:</strong></p>
                                      <ul className="mt-1 space-y-1">
                                        {(isArabic ? analysis.expertReview.treatmentPlanArabic : analysis.expertReview.treatmentPlan)?.map((step, index) => (
                                          <li key={index} className="flex items-center space-x-2">
                                            <ChevronRight className="h-3 w-3" />
                                            <span>{step}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isArabic ? 'متابعة التوصيات' : 'Recommendation Tracking'}</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'توصية جديدة' : 'New Recommendation'}
            </Button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{rec.farmName}</h4>
                        <Badge className={
                          rec.priority === 'urgent' ? 'bg-red-500 text-white' :
                          rec.priority === 'high' ? 'bg-orange-500 text-white' :
                          rec.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {isArabic ? rec.recommendationArabic : rec.recommendation}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{isArabic ? 'للفلاح' : 'For farmer'}: {rec.farmerName}</span>
                        <span>{isArabic ? 'تاريخ الاستحقاق' : 'Due date'}: {new Date(rec.dueDate).toLocaleDateString()}</span>
                        {rec.effectiveness && (
                          <span>{isArabic ? 'الفعالية' : 'Effectiveness'}: {rec.effectiveness}/10</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        rec.status === 'completed' ? 'bg-green-100 text-green-800' :
                        rec.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        rec.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {rec.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{isArabic ? 'برامج التدريب' : 'Training Programs'}</h3>
            <Button onClick={() => onScheduleTraining?.({})}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'برنامج جديد' : 'New Program'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trainingPrograms.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        {isArabic ? program.titleArabic : program.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {isArabic ? program.descriptionArabic : program.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(program.scheduledDate).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{program.duration} {isArabic ? 'دقيقة' : 'min'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{program.participants.length}/{program.maxParticipants}</span>
                        </span>
                      </div>
                    </div>
                    <Badge className={
                      program.status === 'completed' ? 'bg-green-100 text-green-800' :
                      program.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      program.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {program.status}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {isArabic ? 'إدارة البرنامج' : 'Manage Program'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isArabic ? 'أداء المزارع' : 'Farm Performance'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{isArabic ? 'معدل نجاح العلاج' : 'Treatment Success Rate'}</span>
                    <span className="font-semibold text-green-600">89.3%</span>
                  </div>
                  <Progress value={89.3} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{isArabic ? 'معدل التزام الفلاحين' : 'Farmer Compliance Rate'}</span>
                    <span className="font-semibold text-blue-600">92.1%</span>
                  </div>
                  <Progress value={92.1} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{isArabic ? 'رضا الفلاحين' : 'Farmer Satisfaction'}</span>
                    <span className="font-semibold text-yellow-600">4.7/5</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{isArabic ? 'إحصائيات هذا الشهر' : 'This Month Stats'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'مزارع زارها' : 'Farms Visited'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">31</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'توصيات قدمها' : 'Recommendations Given'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">2</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'دورات تدريبية' : 'Training Sessions'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">12</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'أمراض عولجت' : 'Diseases Treated'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>{isArabic ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.treatmentSuccessRate.toFixed(1)}%</p>
                  <p className="text-sm text-blue-700">{isArabic ? 'نجاح العلاج' : 'Treatment Success'}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.farmerSatisfactionScore}</p>
                  <p className="text-sm text-green-700">{isArabic ? 'رضا الفلاحين' : 'Farmer Satisfaction'}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.trainingSessionsConducted}</p>
                  <p className="text-sm text-purple-700">{isArabic ? 'دورات تدريبية' : 'Training Sessions'}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.averageResponseTime.toFixed(1)}h</p>
                  <p className="text-sm text-orange-700">{isArabic ? 'متوسط الاستجابة' : 'Avg Response Time'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgronomistDashboard;
