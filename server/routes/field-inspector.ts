import { RequestHandler } from 'express';

// جدولة الزيارات الميدانية
interface FieldVisit {
  id: string;
  inspectorId: string;
  inspectorName: string;
  inspectorNameArabic: string;
  farmId: string;
  farmName: string;
  farmNameArabic: string;
  farmerName: string;
  farmerNameArabic: string;
  farmLocation: string;
  farmLocationArabic: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number; // بالدقائق
  visitType: 'routine' | 'follow_up' | 'emergency' | 'quality_check' | 'harvest_inspection' | 'soil_test';
  visitTypeArabic: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  objectives: string[];
  objectivesArabic: string[];
  equipment: string[];
  equipmentArabic: string[];
  weather: {
    expectedCondition: string;
    expectedConditionArabic: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  notes: string;
  notesArabic: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  reminders: Array<{
    time: string;
    message: string;
    messageArabic: string;
    sent: boolean;
  }>;
}

// الملاحظات الميدانية مع الوسائط
interface FieldNote {
  id: string;
  visitId: string;
  inspectorId: string;
  farmId: string;
  farmName: string;
  farmNameArabic: string;
  category: 'crop_condition' | 'soil_health' | 'pest_disease' | 'irrigation' | 'equipment' | 'general' | 'recommendation';
  categoryArabic: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: string;
  locationArabic: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  tags: string[];
  tagsArabic: string[];
  mediaFiles: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'document';
    filename: string;
    url: string;
    size: number;
    caption: string;
    captionArabic: string;
    uploadedAt: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
    };
  }>;
  recommendations: Array<{
    id: string;
    action: string;
    actionArabic: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deadline: string;
    assignedTo: string;
    assignedToArabic: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  relatedIssues: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  visibility: 'public' | 'inspector_only' | 'admin_only';
}

// تقييم جودة المحاصيل
interface CropQualityAssessment {
  id: string;
  visitId: string;
  farmId: string;
  cropType: string;
  cropTypeArabic: string;
  cropVariety: string;
  cropVarietyArabic: string;
  area: number; // بالهكتار
  plantingDate: string;
  growthStage: string;
  growthStageArabic: string;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  qualityScore: number; // من 100
  assessment: {
    appearance: {
      score: number;
      notes: string;
      notesArabic: string;
    };
    health: {
      score: number;
      diseases: string[];
      diseasesArabic: string[];
      pests: string[];
      pestsArabic: string[];
      notes: string;
      notesArabic: string;
    };
    maturity: {
      score: number;
      stage: string;
      stageArabic: string;
      expectedHarvest: string;
      notes: string;
      notesArabic: string;
    };
    yield: {
      expectedYield: number; // كيلوجرام/هكتار
      qualityGrade: 'A' | 'B' | 'C' | 'D';
      marketValue: number;
      notes: string;
      notesArabic: string;
    };
  };
  recommendations: Array<{
    type: 'immediate' | 'short_term' | 'long_term';
    action: string;
    actionArabic: string;
    reason: string;
    reasonArabic: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedCost: number;
    expectedBenefit: string;
    expectedBenefitArabic: string;
  }>;
  samplesCollected: Array<{
    id: string;
    type: 'soil' | 'plant' | 'fruit' | 'leaf' | 'water';
    typeArabic: string;
    quantity: string;
    location: string;
    locationArabic: string;
    testRequired: string;
    testRequiredArabic: string;
    labName: string;
    expectedResults: string;
  }>;
  photos: string[];
  timestamp: string;
  inspectorSignature: string;
}

// تقارير ميدانية
interface FieldReport {
  id: string;
  inspectorId: string;
  inspectorName: string;
  inspectorNameArabic: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'visit_summary' | 'quality_assessment' | 'emergency';
  reportTypeArabic: string;
  title: string;
  titleArabic: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVisits: number;
    completedVisits: number;
    postponedVisits: number;
    emergencyVisits: number;
    farmsVisited: number;
    issuesIdentified: number;
    recommendationsMade: number;
    followUpsRequired: number;
  };
  keyFindings: Array<{
    category: string;
    categoryArabic: string;
    finding: string;
    findingArabic: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedFarms: string[];
    recommendedAction: string;
    recommendedActionArabic: string;
  }>;
  visitDetails: FieldVisit[];
  qualityAssessments: CropQualityAssessment[];
  mediaAttachments: string[];
  recommendations: Array<{
    priority: 'immediate' | 'short_term' | 'long_term';
    target: 'farmer' | 'agronomist' | 'management' | 'government';
    action: string;
    actionArabic: string;
    reasoning: string;
    reasoningArabic: string;
    expectedOutcome: string;
    expectedOutcomeArabic: string;
    estimatedCost: number;
    implementationTimeline: string;
  }>;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  exportFormats: Array<{
    format: 'pdf' | 'excel' | 'word';
    url: string;
    generatedAt: string;
  }>;
}

