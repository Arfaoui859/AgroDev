import { RequestHandler } from 'express';

interface VeterinarianProfile {
  id: string;
  name: string;
  nameArabic: string;
  specialization: string;
  specializationArabic: string;
  licenseNumber: string;
  experience: number;
  location: string;
  locationArabic: string;
  phone: string;
  email: string;
  availability: 'available' | 'busy' | 'emergency_only';
  rating: number;
  completedConsultations: number;
  profileImage?: string;
}

interface AnimalPatient {
  id: string;
  animalId: string;
  animalName: string;
  animalNameArabic: string;
  species: string;
  speciesArabic: string;
  breed: string;
  breedArabic: string;
  age: string;
  weight: number;
  ownerId: string;
  ownerName: string;
  ownerNameArabic: string;
  farmName: string;
  farmNameArabic: string;
  location: string;
  locationArabic: string;
  healthStatus: 'healthy' | 'sick' | 'under_treatment' | 'recovering' | 'critical';
  lastExamination: string;
  nextScheduledVisit?: string;
  medicalHistory: MedicalRecord[];
  currentTreatments: Treatment[];
  vaccinations: Vaccination[];
  notes: string;
  notesArabic: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  diagnosisArabic: string;
  symptoms: string[];
  symptomsArabic: string[];
  treatment: string;
  treatmentArabic: string;
  medications: Medication[];
  followUpRequired: boolean;
  followUpDate?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'chronic';
  cost: number;
  notes: string;
  notesArabic: string;
}

interface Treatment {
  id: string;
  name: string;
  nameArabic: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused' | 'discontinued';
  progress: number;
  medications: Medication[];
  instructions: string;
  instructionsArabic: string;
  nextCheckup: string;
  expectedOutcome: string;
  expectedOutcomeArabic: string;
}

interface Medication {
  id: string;
  name: string;
  nameArabic: string;
  dosage: string;
  frequency: string;
  frequencyArabic: string;
  duration: string;
  durationArabic: string;
  route: 'oral' | 'injection' | 'topical' | 'intravenous';
  routeArabic: string;
  sideEffects: string[];
  sideEffectsArabic: string[];
  cost: number;
  supplier: string;
}

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineNameArabic: string;
  dateAdministered: string;
  nextDueDate: string;
  batchNumber: string;
  administeredBy: string;
  location: string;
  locationArabic: string;
  status: 'completed' | 'overdue' | 'scheduled';
  sideEffects?: string[];
  sideEffectsArabic?: string[];
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientNameArabic: string;
  ownerId: string;
  ownerName: string;
  ownerNameArabic: string;
  farmName: string;
  farmNameArabic: string;
  scheduledDateTime: string;
  duration: number;
  type: 'consultation' | 'emergency' | 'surgery' | 'vaccination' | 'checkup' | 'follow_up';
  typeArabic: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  reason: string;
  reasonArabic: string;
  location: string;
  locationArabic: string;
  estimatedCost: number;
  actualCost?: number;
  notes: string;
  notesArabic: string;
  symptoms?: string[];
  symptomsArabic?: string[];
}

interface EmergencyCase {
  id: string;
  reportedAt: string;
  patientId: string;
  patientName: string;
  patientNameArabic: string;
  species: string;
  speciesArabic: string;
  ownerId: string;
  ownerName: string;
  ownerNameArabic: string;
  location: string;
  locationArabic: string;
  urgencyLevel: 'critical' | 'high' | 'moderate';
  status: 'reported' | 'dispatched' | 'on_site' | 'treating' | 'resolved' | 'referred';
  symptoms: string[];
  symptomsArabic: string[];
  description: string;
  descriptionArabic: string;
  estimatedArrival?: string;
  treatmentStarted?: boolean;
  outcome?: string;
  outcomeArabic?: string;
  referredTo?: string;
  cost: number;
}

