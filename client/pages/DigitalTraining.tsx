import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  Brain, 
  Target, 
  Zap, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpRight,
  Lightbulb,
  Settings,
  Activity,
  Clock,
  ThumbsUp,
  Star,
  Globe,
  Shield,
  Building,
  Eye,
  Filter,
  Search,
  Plus,
  Download,
  Upload,
  Award,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Database,
  Monitor,
  Headphones,
  Video,
  FileText,
  Certificate,
  Cpu
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in hours
  instructor: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  price: number;
  language: string;
  tags: string[];
  thumbnail: string;
  syllabus: {
    module: string;
    lessons: { title: string; duration: number; type: 'video' | 'text' | 'interactive' | 'quiz' }[];
  }[];
  prerequisites: string[];
  learningOutcomes: string[];
  certification: boolean;
  aiTutor: boolean;
  interactiveElements: string[];
  status: 'draft' | 'published' | 'archived';
  createdDate: string;
  lastUpdated: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  progress: number;
  completedLessons: string[];
  currentLesson: string;
  timeSpent: number; // in minutes
  lastAccessed: string;
  certificateEarned: boolean;
  certificateDate?: string;
  finalScore?: number;
  status: 'active' | 'completed' | 'dropped' | 'paused';
}

interface AIModel {
  id: string;
  name: string;
  type: 'recommendation' | 'assessment' | 'content_generation' | 'personalization';
  description: string;
  accuracy: number;
  trainingData: string;
  lastTrained: string;
  usage: number;
  status: 'active' | 'training' | 'testing' | 'deprecated';
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    userSatisfaction: number;
  };
  applications: string[];
}