// متابعة تنفيذ التوصيات
interface RecommendationTracking {
  id: string;
  recommendationId: string;
  sourceType: 'field_visit' | 'quality_assessment' | 'expert_advice' | 'report';
  sourceId: string;
  farmId: string;
  farmName: string;
  farmNameArabic: string;
  farmerName: string;
  farmerNameArabic: string;
  recommendation: string;
  recommendationArabic: string;
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'disease_treatment' | 'equipment' | 'technique';
  categoryArabic: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  assignedDate: string;
  assignedTo: string;
  assignedToArabic: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  progress: number; // نسبة مئوية
  implementationNotes: Array<{
    date: string;
    note: string;
    noteArabic: string;
    addedBy: string;
    addedByArabic: string;
    photos?: string[];
  }>;
  impact: {
    costSaved: number;
    yieldImprovement: number;
    qualityImprovement: number;
    timeReduction: number;
    otherBenefits: string;
    otherBenefitsArabic: string;
  };
  followUpSchedule: Array<{
    date: string;
    type: 'phone_call' | 'field_visit' | 'photo_verification' | 'report_review';
    typeArabic: string;
    completed: boolean;
    notes?: string;
    notesArabic?: string;
  }>;
  completionCertification: {
    certifiedBy: string;
    certifiedByArabic: string;
    certificationDate: string;
    verificationPhotos: string[];
    effectiveness: 'very_effective' | 'effective' | 'somewhat_effective' | 'not_effective';
    farmerFeedback: string;
    farmerFeedbackArabic: string;
    inspectorNotes: string;
    inspectorNotesArabic: string;
  };
}

// ملف المراقب
interface InspectorProfile {
  id: string;
  name: string;
  nameArabic: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: string[];
  specializationArabic: string[];
  experience: number;
  assignedRegions: string[];
  assignedRegionsArabic: string[];
  qualifications: Array<{
    title: string;
    titleArabic: string;
    institution: string;
    institutionArabic: string;
    year: number;
    certificateUrl?: string;
  }>;
  currentWorkload: {
    scheduledVisits: number;
    pendingReports: number;
    overdueFollowUps: number;
    activeRecommendations: number;
  };
  performance: {
    totalVisits: number;
    completedOnTime: number;
    averageQualityScore: number;
    farmerSatisfaction: number;
    recommendationSuccessRate: number;
  };
  availability: 'available' | 'busy' | 'off_duty' | 'on_leave';
  lastActive: string;
}

class FieldInspectorService {
  private generateMockInspectorProfile(): InspectorProfile {
    return {
      id: 'inspector_001',
      name: 'Ahmad Field Inspector',
      nameArabic: 'أحمد مراقب الحقول',
      email: 'ahmad.inspector@agrigrowth.tn',
      phone: '+216 98 765 432',
      licenseNumber: 'FI-TN-2021-001',
      specialization: ['Crop Quality Assessment', 'Soil Analysis', 'Pest Management'],
      specializationArabic: ['تقييم جودة المحاصيل', 'تحليل التربة', 'إدارة الآفات'],
      experience: 6,
      assignedRegions: ['Tunis North', 'Ariana', 'Ben Arous'],
      assignedRegionsArabic: ['تونس الشمالية', 'أريانة', 'بن عروس'],
      qualifications: [
        {
          title: 'Agricultural Engineering',
          titleArabic: 'هندسة زراعية',
          institution: 'INAT Tunisia',
          institutionArabic: 'المع��د الوطني الزراعي بتونس',
          year: 2018
        },
        {
          title: 'Field Inspection Certification',
          titleArabic: 'شهادة مراقبة الحقول',
          institution: 'Ministry of Agriculture',
          institutionArabic: 'وزارة الفلاحة',
          year: 2019
        }
      ],
      currentWorkload: {
        scheduledVisits: 12,
        pendingReports: 3,
        overdueFollowUps: 2,
        activeRecommendations: 8
      },
      performance: {
        totalVisits: 342,
        completedOnTime: 89.2,
        averageQualityScore: 4.6,
        farmerSatisfaction: 4.3,
        recommendationSuccessRate: 78.5
      },
      availability: 'available',
      lastActive: new Date().toISOString()
    };
  }