interface InventoryItem {
  id: string;
  name: string;
  nameArabic: string;
  category: 'medications' | 'vaccines' | 'equipment' | 'supplies';
  categoryArabic: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  unitArabic: string;
  costPerUnit: number;
  supplier: string;
  supplierArabic: string;
  expirationDate?: string;
  batchNumber?: string;
  location: string;
  locationArabic: string;
  lastRestocked: string;
  usageRate: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface PerformanceMetrics {
  totalPatients: number;
  totalAppointments: number;
  completedTreatments: number;
  emergencyCases: number;
  successRate: number;
  avgConsultationTime: number;
  revenue: number;
  costs: number;
  profit: number;
  patientSatisfaction: number;
  appointmentNoShows: number;
  treatmentComplianceRate: number;
}

class VeterinarianDashboardService {
  private generateMockVeterinarianProfile(): VeterinarianProfile {
    return {
      id: 'vet_001',
      name: 'Dr. Ahmad Veterinarian',
      nameArabic: 'د. أحمد الطبيب البيطري',
      specialization: 'Large Animal Medicine',
      specializationArabic: 'طب الحيوانات الكبيرة',
      licenseNumber: 'VET-TN-2020-001',
      experience: 8,
      location: 'Tunis Veterinary Clinic',
      locationArabic: 'عيادة تونس البيطرية',
      phone: '+216 71 234 567',
      email: 'ahmad.vet@clinic.tn',
      availability: 'available',
      rating: 4.8,
      completedConsultations: 1247,
      profileImage: '/images/vet-profile.jpg'
    };
  }