interface TrainingSession {
  id: string;
  title: string;
  type: 'live' | 'recorded' | 'interactive' | 'vr' | 'ar';
  instructor: string;
  startTime: string;
  duration: number;
  capacity: number;
  enrolled: number;
  description: string;
  materials: string[];
  category: string;
  level: string;
  language: string;
  price: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  recording?: string;
  feedback: { rating: number; comment: string; date: string }[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in weeks
  courses: string[];
  prerequisites: string[];
  outcomes: string[];
  certification: string;
  enrolledCount: number;
  completionRate: number;
  aiPersonalized: boolean;
  adaptiveContent: boolean;
}

export default function DigitalTraining() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    language: '',
    price: ''
  });

  useEffect(() => {
    loadCourses();
    loadEnrollments();
    loadAIModels();
    loadTrainingSessions();
    loadLearningPaths();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/digital-training/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEnrollments = async () => {
    try {
      const response = await fetch('/api/digital-training/enrollments');
      const data = await response.json();
      setEnrollments(data);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const loadAIModels = async () => {
    try {
      const response = await fetch('/api/digital-training/ai-models');
      const data = await response.json();
      setAIModels(data);
    } catch (error) {
      console.error('Error loading AI models:', error);
    }
  };

  const loadTrainingSessions = async () => {
    try {
      const response = await fetch('/api/digital-training/sessions');
      const data = await response.json();
      setTrainingSessions(data);
    } catch (error) {
      console.error('Error loading training sessions:', error);
    }
  };

  const loadLearningPaths = async () => {
    try {
      const response = await fetch('/api/digital-training/learning-paths');
      const data = await response.json();
      setLearningPaths(data);
    } catch (error) {
      console.error('Error loading learning paths:', error);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/digital-training/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      if (response.ok) {
        loadEnrollments();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const updateProgress = async (enrollmentId: string, progress: number) => {
    try {
      const response = await fetch(`/api/digital-training/enrollments/${enrollmentId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      });
      if (response.ok) {
        loadEnrollments();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'active': return 'bg-green-100 text-green-800';
      case 'ongoing': 
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'paused': 
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'dropped': 
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDashboardMetrics = () => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const avgProgress = enrollments.reduce((sum, e) => sum + e.progress, 0) / Math.max(enrollments.length, 1);
    const totalRevenue = enrollments.reduce((sum, e) => {
      const course = courses.find(c => c.id === e.courseId);
      return sum + (course ? course.price : 0);
    }, 0);

    return { 
      totalCourses, 
      publishedCourses, 
      totalEnrollments, 
      activeEnrollments, 
      completedEnrollments, 
      avgProgress, 
      totalRevenue 
    };
  };

  const metrics = getDashboardMetrics();

  const filteredCourses = courses.filter(course => {
    return (!filters.category || course.category === filters.category) &&
           (!filters.level || course.level === filters.level) &&
           (!filters.language || course.language === filters.language);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-emerald-600" />
            نظام التدريب الرقمي والتعلم الآلي التفاعلي
          </h1>
          <p className="text-xl text-gray-600">
            منصة تعليمية متقدمة بتقنيات ا��ذكاء الاصطناعي للتدريب الزراعي التفاعلي
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              المقررات
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              الجلسات التدريبية
            </TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              مسارات التعلم
            </TabsTrigger>
            <TabsTrigger value="ai-models" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              نماذج الذكاء الاصطناعي
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Certificate className="h-4 w-4" />
              الشهادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100">إجمالي المقررات</p>
                      <p className="text-3xl font-bold">{metrics.totalCourses}</p>
                      <p className="text-sm text-emerald-200">منشور: {metrics.publishedCourses}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">التسجيلات النشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeEnrollments}</p>
                      <p className="text-sm text-blue-200">من أصل {metrics.totalEnrollments}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">معدل الإتمام</p>
                      <p className="text-3xl font-bold">{((metrics.completedEnrollments / Math.max(metrics.totalEnrollments, 1)) * 100).toFixed(1)}%</p>
                      <p className="text-sm text-purple-200">مكتمل: {metrics.completedEnrollments}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">إجمالي الإيرادات</p>
                      <p className="text-3xl font-bold">${(metrics.totalRevenue / 1000).toFixed(0)}K</p>
                      <p className="text-sm text-orange-200">متوسط التقدم: {metrics.avgProgress.toFixed(1)}%</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    المقررات الأكثر شعبية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses
                      .sort((a, b) => b.enrolledCount - a.enrolledCount)
                      .slice(0, 5)
                      .map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{course.title.substring(0, 35)}...</p>
                            <p className="text-sm text-gray-500">{course.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">
                              {course.enrolledCount} متدرب
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{course.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    نماذج الذكاء الاصطناعي النشطة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiModels
                      .filter(model => model.status === 'active')
                      .slice(0, 4)
                      .map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-gray-500">{model.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {model.accuracy}% دقة
                            </div>
                            <div className="text-sm text-gray-500">
                              {model.usage} استخدام
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    الجلسات التدريبية القادمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trainingSessions
                      .filter(session => session.status === 'scheduled')
                      .slice(0, 5)
                      .map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{session.title.substring(0, 30)}...</p>
                            <p className="text-sm text-gray-500">{session.instructor}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{session.startTime}</div>
                            <div className="text-xs text-gray-500">
                              {session.enrolled}/{session.capacity} متدرب
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    إحصائيات الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>متوسط وقت الجلسة</span>
                      <span className="font-bold text-emerald-600">
                        {(enrollments.reduce((sum, e) => sum + e.timeSpent, 0) / Math.max(enrollments.length, 1) / 60).toFixed(1)} ساعة
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>مقررات بالذكاء الاصطناعي</span>
                      <span className="font-bold text-blue-600">
                        {courses.filter(c => c.aiTutor).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل رضا المتدربين</span>
                      <span className="font-bold text-purple-600">
                        {(courses.reduce((sum, c) => sum + c.rating, 0) / Math.max(courses.length, 1)).toFixed(1)}/5
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>شهادات صادرة</span>
                      <span className="font-bold text-orange-600">
                        {enrollments.filter(e => e.certificateEarned).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مكتبة المقررات التدريبية</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  استيراد محتوى
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  مقرر جديد
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  فلاتر البحث
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>الفئة</Label>
                    <Select onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الفئات</SelectItem>
                        <SelectItem value="الري الذكي">الري الذكي</SelectItem>
                        <SelectItem value="الزراعة العضوية">الزراعة العضوية</SelectItem>
                        <SelectItem value="تقنيات الاستشعار">تقنيات الاستشعار</SelectItem>
                        <SelectItem value="الذكاء الاصطناعي">الذكاء الاصطناعي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>المستوى</Label>
                    <Select onValueChange={(value) => setFilters({...filters, level: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="beginner">مبتدئ</SelectItem>
                        <SelectItem value="intermediate">متوسط</SelectItem>
                        <SelectItem value="advanced">متقدم</SelectItem>
                        <SelectItem value="expert">خبير</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>اللغة</Label>
                    <Select onValueChange={(value) => setFilters({...filters, language: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع اللغات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع اللغات</SelectItem>
                        <SelectItem value="العربية">العربية</SelectItem>
                        <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>السعر</Label>
                    <Select onValueChange={(value) => setFilters({...filters, price: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الأسعار" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الأسعار</SelectItem>
                        <SelectItem value="free">مجاني</SelectItem>
                        <SelectItem value="paid">مدفوع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white" />
                    </div>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(course.level)}>
                          {course.level}
                        </Badge>
                        {course.aiTutor && <Brain className="h-4 w-4 text-purple-500" />}
                      </div>
                    </div>
                    <CardDescription>{course.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{course.description.substring(0, 120)}...</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">المدة:</span>
                          <span className="font-medium mr-1">{course.duration} ساعة</span>
                        </div>
                        <div>
                          <span className="text-gray-500">المدرب:</span>
                          <span className="font-medium mr-1">{course.instructor}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">المتدربين:</span>
                          <span className="font-medium mr-1">{course.enrolledCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">السعر:</span>
                          <span className="font-medium mr-1">
                            {course.price === 0 ? 'مجاني' : `$${course.price}`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">({course.reviewCount} تقييم)</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {course.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>اللغة: {course.language}</div>
                        <div>
                          {course.certification ? '✓ شهادة معتمدة' : ''}
                          {course.interactiveElements.length > 0 ? ' • تفاعلي' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        <GraduationCap className="h-3 w-3 mr-1" />
                        التسجيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">الجلسات التدريبية المباشرة</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                جلسة جديدة
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['scheduled', 'ongoing', 'completed', 'cancelled'].map((status) => (
                <Card key={status}>
                  <CardHeader>
                    <CardTitle className="text-center">
                      {status === 'scheduled' && 'مجدولة'}
                      {status === 'ongoing' && 'جارية'}
                      {status === 'completed' && 'مكتملة'}
                      {status === 'cancelled' && 'ملغية'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trainingSessions
                        .filter(session => session.status === status)
                        .map((session) => (
                          <Card key={session.id} className="p-3 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">{session.title.substring(0, 25)}...</h4>
                              <div className="flex justify-between text-xs">
                                <span>المدرب:</span>
                                <span className="font-medium">{session.instructor}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>النوع:</span>
                                <Badge variant="outline" className="text-xs">
                                  {session.type}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>المدة:</span>
                                <span className="font-medium">{session.duration} دقيقة</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>المسجلين:</span>
                                <span className="font-medium">
                                  {session.enrolled}/{session.capacity}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {session.startTime}
                              </div>
                              {session.status === 'ongoing' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                    <Play className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                    <Users className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مسارات التعلم المخصصة</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                مسار جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{path.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                        {path.aiPersonalized && <Brain className="h-4 w-4 text-purple-500" />}
                      </div>
                    </div>
                    <CardDescription>{path.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{path.description.substring(0, 120)}...</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">المدة المتوقعة:</span>
                          <p className="font-medium">{path.estimatedDuration} أسبوع</p>
                        </div>
                        <div>
                          <span className="text-gray-500">عدد المقررات:</span>
                          <p className="font-medium">{path.courses.length} مقرر</p>
                        </div>
                        <div>
                          <span className="text-gray-500">المسجلين:</span>
                          <p className="font-medium">{path.enrolledCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">معدل الإتمام:</span>
                          <p className="font-medium">{path.completionRate}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">الشهادة:</span>
                        <p className="text-sm font-medium">{path.certification}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">النتائج المتوقعة:</span>
                        <ul className="text-sm space-y-1 mt-1">
                          {path.outcomes.slice(0, 2).map((outcome, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Progress value={path.completionRate} className="w-full" />
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Button size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        ابدأ المسار
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-models" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">نماذج الذكاء الاصطناعي</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                نموذج جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiModels.map((model) => (
                <Card key={model.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                    <CardDescription>{model.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{model.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">الدقة:</span>
                          <p className="font-medium text-green-600">{model.accuracy}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الاستخدام:</span>
                          <p className="font-medium">{model.usage} مرة</p>
                        </div>
                        <div>
                          <span className="text-gray-500">التدريب الأخير:</span>
                          <p className="font-medium">{model.lastTrained}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">رضا المستخدمين:</span>
                          <p className="font-medium">{model.metrics.userSatisfaction}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">مقاييس الأداء:</span>
                        <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                          <div className="text-center">
                            <div className="font-medium">{model.metrics.precision}%</div>
                            <div className="text-gray-500">Precision</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{model.metrics.recall}%</div>
                            <div className="text-gray-500">Recall</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{model.metrics.f1Score}%</div>
                            <div className="text-gray-500">F1 Score</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">التطبيقات:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.applications.map((app, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Button size="sm">
                        <Cpu className="h-3 w-3 mr-1" />
                        إعادة التدريب
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">تحليلات الأداء والتعلم</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-600">
                    {((metrics.completedEnrollments / Math.max(metrics.totalEnrollments, 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">معدل إتمام المقررات</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {(enrollments.reduce((sum, e) => sum + e.timeSpent, 0) / Math.max(enrollments.length, 1) / 60).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">متوسط ساعات التدريب</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {aiModels.filter(m => m.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-500">نماذج ذكاء اصطناعي نشطة</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {enrollments.filter(e => e.certificateEarned).length}
                  </div>
                  <div className="text-sm text-gray-500">شهادات مكتسبة</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الشهادات</h2>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                تصدير الشهادات
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments
                .filter(enrollment => enrollment.certificateEarned)
                .map((enrollment) => {
                  const course = courses.find(c => c.id === enrollment.courseId);
                  return (
                    <Card key={enrollment.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{course?.title || 'مقرر غير معروف'}</CardTitle>
                          <Certificate className="h-6 w-6 text-yellow-600" />
                        </div>
                        <CardDescription>شهادة إتمام معتمدة</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm">
                            <span className="text-gray-500">تاريخ الإكمال:</span>
                            <p className="font-medium">{enrollment.certificateDate}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">النتيجة النهائية:</span>
                            <p className="font-medium text-green-600">{enrollment.finalScore}%</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">وقت الدراسة:</span>
                            <p className="font-medium">{(enrollment.timeSpent / 60).toFixed(1)} ساعة</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            عرض
                          </Button>
                          <Button size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            تحميل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