  private generateMockFieldVisits(): FieldVisit[] {
    const visitTypes = [
      { type: 'routine', typeArabic: 'زيارة روتينية' },
      { type: 'follow_up', typeArabic: 'متابعة' },
      { type: 'emergency', typeArabic: 'طارئة' },
      { type: 'quality_check', typeArabic: 'فحص جودة' },
      { type: 'harvest_inspection', typeArabic: 'فحص حصاد' },
      { type: 'soil_test', typeArabic: 'فحص تربة' }
    ];

    return Array.from({ length: 15 }, (_, index) => {
      const visitType = visitTypes[Math.floor(Math.random() * visitTypes.length)];
      const priorities: FieldVisit['priority'][] = ['low', 'medium', 'high', 'urgent'];
      const statuses: FieldVisit['status'][] = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];
      
      return {
        id: `visit_${String(index + 1).padStart(3, '0')}`,
        inspectorId: 'inspector_001',
        inspectorName: 'Ahmad Field Inspector',
        inspectorNameArabic: 'أحمد مراقب الحقول',
        farmId: `farm_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        farmName: `Farm ${Math.floor(Math.random() * 20) + 1}`,
        farmNameArabic: `مزرعة ${Math.floor(Math.random() * 20) + 1}`,
        farmerName: `Farmer ${Math.floor(Math.random() * 10) + 1}`,
        farmerNameArabic: `فلاح ${Math.floor(Math.random() * 10) + 1}`,
        farmLocation: `Area ${Math.floor(Math.random() * 5) + 1}, Tunis`,
        farmLocationArabic: `منطقة ${Math.floor(Math.random() * 5) + 1}، تونس`,
        scheduledDate: new Date(Date.now() + (Math.random() - 0.3) * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduledTime: `${String(Math.floor(Math.random() * 8) + 8).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
        estimatedDuration: [60, 90, 120, 150, 180][Math.floor(Math.random() * 5)],
        visitType: visitType.type as any,
        visitTypeArabic: visitType.typeArabic,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        objectives: ['Crop health assessment', 'Soil moisture check', 'Pest inspection'],
        objectivesArabic: ['تقييم صحة المحاصيل', 'فحص رطوبة التربة', 'فحص الآفات'],
        equipment: ['pH meter', 'Moisture sensor', 'Camera', 'Sample containers'],
        equipmentArabic: ['مقياس الحموضة', 'مستشعر الرطوبة', 'كاميرا', 'حاويات العينات'],
        weather: {
          expectedCondition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
          expectedConditionArabic: ['مشمس', 'غائم جزئياً', 'غائم'][Math.floor(Math.random() * 3)],
          temperature: Math.round(15 + Math.random() * 20),
          humidity: Math.round(40 + Math.random() * 40),
          windSpeed: Math.round(Math.random() * 20)
        },
        notes: `Visit notes for farm ${index + 1}`,
        notesArabic: `ملاحظات زيارة مزرعة ${index + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: Math.random() > 0.6 ? new Date().toISOString() : undefined,
        gpsCoordinates: {
          latitude: 36.8 + (Math.random() - 0.5) * 0.2,
          longitude: 10.1 + (Math.random() - 0.5) * 0.2
        },
        reminders: [
          {
            time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            message: 'Field visit reminder - 24 hours',
            messageArabic: 'تذكير زيارة الحقل - 24 ساعة',
            sent: false
          },
          {
            time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            message: 'Field visit reminder - 2 hours',
            messageArabic: 'تذكير زيارة الحقل - ساعتان',
            sent: false
          }
        ]
      };
    });
  }

  private generateMockFieldNotes(): FieldNote[] {
    const categories = [
      { category: 'crop_condition', categoryArabic: 'حالة المحاصيل' },
      { category: 'soil_health', categoryArabic: 'صحة التربة' },
      { category: 'pest_disease', categoryArabic: 'آفات وأمراض' },
      { category: 'irrigation', categoryArabic: 'الري' },
      { category: 'equipment', categoryArabic: 'المعدات' },
      { category: 'general', categoryArabic: 'عام' },
      { category: 'recommendation', categoryArabic: 'توصية' }
    ];

    return Array.from({ length: 25 }, (_, index) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const severities: FieldNote['severity'][] = ['info', 'low', 'medium', 'high', 'critical'];
      
      return {
        id: `note_${String(index + 1).padStart(3, '0')}`,
        visitId: `visit_${String(Math.floor(Math.random() * 15) + 1).padStart(3, '0')}`,
        inspectorId: 'inspector_001',
        farmId: `farm_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        farmName: `Farm ${Math.floor(Math.random() * 20) + 1}`,
        farmNameArabic: `مزرعة ${Math.floor(Math.random() * 20) + 1}`,
        category: category.category as any,
        categoryArabic: category.categoryArabic,
        title: `Field observation ${index + 1}`,
        titleArabic: `ملاحظة ميدانية ${index + 1}`,
        description: `Detailed field observation about ${category.category.replace('_', ' ')}`,
        descriptionArabic: `ملاحظة ميدانية تفصيلية حول ${category.categoryArabic}`,
        severity: severities[Math.floor(Math.random() * severities.length)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: `Field Section ${Math.floor(Math.random() * 10) + 1}`,
        locationArabic: `قسم الحقل ${Math.floor(Math.random() * 10) + 1}`,
        gpsCoordinates: {
          latitude: 36.8 + (Math.random() - 0.5) * 0.2,
          longitude: 10.1 + (Math.random() - 0.5) * 0.2
        },
        tags: ['inspection', 'quality', 'monitoring'],
        tagsArabic: ['فحص', 'جودة', 'مراقبة'],
        mediaFiles: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, mediaIndex) => ({
          id: `media_${index}_${mediaIndex}`,
          type: ['image', 'video', 'audio', 'document'][Math.floor(Math.random() * 4)] as any,
          filename: `field_media_${index}_${mediaIndex}.jpg`,
          url: `/uploads/field_media_${index}_${mediaIndex}.jpg`,
          size: Math.floor(Math.random() * 5000000) + 100000,
          caption: `Field photo ${mediaIndex + 1}`,
          captionArabic: `صورة ميدانية ${mediaIndex + 1}`,
          uploadedAt: new Date().toISOString(),
          metadata: {
            width: 1920,
            height: 1080,
            format: 'JPEG'
          }
        })),
        recommendations: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, recIndex) => ({
          id: `rec_${index}_${recIndex}`,
          action: `Recommended action ${recIndex + 1}`,
          actionArabic: `إجراء موصى به ${recIndex + 1}`,
          priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
          deadline: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assignedTo: `Worker ${Math.floor(Math.random() * 5) + 1}`,
          assignedToArabic: `عامل ${Math.floor(Math.random() * 5) + 1}`,
          status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as any
        })),
        relatedIssues: [`issue_${Math.floor(Math.random() * 10) + 1}`],
        followUpRequired: Math.random() > 0.5,
        followUpDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        visibility: ['public', 'inspector_only', 'admin_only'][Math.floor(Math.random() * 3)] as any
      };
    });
  }

  private generateMockQualityAssessments(): CropQualityAssessment[] {
    const crops = [
      { type: 'Wheat', typeArabic: 'قمح' },
      { type: 'Tomatoes', typeArabic: 'طماطم' },
      { type: 'Olives', typeArabic: 'زيتون' },
      { type: 'Citrus', typeArabic: 'حمضيات' },
      { type: 'Dates', typeArabic: 'تمر' }
    ];

    return Array.from({ length: 12 }, (_, index) => {
      const crop = crops[Math.floor(Math.random() * crops.length)];
      const qualityStatuses: CropQualityAssessment['overallQuality'][] = ['excellent', 'good', 'fair', 'poor', 'critical'];
      const overallQuality = qualityStatuses[Math.floor(Math.random() * qualityStatuses.length)];
      const qualityScore = overallQuality === 'excellent' ? 85 + Math.random() * 15 :
                          overallQuality === 'good' ? 70 + Math.random() * 15 :
                          overallQuality === 'fair' ? 50 + Math.random() * 20 :
                          overallQuality === 'poor' ? 30 + Math.random() * 20 : Math.random() * 30;

      return {
        id: `assessment_${String(index + 1).padStart(3, '0')}`,
        visitId: `visit_${String(Math.floor(Math.random() * 15) + 1).padStart(3, '0')}`,
        farmId: `farm_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        cropType: crop.type,
        cropTypeArabic: crop.typeArabic,
        cropVariety: 'Local Variety',
        cropVarietyArabic: 'صنف محلي',
        area: Math.round((Math.random() * 10 + 1) * 10) / 10,
        plantingDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        growthStage: ['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity'][Math.floor(Math.random() * 5)],
        growthStageArabic: ['إنبات', 'نمو خضري', 'إزهار', 'إثمار', 'نضج'][Math.floor(Math.random() * 5)],
        overallQuality,
        qualityScore: Math.round(qualityScore),
        assessment: {
          appearance: {
            score: Math.round(qualityScore + (Math.random() - 0.5) * 20),
            notes: 'Visual assessment of crop appearance',
            notesArabic: 'تقييم بصري لمظهر المحصول'
          },
          health: {
            score: Math.round(qualityScore + (Math.random() - 0.5) * 20),
            diseases: Math.random() > 0.7 ? ['Fungal infection'] : [],
            diseasesArabic: Math.random() > 0.7 ? ['عدوى فطرية'] : [],
            pests: Math.random() > 0.6 ? ['Aphids'] : [],
            pestsArabic: Math.random() > 0.6 ? ['المن'] : [],
            notes: 'Crop health evaluation',
            notesArabic: 'تقييم صحة المحصول'
          },
          maturity: {
            score: Math.round(qualityScore + (Math.random() - 0.5) * 20),
            stage: ['Early', 'Mid', 'Late'][Math.floor(Math.random() * 3)],
            stageArabic: ['مبكر', 'متوسط', 'متأخر'][Math.floor(Math.random() * 3)],
            expectedHarvest: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Maturity assessment',
            notesArabic: 'تقييم النضج'
          },
          yield: {
            expectedYield: Math.floor(Math.random() * 5000) + 1000,
            qualityGrade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as any,
            marketValue: Math.floor(Math.random() * 10000) + 2000,
            notes: 'Yield prediction',
            notesArabic: 'توقع الإنتاج'
          }
        },
        recommendations: [
          {
            type: 'immediate',
            action: 'Apply organic fertilizer',
            actionArabic: 'تطبيق السماد العضوي',
            reason: 'Nutrient deficiency observed',
            reasonArabic: 'لوحظ نقص في المغذيات',
            priority: 'high',
            estimatedCost: 250,
            expectedBenefit: '15% yield increase',
            expectedBenefitArabic: 'زيادة الإنتاج بنسبة 15%'
          }
        ],
        samplesCollected: [
          {
            id: `sample_${index}_1`,
            type: 'soil',
            typeArabic: 'تربة',
            quantity: '500g',
            location: 'Field center',
            locationArabic: 'وسط الحقل',
            testRequired: 'NPK analysis',
            testRequiredArabic: 'تحليل NPK',
            labName: 'Agricultural Lab Tunis',
            expectedResults: '7-10 days'
          }
        ],
        photos: [`/uploads/quality_${index}_1.jpg`, `/uploads/quality_${index}_2.jpg`],
        timestamp: new Date().toISOString(),
        inspectorSignature: 'Ahmad Field Inspector'
      };
    });
  }

  private generateMockReports(): FieldReport[] {
    return Array.from({ length: 8 }, (_, index) => {
      const reportTypes = [
        { type: 'daily', typeArabic: 'يومي' },
        { type: 'weekly', typeArabic: 'أسبوعي' },
        { type: 'monthly', typeArabic: 'شهري' },
        { type: 'visit_summary', typeArabic: 'ملخص زيارة' },
        { type: 'quality_assessment', typeArabic: 'تقييم جودة' },
        { type: 'emergency', typeArabic: 'طارئ' }
      ];
      
      const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      
      return {
        id: `report_${String(index + 1).padStart(3, '0')}`,
        inspectorId: 'inspector_001',
        inspectorName: 'Ahmad Field Inspector',
        inspectorNameArabic: 'أحمد مراقب الحقول',
        reportType: reportType.type as any,
        reportTypeArabic: reportType.typeArabic,
        title: `${reportType.type.replace('_', ' ')} Report ${index + 1}`,
        titleArabic: `تقرير ${reportType.typeArabic} ${index + 1}`,
        period: {
          startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        summary: {
          totalVisits: Math.floor(Math.random() * 20) + 5,
          completedVisits: Math.floor(Math.random() * 15) + 3,
          postponedVisits: Math.floor(Math.random() * 3),
          emergencyVisits: Math.floor(Math.random() * 2),
          farmsVisited: Math.floor(Math.random() * 15) + 5,
          issuesIdentified: Math.floor(Math.random() * 10) + 2,
          recommendationsMade: Math.floor(Math.random() * 15) + 5,
          followUpsRequired: Math.floor(Math.random() * 8) + 2
        },
        keyFindings: [
          {
            category: 'Quality',
            categoryArabic: 'الجودة',
            finding: 'Overall crop quality improved by 12%',
            findingArabic: 'تحسنت جودة المحاصيل الإجمالية بنسبة 12%',
            severity: 'medium',
            affectedFarms: ['farm_001', 'farm_003', 'farm_007'],
            recommendedAction: 'Continue current practices',
            recommendedActionArabic: 'استمرار الممارسات الحالية'
          }
        ],
        visitDetails: this.generateMockFieldVisits().slice(0, 3),
        qualityAssessments: this.generateMockQualityAssessments().slice(0, 2),
        mediaAttachments: [`/uploads/report_${index}_attachment.pdf`],
        recommendations: [
          {
            priority: 'immediate',
            target: 'farmer',
            action: 'Implement pest control measures',
            actionArabic: 'تنفيذ إجراءات مكافحة الآفات',
            reasoning: 'Pest infestation observed in multiple fields',
            reasoningArabic: 'لوحظت إصابة بالآفات في حقول متعددة',
            expectedOutcome: 'Reduce crop damage by 80%',
            expectedOutcomeArabic: 'تقليل ضرر المحاصيل بنسبة 80%',
            estimatedCost: 500,
            implementationTimeline: '1-2 weeks'
          }
        ],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: Math.random() > 0.3 ? new Date().toISOString() : undefined,
        approvedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        approvedBy: Math.random() > 0.5 ? 'Management Team' : undefined,
        status: ['draft', 'submitted', 'approved', 'rejected'][Math.floor(Math.random() * 4)] as any,
        exportFormats: [
          {
            format: 'pdf',
            url: `/exports/report_${index}.pdf`,
            generatedAt: new Date().toISOString()
          },
          {
            format: 'excel',
            url: `/exports/report_${index}.xlsx`,
            generatedAt: new Date().toISOString()
          }
        ]
      };
    });
  }

  private generateMockRecommendationTracking(): RecommendationTracking[] {
    return Array.from({ length: 15 }, (_, index) => {
      const categories = [
        { category: 'irrigation', categoryArabic: 'الري' },
        { category: 'fertilization', categoryArabic: 'التسميد' },
        { category: 'pest_control', categoryArabic: 'مكافحة الآفات' },
        { category: 'disease_treatment', categoryArabic: 'علاج الأمراض' },
        { category: 'equipment', categoryArabic: 'المعدات' },
        { category: 'technique', categoryArabic: 'التقنية' }
      ];
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const statuses: RecommendationTracking['status'][] = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'];
      
      return {
        id: `tracking_${String(index + 1).padStart(3, '0')}`,
        recommendationId: `rec_${String(index + 1).padStart(3, '0')}`,
        sourceType: ['field_visit', 'quality_assessment', 'expert_advice', 'report'][Math.floor(Math.random() * 4)] as any,
        sourceId: `source_${String(index + 1).padStart(3, '0')}`,
        farmId: `farm_${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        farmName: `Farm ${Math.floor(Math.random() * 20) + 1}`,
        farmNameArabic: `مزرعة ${Math.floor(Math.random() * 20) + 1}`,
        farmerName: `Farmer ${Math.floor(Math.random() * 10) + 1}`,
        farmerNameArabic: `فلاح ${Math.floor(Math.random() * 10) + 1}`,
        recommendation: `Implement ${category.category.replace('_', ' ')} improvement`,
        recommendationArabic: `تنفيذ تحسين ${category.categoryArabic}`,
        category: category.category as any,
        categoryArabic: category.categoryArabic,
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
        deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: `Worker ${Math.floor(Math.random() * 5) + 1}`,
        assignedToArabic: `عامل ${Math.floor(Math.random() * 5) + 1}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        progress: Math.floor(Math.random() * 100),
        implementationNotes: [
          {
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            note: 'Started implementation of recommendation',
            noteArabic: 'بدء تنفيذ التوصية',
            addedBy: 'Field Worker',
            addedByArabic: 'عامل الحقل',
            photos: [`/uploads/implementation_${index}_1.jpg`]
          }
        ],
        impact: {
          costSaved: Math.floor(Math.random() * 1000),
          yieldImprovement: Math.round(Math.random() * 20 * 10) / 10,
          qualityImprovement: Math.round(Math.random() * 15 * 10) / 10,
          timeReduction: Math.round(Math.random() * 10 * 10) / 10,
          otherBenefits: 'Improved soil health',
          otherBenefitsArabic: 'تحسن صحة التربة'
        },
        followUpSchedule: [
          {
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'field_visit',
            typeArabic: 'زيارة ميدانية',
            completed: false
          }
        ],
        completionCertification: {
          certifiedBy: 'Ahmad Field Inspector',
          certifiedByArabic: 'أحمد مراقب الحقول',
          certificationDate: new Date().toISOString().split('T')[0],
          verificationPhotos: [`/uploads/verification_${index}.jpg`],
          effectiveness: ['very_effective', 'effective', 'somewhat_effective', 'not_effective'][Math.floor(Math.random() * 4)] as any,
          farmerFeedback: 'Very satisfied with the results',
          farmerFeedbackArabic: 'راضٍ جداً عن النتائج',
          inspectorNotes: 'Recommendation implemented successfully',
          inspectorNotesArabic: 'تم تنفيذ التوصية بنجاح'
        }
      };
    });
  }

  getDashboardOverview(): any {
    const profile = this.generateMockInspectorProfile();
    const visits = this.generateMockFieldVisits();
    const notes = this.generateMockFieldNotes();
    const assessments = this.generateMockQualityAssessments();
    const reports = this.generateMockReports();
    const tracking = this.generateMockRecommendationTracking();

    return {
      success: true,
      data: {
        profile,
        summary: {
          todayVisits: visits.filter(v => v.scheduledDate === new Date().toISOString().split('T')[0]).length,
          upcomingVisits: visits.filter(v => new Date(v.scheduledDate) > new Date()).length,
          completedVisits: visits.filter(v => v.status === 'completed').length,
          pendingReports: reports.filter(r => r.status === 'draft').length,
          activeRecommendations: tracking.filter(t => t.status === 'in_progress').length,
          overdueFollowUps: tracking.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length,
          criticalIssues: notes.filter(n => n.severity === 'critical').length,
          averageQualityScore: Math.round(assessments.reduce((acc, a) => acc + a.qualityScore, 0) / assessments.length)
        },
        recentVisits: visits.slice(0, 5),
        recentNotes: notes.slice(0, 8),
        urgentTasks: tracking.filter(t => t.priority === 'urgent').slice(0, 5),
        qualityTrends: {
          thisMonth: Math.round(Math.random() * 20 + 70),
          lastMonth: Math.round(Math.random() * 20 + 65),
          improvement: Math.round((Math.random() - 0.5) * 10 * 10) / 10
        },
        lastUpdated: new Date().toISOString()
      }
    };
  }

  getFieldVisits(): any {
    return {
      success: true,
      data: this.generateMockFieldVisits()
    };
  }

  getFieldNotes(): any {
    return {
      success: true,
      data: this.generateMockFieldNotes()
    };
  }

  getQualityAssessments(): any {
    return {
      success: true,
      data: this.generateMockQualityAssessments()
    };
  }

  getReports(): any {
    return {
      success: true,
      data: this.generateMockReports()
    };
  }

  getRecommendationTracking(): any {
    return {
      success: true,
      data: this.generateMockRecommendationTracking()
    };
  }

  getInspectorProfile(): any {
    return {
      success: true,
      data: this.generateMockInspectorProfile()
    };
  }
}

const fieldInspectorService = new FieldInspectorService();

export const getFieldInspectorDashboard: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getDashboardOverview();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch field inspector dashboard' });
  }
};

export const getFieldInspectorVisits: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getFieldVisits();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch field visits' });
  }
};

export const getFieldInspectorNotes: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getFieldNotes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch field notes' });
  }
};

export const getFieldInspectorQualityAssessments: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getQualityAssessments();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch quality assessments' });
  }
};

export const getFieldInspectorReports: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getReports();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
};

export const getFieldInspectorRecommendationTracking: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getRecommendationTracking();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch recommendation tracking' });
  }
};

export const getFieldInspectorProfile: RequestHandler = (req, res) => {
  try {
    const result = fieldInspectorService.getInspectorProfile();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inspector profile' });
  }
};