  private generateMockPatients(): AnimalPatient[] {
    const species = [
      { en: 'Cattle', ar: 'أبقار' },
      { en: 'Sheep', ar: 'أغنام' },
      { en: 'Goats', ar: 'ماعز' },
      { en: 'Horses', ar: 'خيول' },
      { en: 'Poultry', ar: 'دواجن' }
    ];

    const healthStatuses: AnimalPatient['healthStatus'][] = ['healthy', 'sick', 'under_treatment', 'recovering', 'critical'];

    return Array.from({ length: 25 }, (_, index) => {
      const speciesData = species[Math.floor(Math.random() * species.length)];
      const healthStatus = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
      
      return {
        id: `patient_${String(index + 1).padStart(3, '0')}`,
        animalId: `animal_${String(index + 1).padStart(3, '0')}`,
        animalName: `Animal ${index + 1}`,
        animalNameArabic: `حيوان ${index + 1}`,
        species: speciesData.en,
        speciesArabic: speciesData.ar,
        breed: 'Local Breed',
        breedArabic: 'سلالة محلية',
        age: `${Math.floor(Math.random() * 8) + 1} years`,
        weight: Math.floor(Math.random() * 500) + 100,
        ownerId: `owner_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
        ownerName: `Farmer ${Math.floor(Math.random() * 10) + 1}`,
        ownerNameArabic: `فلاح ${Math.floor(Math.random() * 10) + 1}`,
        farmName: `Farm ${Math.floor(Math.random() * 15) + 1}`,
        farmNameArabic: `مزرعة ${Math.floor(Math.random() * 15) + 1}`,
        location: 'Tunis Region',
        locationArabic: 'منطقة تونس',
        healthStatus,
        lastExamination: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextScheduledVisit: healthStatus !== 'healthy' ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        medicalHistory: this.generateMockMedicalHistory(),
        currentTreatments: healthStatus === 'under_treatment' ? this.generateMockTreatments() : [],
        vaccinations: this.generateMockVaccinations(),
        notes: `Patient notes for animal ${index + 1}`,
        notesArabic: `ملاحظات المريض للحيوان ${index + 1}`
      };
    });
  }

  private generateMockMedicalHistory(): MedicalRecord[] {
    const diagnoses = [
      { en: 'Respiratory Infection', ar: 'التهاب الجهاز التنفسي' },
      { en: 'Digestive Issues', ar: 'مشاكل هضمية' },
      { en: 'Skin Condition', ar: 'حالة جلدية' },
      { en: 'Joint Pain', ar: 'ألم المفاصل' },
      { en: 'Eye Infection', ar: 'التهاب العين' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, index) => {
      const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
      
      return {
        id: `record_${index + 1}`,
        date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: diagnosis.en,
        diagnosisArabic: diagnosis.ar,
        symptoms: ['Fever', 'Loss of appetite', 'Lethargy'],
        symptomsArabic: ['حمى', 'فقدان الشهية', 'خمول'],
        treatment: 'Antibiotic treatment',
        treatmentArabic: 'علاج بالمضادات الحيوية',
        medications: this.generateMockMedications(),
        followUpRequired: Math.random() > 0.5,
        followUpDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        status: ['active', 'resolved', 'chronic'][Math.floor(Math.random() * 3)] as any,
        cost: Math.floor(Math.random() * 200) + 50,
        notes: 'Medical record notes',
        notesArabic: 'ملاحظات السجل الطبي'
      };
    });
  }

  private generateMockTreatments(): Treatment[] {
    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, index) => ({
      id: `treatment_${index + 1}`,
      name: `Treatment Plan ${index + 1}`,
      nameArabic: `خطة العلاج ${index + 1}`,
      startDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['active', 'completed', 'paused'][Math.floor(Math.random() * 3)] as any,
      progress: Math.floor(Math.random() * 100),
      medications: this.generateMockMedications(),
      instructions: 'Follow treatment instructions carefully',
      instructionsArabic: 'اتبع تعليمات العلاج بعناية',
      nextCheckup: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      expectedOutcome: 'Full recovery expected',
      expectedOutcomeArabic: 'توقع الشفاء التام'
    }));
  }

  private generateMockMedications(): Medication[] {
    const medications = [
      { en: 'Amoxicillin', ar: 'أموكسيسيلين' },
      { en: 'Ivermectin', ar: 'إيفرمكتين' },
      { en: 'Dexamethasone', ar: 'ديكساميثازون' },
      { en: 'Penicillin', ar: 'بنسلين' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, index) => {
      const med = medications[Math.floor(Math.random() * medications.length)];
      
      return {
        id: `med_${index + 1}`,
        name: med.en,
        nameArabic: med.ar,
        dosage: `${Math.floor(Math.random() * 10) + 1}mg`,
        frequency: 'Twice daily',
        frequencyArabic: 'مرتين يومياً',
        duration: '7-10 days',
        durationArabic: '7-10 أيام',
        route: ['oral', 'injection', 'topical'][Math.floor(Math.random() * 3)] as any,
        routeArabic: 'فموي',
        sideEffects: ['Drowsiness', 'Stomach upset'],
        sideEffectsArabic: ['نعاس', 'اضطراب المعدة'],
        cost: Math.floor(Math.random() * 50) + 10,
        supplier: 'VetPharm Supply'
      };
    });
  }

  private generateMockVaccinations(): Vaccination[] {
    const vaccines = [
      { en: 'FMD Vaccine', ar: 'لقاح الحمى القلاعية' },
      { en: 'Rabies Vaccine', ar: 'لقاح السعار' },
      { en: 'Anthrax Vaccine', ar: 'لقاح الجمرة الخبيثة' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, index) => {
      const vaccine = vaccines[Math.floor(Math.random() * vaccines.length)];
      
      return {
        id: `vacc_${index + 1}`,
        vaccineName: vaccine.en,
        vaccineNameArabic: vaccine.ar,
        dateAdministered: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        nextDueDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: `VAC${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        administeredBy: 'Dr. Ahmad Veterinarian',
        location: 'Main Clinic',
        locationArabic: 'العيادة الرئيسية',
        status: ['completed', 'overdue', 'scheduled'][Math.floor(Math.random() * 3)] as any,
        sideEffects: Math.random() > 0.7 ? ['Mild swelling', 'Temporary fever'] : undefined,
        sideEffectsArabic: Math.random() > 0.7 ? ['تورم خفيف', 'حمى مؤقتة'] : undefined
      };
    });
  }

  private generateMockAppointments(): Appointment[] {
    const appointmentTypes = [
      { en: 'consultation', ar: 'استشارة' },
      { en: 'emergency', ar: 'طوارئ' },
      { en: 'surgery', ar: 'جراحة' },
      { en: 'vaccination', ar: 'تطعيم' },
      { en: 'checkup', ar: 'فحص' },
      { en: 'follow_up', ar: 'متابعة' }
    ];

    return Array.from({ length: 15 }, (_, index) => {
      const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
      const statuses: Appointment['status'][] = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      
      return {
        id: `appt_${String(index + 1).padStart(3, '0')}`,
        patientId: `patient_${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`,
        patientName: `Animal ${Math.floor(Math.random() * 25) + 1}`,
        patientNameArabic: `حيوان ${Math.floor(Math.random() * 25) + 1}`,
        ownerId: `owner_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
        ownerName: `Farmer ${Math.floor(Math.random() * 10) + 1}`,
        ownerNameArabic: `فلاح ${Math.floor(Math.random() * 10) + 1}`,
        farmName: `Farm ${Math.floor(Math.random() * 15) + 1}`,
        farmNameArabic: `مزرعة ${Math.floor(Math.random() * 15) + 1}`,
        scheduledDateTime: new Date(Date.now() + (Math.random() - 0.5) * 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
        type: type.en as any,
        typeArabic: type.ar,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: ['low', 'medium', 'high', 'emergency'][Math.floor(Math.random() * 4)] as any,
        reason: 'Routine health check',
        reasonArabic: 'فحص صحي روتيني',
        location: 'Main Clinic',
        locationArabic: 'العيادة الرئيسية',
        estimatedCost: Math.floor(Math.random() * 200) + 50,
        actualCost: Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 50 : undefined,
        notes: 'Appointment notes',
        notesArabic: 'ملاحظات الموعد',
        symptoms: ['Coughing', 'Loss of appetite'],
        symptomsArabic: ['سعال', 'فقدان الشهية']
      };
    });
  }

  private generateMockEmergencies(): EmergencyCase[] {
    return Array.from({ length: 8 }, (_, index) => ({
      id: `emrg_${String(index + 1).padStart(3, '0')}`,
      reportedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      patientId: `patient_${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`,
      patientName: `Emergency Animal ${index + 1}`,
      patientNameArabic: `حيوان طارئ ${index + 1}`,
      species: ['Cattle', 'Sheep', 'Goats'][Math.floor(Math.random() * 3)],
      speciesArabic: ['أبقار', 'أغنام', 'ماعز'][Math.floor(Math.random() * 3)],
      ownerId: `owner_${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
      ownerName: `Emergency Farmer ${Math.floor(Math.random() * 10) + 1}`,
      ownerNameArabic: `فلاح طارئ ${Math.floor(Math.random() * 10) + 1}`,
      location: 'Rural Area, Tunis',
      locationArabic: 'منطقة ريفية، تونس',
      urgencyLevel: ['critical', 'high', 'moderate'][Math.floor(Math.random() * 3)] as any,
      status: ['reported', 'dispatched', 'on_site', 'treating', 'resolved', 'referred'][Math.floor(Math.random() * 6)] as any,
      symptoms: ['Difficulty breathing', 'Collapse', 'Severe bleeding'],
      symptomsArabic: ['ص��وبة في التنفس', 'انهيار', 'نزيف شديد'],
      description: 'Animal showing signs of distress',
      descriptionArabic: 'الحيوان يظهر علامات الضيق',
      estimatedArrival: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      treatmentStarted: Math.random() > 0.5,
      cost: Math.floor(Math.random() * 500) + 100
    }));
  }

  private generateMockInventory(): InventoryItem[] {
    const categories = [
      { en: 'medications', ar: 'أدوية' },
      { en: 'vaccines', ar: 'لقاحات' },
      { en: 'equipment', ar: 'معدات' },
      { en: 'supplies', ar: 'مستلزمات' }
    ];

    const items = [
      { en: 'Amoxicillin 500mg', ar: 'أموكسيسيلين 500 مجم' },
      { en: 'Disposable Syringes', ar: 'محاقن يمكن التخلص منها' },
      { en: 'Surgical Gloves', ar: 'قفازات جراحية' },
      { en: 'Thermometer', ar: 'مقياس حرارة' },
      { en: 'Bandages', ar: 'ضمادات' },
      { en: 'Disinfectant', ar: 'مطهر' }
    ];

    return Array.from({ length: 20 }, (_, index) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const item = items[Math.floor(Math.random() * items.length)];
      const currentStock = Math.floor(Math.random() * 200) + 10;
      const minStock = Math.floor(Math.random() * 20) + 5;
      
      let status: InventoryItem['status'] = 'in_stock';
      if (currentStock < minStock) status = 'low_stock';
      if (currentStock === 0) status = 'out_of_stock';
      if (Math.random() > 0.9) status = 'expired';

      return {
        id: `inv_${String(index + 1).padStart(3, '0')}`,
        name: item.en,
        nameArabic: item.ar,
        category: category.en as any,
        categoryArabic: category.ar,
        currentStock,
        minStockLevel: minStock,
        maxStockLevel: minStock * 10,
        unit: 'pieces',
        unitArabic: 'قطعة',
        costPerUnit: Math.floor(Math.random() * 50) + 5,
        supplier: 'Medical Supply Co.',
        supplierArabic: 'شركة المستلزمات الطبية',
        expirationDate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        batchNumber: `BATCH${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        location: 'Main Storage',
        locationArabic: 'المخزن الرئيسي',
        lastRestocked: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        usageRate: Math.floor(Math.random() * 10) + 1,
        status
      };
    });
  }

  private generateMockMetrics(): PerformanceMetrics {
    return {
      totalPatients: 156,
      totalAppointments: 89,
      completedTreatments: 67,
      emergencyCases: 12,
      successRate: 94.2,
      avgConsultationTime: 45,
      revenue: 28750,
      costs: 12300,
      profit: 16450,
      patientSatisfaction: 4.7,
      appointmentNoShows: 8,
      treatmentComplianceRate: 87.5
    };
  }

  getDashboardOverview(): any {
    const profile = this.generateMockVeterinarianProfile();
    const metrics = this.generateMockMetrics();
    const recentAppointments = this.generateMockAppointments().slice(0, 5);
    const urgentCases = this.generateMockEmergencies().filter(e => e.urgencyLevel === 'critical').slice(0, 3);
    
    return {
      success: true,
      data: {
        profile,
        metrics,
        recentAppointments,
        urgentCases,
        summary: {
          todayAppointments: 8,
          pendingEmergencies: 3,
          activeTreatments: 15,
          lowStockItems: 4,
          overdueVaccinations: 7
        },
        lastUpdated: new Date().toISOString()
      }
    };
  }

  getPatients(): any {
    return {
      success: true,
      data: this.generateMockPatients()
    };
  }

  getAppointments(): any {
    return {
      success: true,
      data: this.generateMockAppointments()
    };
  }

  getEmergencies(): any {
    return {
      success: true,
      data: this.generateMockEmergencies()
    };
  }

  getInventory(): any {
    return {
      success: true,
      data: this.generateMockInventory()
    };
  }

  getTreatments(): any {
    const patients = this.generateMockPatients();
    const treatments = patients.flatMap(patient => 
      patient.currentTreatments.map(treatment => ({
        ...treatment,
        patientId: patient.id,
        patientName: patient.animalName,
        patientNameArabic: patient.animalNameArabic,
        ownerName: patient.ownerName,
        ownerNameArabic: patient.ownerNameArabic
      }))
    );

    return {
      success: true,
      data: treatments
    };
  }

  getFinancialSummary(): any {
    const metrics = this.generateMockMetrics();
    
    return {
      success: true,
      data: {
        monthlyRevenue: metrics.revenue,
        monthlyCosts: metrics.costs,
        monthlyProfit: metrics.profit,
        averageConsultationFee: 85,
        totalUnpaidInvoices: 2450,
        paymentsByMethod: {
          cash: 15600,
          bank_transfer: 8900,
          check: 4250
        },
        expensesByCategory: {
          medications: 6200,
          equipment: 3400,
          utilities: 1200,
          salaries: 8500,
          other: 1000
        },
        revenueByService: {
          consultations: 12300,
          surgeries: 8900,
          vaccinations: 4200,
          emergency_calls: 3350
        }
      }
    };
  }
}

const veterinarianService = new VeterinarianDashboardService();

export const getVeterinarianDashboard: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getDashboardOverview();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
};

export const getVeterinarianPatients: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getPatients();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch patients data' });
  }
};

export const getVeterinarianAppointments: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getAppointments();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointments data' });
  }
};

export const getVeterinarianEmergencies: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getEmergencies();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch emergencies data' });
  }
};

export const getVeterinarianInventory: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getInventory();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory data' });
  }
};

export const getVeterinarianTreatments: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getTreatments();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch treatments data' });
  }
};

export const getVeterinarianFinancials: RequestHandler = (req, res) => {
  try {
    const result = veterinarianService.getFinancialSummary();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch financial data' });
  }
};
