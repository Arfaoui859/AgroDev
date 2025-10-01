import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  Calendar,
  Users,
  Activity,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Thermometer,
  Stethoscope,
  Pill,
  Syringe,
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Plus,
  FileText,
  Star,
  Award,
  Bell,
  Search,
  Filter,
  BarChart3,
  PieChart,
  UserPlus,
  CalendarPlus,
  AlertCircle,
  Timer,
  Target,
  Zap
} from 'lucide-react';

interface VeterinarianDashboardProps {
  veterinarianId?: string;
  onPatientSelect?: (patientId: string) => void;
  onAppointmentSchedule?: (appointmentData: any) => void;
  onEmergencyRespond?: (emergencyId: string) => void;
}

const VeterinarianDashboard: React.FC<VeterinarianDashboardProps> = ({
  veterinarianId = 'vet_001',
  onPatientSelect,
  onAppointmentSchedule,
  onEmergencyRespond
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardResponse,
        patientsResponse,
        appointmentsResponse,
        emergenciesResponse,
        inventoryResponse,
        treatmentsResponse,
        financialResponse
      ] = await Promise.all([
        fetch('/api/veterinarian-dashboard/overview'),
        fetch('/api/veterinarian-dashboard/patients'),
        fetch('/api/veterinarian-dashboard/appointments'),
        fetch('/api/veterinarian-dashboard/emergencies'),
        fetch('/api/veterinarian-dashboard/inventory'),
        fetch('/api/veterinarian-dashboard/treatments'),
        fetch('/api/veterinarian-dashboard/financial-summary')
      ]);

      const [
        dashboard,
        patientsData,
        appointmentsData,
        emergenciesData,
        inventoryData,
        treatmentsData,
        financialDataResponse
      ] = await Promise.all([
        dashboardResponse.json(),
        patientsResponse.json(),
        appointmentsResponse.json(),
        emergenciesResponse.json(),
        inventoryResponse.json(),
        treatmentsResponse.json(),
        financialResponse.json()
      ]);

      setDashboardData(dashboard.data);
      setPatients(patientsData.data);
      setAppointments(appointmentsData.data);
      setEmergencies(emergenciesData.data);
      setInventory(inventoryData.data);
      setTreatments(treatmentsData.data);
      setFinancialData(financialDataResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      // In a real app, this would make an API call
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleEmergencyStatusUpdate = async (emergencyId: string, newStatus: string) => {
    try {
      setEmergencies(prev => 
        prev.map(emergency => 
          emergency.id === emergencyId 
            ? { ...emergency, status: newStatus }
            : emergency
        )
      );
      
      if (onEmergencyRespond) {
        onEmergencyRespond(emergencyId);
      }
    } catch (error) {
      console.error('Error updating emergency:', error);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'under_treatment': return 'bg-yellow-100 text-yellow-800';
      case 'recovering': return 'bg-blue-100 text-blue-800';
      case 'critical': return 'bg-red-100 text-red-800 animate-pulse';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
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
          <h1 className="text-3xl font-bold text-blue-800" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'لوحة تحكم الطبيب البيطري' : 'Veterinarian Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة صحة الحيوانات والرعاية البيطرية' : 'Animal health management and veterinary care'}
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'المرضى المسجلين' : 'Total Patients'}</p>
                <p className="text-2xl font-bold">{dashboardData.metrics.totalPatients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'مواعيد اليوم' : 'Today\'s Appointments'}</p>
                <p className="text-2xl font-bold">{dashboardData.summary.todayAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'حالات الطوارئ' : 'Emergency Cases'}</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary.pendingEmergencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'العلاجات النشطة' : 'Active Treatments'}</p>
                <p className="text-2xl font-bold">{dashboardData.summary.activeTreatments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'معدل النجاح' : 'Success Rate'}</p>
                <p className="text-2xl font-bold">{dashboardData.metrics.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-teal-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isArabic ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardData.metrics.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Alerts */}
      {dashboardData.urgentCases.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Bell className="h-5 w-5 mr-2" />
              {isArabic ? 'حالات طوارئ عاجلة' : 'Urgent Emergency Cases'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.urgentCases.map((emergency: any) => (
                <Alert key={emergency.id} className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {isArabic ? emergency.patientNameArabic : emergency.patientName} - {isArabic ? emergency.descriptionArabic : emergency.description}
                    </span>
                    <Button size="sm" variant="destructive" onClick={() => handleEmergencyStatusUpdate(emergency.id, 'dispatched')}>
                      {isArabic ? 'استجابة' : 'Respond'}
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">{isArabic ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="patients">{isArabic ? 'المرضى' : 'Patients'}</TabsTrigger>
          <TabsTrigger value="appointments">{isArabic ? 'المواعيد' : 'Appointments'}</TabsTrigger>
          <TabsTrigger value="emergencies">{isArabic ? 'الطوارئ' : 'Emergencies'}</TabsTrigger>
          <TabsTrigger value="treatments">{isArabic ? 'العلاجات' : 'Treatments'}</TabsTrigger>
          <TabsTrigger value="inventory">{isArabic ? 'المخزون' : 'Inventory'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Veterinarian Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  {isArabic ? 'الملف الشخصي' : 'Profile'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isArabic ? dashboardData.profile.nameArabic : dashboardData.profile.name}
                      </h3>
                      <p className="text-gray-600">
                        {isArabic ? dashboardData.profile.specializationArabic : dashboardData.profile.specialization}
                      </p>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm">{dashboardData.profile.rating}/5</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({dashboardData.profile.completedConsultations} {isArabic ? 'استشارة' : 'consultations'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Award className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{isArabic ? 'رقم الترخيص' : 'License'}: {dashboardData.profile.licenseNumber}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      <span>{dashboardData.profile.experience} {isArabic ? 'سنوات خبرة' : 'years experience'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                      <span>{isArabic ? dashboardData.profile.locationArabic : dashboardData.profile.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-orange-600" />
                      <span>{dashboardData.profile.phone}</span>
                    </div>
                  </div>

                  <Badge className={`${dashboardData.profile.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isArabic ? 
                      (dashboardData.profile.availability === 'available' ? 'متاح' : 'غير متاح') :
                      dashboardData.profile.availability.replace('_', ' ')
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {isArabic ? 'المواعيد القادمة' : 'Upcoming Appointments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {isArabic ? appointment.patientNameArabic : appointment.patientName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isArabic ? appointment.typeArabic : appointment.type} • {isArabic ? appointment.ownerNameArabic : appointment.ownerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.scheduledDateTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getAppointmentStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {appointment.duration} {isArabic ? 'دقيقة' : 'min'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {isArabic ? 'مؤشرات الأداء' : 'Performance Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.avgConsultationTime}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'متوسط وقت الاستشارة (دقيقة)' : 'Avg Consultation Time (min)'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.patientSatisfaction}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'رضا المرضى' : 'Patient Satisfaction'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.treatmentComplianceRate}%</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'م��دل الالتزام بالعلاج' : 'Treatment Compliance'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.appointmentNoShows}</p>
                  <p className="text-xs text-gray-600">{isArabic ? 'الغياب عن المواعيد' : 'No-Shows This Month'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={isArabic ? 'البحث عن المرضى...' : 'Search patients...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'النوع' : 'Species'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الأنواع' : 'All Species'}</SelectItem>
                  <SelectItem value="cattle">{isArabic ? 'أبقار' : 'Cattle'}</SelectItem>
                  <SelectItem value="sheep">{isArabic ? 'أغنام' : 'Sheep'}</SelectItem>
                  <SelectItem value="goats">{isArabic ? 'ماعز' : 'Goats'}</SelectItem>
                  <SelectItem value="horses">{isArabic ? 'خيول' : 'Horses'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="healthy">{isArabic ? 'سليم' : 'Healthy'}</SelectItem>
                  <SelectItem value="sick">{isArabic ? 'مريض' : 'Sick'}</SelectItem>
                  <SelectItem value="under_treatment">{isArabic ? 'تحت العلاج' : 'Under Treatment'}</SelectItem>
                  <SelectItem value="critical">{isArabic ? 'حرج' : 'Critical'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة مريض' : 'Add Patient'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients
              .filter(patient => {
                const matchesSearch = !searchQuery || 
                  patient.animalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  patient.animalNameArabic.includes(searchQuery) ||
                  patient.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSpecies = filterSpecies === 'all' || patient.species.toLowerCase() === filterSpecies;
                const matchesStatus = filterStatus === 'all' || patient.healthStatus === filterStatus;
                return matchesSearch && matchesSpecies && matchesStatus;
              })
              .map((patient) => (
                <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{isArabic ? patient.animalNameArabic : patient.animalName}</span>
                      <Badge className={getHealthStatusColor(patient.healthStatus)}>
                        {patient.healthStatus}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? patient.speciesArabic : patient.species} • {patient.age} • {patient.weight}kg
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{isArabic ? patient.ownerNameArabic : patient.ownerName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-green-600" />
                        <span>{isArabic ? patient.farmNameArabic : patient.farmName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                        <span>{isArabic ? 'آخر فحص' : 'Last exam'}: {new Date(patient.lastExamination).toLocaleDateString()}</span>
                      </div>
                      {patient.nextScheduledVisit && (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-orange-600" />
                          <span>{isArabic ? 'الزيارة القادمة' : 'Next visit'}: {new Date(patient.nextScheduledVisit).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        {isArabic ? 'عرض' : 'View'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        {isArabic ? 'تحرير' : 'Edit'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={isArabic ? 'حالة الموعد' : 'Appointment Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="scheduled">{isArabic ? 'مجدول' : 'Scheduled'}</SelectItem>
                  <SelectItem value="confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                  <SelectItem value="in_progress">{isArabic ? 'جاري' : 'In Progress'}</SelectItem>
                  <SelectItem value="completed">{isArabic ? 'مكتمل' : 'Completed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              {isArabic ? 'حجز موعد' : 'Schedule Appointment'}
            </Button>
          </div>

          <div className="space-y-4">
            {appointments
              .filter(appointment => filterStatus === 'all' || appointment.status === filterStatus)
              .map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {isArabic ? appointment.patientNameArabic : appointment.patientName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isArabic ? appointment.ownerNameArabic : appointment.ownerName} • {isArabic ? appointment.typeArabic : appointment.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.scheduledDateTime).toLocaleString()} • {appointment.duration} {isArabic ? 'دقيقة' : 'min'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getAppointmentStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Badge className={getUrgencyColor(appointment.priority)}>
                          {appointment.priority}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setSelectedAppointment(appointment)}>
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                        {appointment.status === 'scheduled' && (
                          <Button size="sm" onClick={() => handleAppointmentStatusUpdate(appointment.id, 'confirmed')}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isArabic ? 'تأكيد' : 'Confirm'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {appointment.reason && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>{isArabic ? 'السبب' : 'Reason'}:</strong> {isArabic ? appointment.reasonArabic : appointment.reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Emergencies Tab */}
        <TabsContent value="emergencies" className="space-y-6">
          <div className="flex items-center justify-between">
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? 'مستوى الإلحاح' : 'Urgency Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</SelectItem>
                <SelectItem value="critical">{isArabic ? 'حرج' : 'Critical'}</SelectItem>
                <SelectItem value="high">{isArabic ? 'عالي' : 'High'}</SelectItem>
                <SelectItem value="moderate">{isArabic ? 'متوسط' : 'Moderate'}</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              {emergencies.filter(e => e.status !== 'resolved').length} {isArabic ? 'حالة نشطة' : 'active cases'}
            </div>
          </div>

          <div className="space-y-4">
            {emergencies
              .filter(emergency => filterUrgency === 'all' || emergency.urgencyLevel === filterUrgency)
              .map((emergency) => (
                <Card key={emergency.id} className={emergency.urgencyLevel === 'critical' ? 'border-red-500 bg-red-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          emergency.urgencyLevel === 'critical' ? 'bg-red-100' : 
                          emergency.urgencyLevel === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                        }`}>
                          <Zap className={`h-6 w-6 ${
                            emergency.urgencyLevel === 'critical' ? 'text-red-600' : 
                            emergency.urgencyLevel === 'high' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {isArabic ? emergency.patientNameArabic : emergency.patientName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isArabic ? emergency.ownerNameArabic : emergency.ownerName} • {isArabic ? emergency.speciesArabic : emergency.species}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isArabic ? 'تم الإبلاغ' : 'Reported'}: {new Date(emergency.reportedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getUrgencyColor(emergency.urgencyLevel)}>
                          {emergency.urgencyLevel}
                        </Badge>
                        <Badge className={emergency.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {emergency.status}
                        </Badge>
                        {emergency.status === 'reported' && (
                          <Button size="sm" variant="destructive" onClick={() => handleEmergencyStatusUpdate(emergency.id, 'dispatched')}>
                            <Zap className="h-3 w-3 mr-1" />
                            {isArabic ? 'استجابة' : 'Respond'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        <strong>{isArabic ? 'الوصف' : 'Description'}:</strong> {isArabic ? emergency.descriptionArabic : emergency.description}
                      </p>
                      <p className="text-sm mt-2">
                        <strong>{isArabic ? 'الأعراض' : 'Symptoms'}:</strong> {(isArabic ? emergency.symptomsArabic : emergency.symptoms).join(', ')}
                      </p>
                      {emergency.estimatedArrival && (
                        <p className="text-sm mt-2">
                          <strong>{isArabic ? 'وقت الوصول المتوقع' : 'Estimated Arrival'}:</strong> {new Date(emergency.estimatedArrival).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {treatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isArabic ? treatment.nameArabic : treatment.name}</span>
                    <Badge className={treatment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {treatment.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {isArabic ? treatment.patientNameArabic : treatment.patientName} • {isArabic ? treatment.ownerNameArabic : treatment.ownerName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{isArabic ? 'تقدم العلاج' : 'Treatment Progress'}</span>
                        <span className="text-sm">{treatment.progress}%</span>
                      </div>
                      <Progress value={treatment.progress} className="w-full" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{isArabic ? 'بدء العلاج' : 'Started'}: {new Date(treatment.startDate).toLocaleDateString()}</span>
                      </div>
                      {treatment.endDate && (
                        <div className="flex items-center text-sm">
                          <Target className="h-4 w-4 mr-2 text-green-600" />
                          <span>{isArabic ? 'تاريخ الانتهاء' : 'End Date'}: {new Date(treatment.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-purple-600" />
                        <span>{isArabic ? 'الفحص القادم' : 'Next Checkup'}: {new Date(treatment.nextCheckup).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        <strong>{isArabic ? 'التعليمات' : 'Instructions'}:</strong> {isArabic ? treatment.instructionsArabic : treatment.instructions}
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        {isArabic ? 'تفاصيل' : 'Details'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        {isArabic ? 'تحديث' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center justify-between">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? 'حالة المخزون' : 'Stock Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'جميع العناصر' : 'All Items'}</SelectItem>
                <SelectItem value="in_stock">{isArabic ? 'متوفر' : 'In Stock'}</SelectItem>
                <SelectItem value="low_stock">{isArabic ? 'مخزون منخفض' : 'Low Stock'}</SelectItem>
                <SelectItem value="out_of_stock">{isArabic ? 'نفد المخزون' : 'Out of Stock'}</SelectItem>
                <SelectItem value="expired">{isArabic ? 'منتهي الصلاحية' : 'Expired'}</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة عنصر' : 'Add Item'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory
              .filter(item => filterStatus === 'all' || item.status === filterStatus)
              .map((item) => (
                <Card key={item.id} className={item.status === 'low_stock' || item.status === 'expired' ? 'border-orange-200' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base">{isArabic ? item.nameArabic : item.name}</span>
                      <Badge className={
                        item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                        item.status === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                        item.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? item.categoryArabic : item.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{isArabic ? 'المخزون الحالي' : 'Current Stock'}</span>
                        <span className="font-semibold">{item.currentStock} {isArabic ? item.unitArabic : item.unit}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{isArabic ? 'الحد الأدنى' : 'Min'}: {item.minStockLevel}</span>
                          <span>{isArabic ? 'الحد ال��قصى' : 'Max'}: {item.maxStockLevel}</span>
                        </div>
                        <Progress 
                          value={(item.currentStock / item.maxStockLevel) * 100} 
                          className="w-full h-2"
                        />
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{isArabic ? 'التكلفة لكل وحدة' : 'Cost per unit'}</span>
                          <span>{formatCurrency(item.costPerUnit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{isArabic ? 'المورد' : 'Supplier'}</span>
                          <span className="text-xs">{isArabic ? item.supplierArabic : item.supplier}</span>
                        </div>
                        {item.expirationDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">{isArabic ? 'تاريخ الانتهاء' : 'Expires'}</span>
                            <span className="text-xs">{new Date(item.expirationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Package className="h-3 w-3 mr-1" />
                          {isArabic ? 'طلب' : 'Order'}
                        </Button>
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
            {/* Financial Summary */}
            {financialData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    {isArabic ? 'الملخص المالي' : 'Financial Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(financialData.monthlyRevenue)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(financialData.monthlyCosts)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'التكاليف الشهرية' : 'Monthly Costs'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialData.monthlyProfit)}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'الربح الشهري' : 'Monthly Profit'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">{isArabic ? 'الإيرادات حسب الخدمة' : 'Revenue by Service'}</h4>
                      {Object.entries(financialData.revenueByService).map(([service, amount]) => (
                        <div key={service} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {isArabic ? 'ملخص الأداء' : 'Performance Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.totalAppointments}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'إجمالي المواعيد' : 'Total Appointments'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.completedTreatments}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'العلاجات المكتملة' : 'Completed Treatments'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.emergencyCases}</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'حالات الطوارئ' : 'Emergency Cases'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.successRate}%</p>
                    <p className="text-xs text-gray-600">{isArabic ? 'معدل النجاح' : 'Success Rate'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? selectedPatient.animalNameArabic : selectedPatient.animalName}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? 'تفاصيل المريض والسجل الطبي' : 'Patient details and medical records'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'النوع' : 'Species'}</Label>
                  <p className="text-sm">{isArabic ? selectedPatient.speciesArabic : selectedPatient.species}</p>
                </div>
                <div>
                  <Label>{isArabic ? 'السلالة' : 'Breed'}</Label>
                  <p className="text-sm">{isArabic ? selectedPatient.breedArabic : selectedPatient.breed}</p>
                </div>
                <div>
                  <Label>{isArabic ? 'العمر' : 'Age'}</Label>
                  <p className="text-sm">{selectedPatient.age}</p>
                </div>
                <div>
                  <Label>{isArabic ? 'الوزن' : 'Weight'}</Label>
                  <p className="text-sm">{selectedPatient.weight} kg</p>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h3 className="font-semibold mb-3">{isArabic ? 'السجل الطبي' : 'Medical History'}</h3>
                <div className="space-y-3">
                  {selectedPatient.medicalHistory.map((record: any) => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{isArabic ? record.diagnosisArabic : record.diagnosis}</h4>
                        <Badge className={record.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {record.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm">{isArabic ? record.treatmentArabic : record.treatment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Treatments */}
              {selectedPatient.currentTreatments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">{isArabic ? 'العلاجات الحالية' : 'Current Treatments'}</h3>
                  <div className="space-y-3">
                    {selectedPatient.currentTreatments.map((treatment: any) => (
                      <div key={treatment.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{isArabic ? treatment.nameArabic : treatment.name}</h4>
                        <Progress value={treatment.progress} className="my-2" />
                        <p className="text-sm text-gray-600">{isArabic ? treatment.instructionsArabic : treatment.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default VeterinarianDashboard;
