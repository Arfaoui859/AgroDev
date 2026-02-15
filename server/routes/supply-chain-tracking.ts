import { RequestHandler } from "express";

// Sample supply chain tracking data
const mockTrackingRecords = [
  {
    id: 'track_1',
    batchId: 'BATCH-2024-001',
    productName: 'Organic Tomatoes',
    productNameAr: 'طماطم عضوية',
    category: 'vegetables',
    quantity: 500,
    unit: 'كغ',
    origin: {
      farm: 'مزرعة الأمل العضوية',
      farmer: 'أحمد التونسي',
      location: 'صفاقس',
      harvestDate: '2024-02-20T08:00:00Z'
    },
    destination: {
      type: 'retailer',
      name: 'سوبر ماركت الخير',
      location: 'تونس العاصمة'
    },
    currentStep: 4,
    totalSteps: 6,
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        name: 'Harvest',
        nameAr: 'الحصاد',
        type: 'production',
        status: 'completed',
        location: {
          name: 'مزرعة الأمل',
          coordinates: [34.7406, 10.7603],
          address: 'طريق الساحل، صفاقس'
        },
        timestamp: '2024-02-20T08:00:00Z',
        estimatedTime: '2024-02-20T08:00:00Z',
        actualTime: '2024-02-20T08:15:00Z',
        operator: {
          name: 'أحمد التونسي',
          role: 'مزارع',
          contact: '+216 12 345 678'
        },
        documents: ['harvest_certificate.pdf'],
        qualityChecks: [
          {
            id: 'qc_1',
            parameter: 'الحجم',
            value: 85,
            unit: 'mm',
            status: 'pass',
            threshold: { min: 60, max: 100 },
            timestamp: '2024-02-20T09:00:00Z',
            inspector: 'محمد الجودي'
          },
          {
            id: 'qc_2',
            parameter: 'النضج',
            value: 90,
            unit: '%',
            status: 'pass',
            threshold: { min: 80, max: 95 },
            timestamp: '2024-02-20T09:05:00Z',
            inspector: 'محمد الجودي'
          }
        ],
        conditions: {
          temperature: 22,
          humidity: 65,
          timestamp: '2024-02-20T08:30:00Z'
        },
        notes: 'حصاد ممتاز، جودة عالية'
      },
      {
        id: 'step_2',
        stepNumber: 2,
        name: 'Sorting & Packaging',
        nameAr: 'الفرز والتعبئة',
        type: 'packaging',
        status: 'completed',
        location: {
          name: 'مركز التعبئة المتقدم',
          coordinates: [34.7500, 10.7700],
          address: 'المنطقة الصناعية، صفاقس'
        },
        timestamp: '2024-02-20T14:00:00Z',
        estimatedTime: '2024-02-20T14:00:00Z',
        actualTime: '2024-02-20T14:30:00Z',
        operator: {
          name: 'فاطمة السالمي',
          role: 'مشرفة التعبئة',
          contact: '+216 12 987 654'
        },
        documents: ['packaging_report.pdf'],
        qualityChecks: [
          {
            id: 'qc_3',
            parameter: 'النظافة',
            value: 95,
            unit: '%',
            status: 'pass',
            threshold: { min: 90, max: 100 },
            timestamp: '2024-02-20T14:15:00Z',
            inspector: 'نجيب الحداد'
          }
        ],
        conditions: {
          temperature: 18,
          humidity: 55,
          timestamp: '2024-02-20T14:15:00Z'
        }
      },
      {
        id: 'step_3',
        stepNumber: 3,
        name: 'Cold Storage',
        nameAr: 'التخزين ا��مبرد',
        type: 'storage',
        status: 'completed',
        location: {
          name: 'مستودع التبريد المركزي',
          coordinates: [35.8256, 10.6411],
          address: 'سوسة'
        },
        timestamp: '2024-02-21T08:00:00Z',
        estimatedTime: '2024-02-21T08:00:00Z',
        actualTime: '2024-02-21T08:00:00Z',
        operator: {
          name: 'خالد الميداني',
          role: 'مشرف المستودع',
          contact: '+216 12 555 777'
        },
        documents: ['storage_entry.pdf'],
        qualityChecks: [
          {
            id: 'qc_4',
            parameter: 'درجة الحرارة',
            value: 4,
            unit: '°C',
            status: 'pass',
            threshold: { min: 2, max: 6 },
            timestamp: '2024-02-21T08:30:00Z',
            inspector: 'سامي الكريمي'
          }
        ],
        conditions: {
          temperature: 4,
          humidity: 85,
          timestamp: '2024-02-21T08:30:00Z'
        }
      },
      {
        id: 'step_4',
        stepNumber: 4,
        name: 'Loading for Transport',
        nameAr: 'التحميل للنقل',
        type: 'transport',
        status: 'in_progress',
        location: {
          name: 'محطة النقل المبرد',
          coordinates: [35.8300, 10.6450],
          address: 'سوسة'
        },
        timestamp: '2024-02-22T10:00:00Z',
        estimatedTime: '2024-02-22T10:00:00Z',
        operator: {
          name: 'معز الترابلسي',
          role: 'سائق النقل',
          contact: '+216 12 888 999'
        },
        documents: ['loading_manifest.pdf'],
        qualityChecks: [],
        conditions: {
          temperature: 4,
          humidity: 80,
          timestamp: '2024-02-22T10:15:00Z'
        }
      },
      {
        id: 'step_5',
        stepNumber: 5,
        name: 'In Transit',
        nameAr: 'في الطريق',
        type: 'transport',
        status: 'pending',
        location: {
          name: 'الطريق السيار A1',
          coordinates: [36.0000, 10.5000],
          address: 'تونس - سوسة'
        },
        timestamp: '',
        estimatedTime: '2024-02-22T13:00:00Z',
        operator: {
          name: 'معز الترابلسي',
          role: 'سائق النقل',
          contact: '+216 12 888 999'
        },
        documents: [],
        qualityChecks: [],
        conditions: {
          temperature: 0,
          humidity: 0,
          timestamp: ''
        }
      },
      {
        id: 'step_6',
        stepNumber: 6,
        name: 'Delivery',
        nameAr: 'التسليم',
        type: 'retail',
        status: 'pending',
        location: {
          name: 'سوبر ماركت الخير',
          coordinates: [36.8065, 10.1815],
          address: 'شارع الحبيب بورقيبة، تونس'
        },
        timestamp: '',
        estimatedTime: '2024-02-22T15:00:00Z',
        operator: {
          name: 'حسام العربي',
          role: 'مسؤول الاستلام',
          contact: '+216 12 111 222'
        },
        documents: [],
        qualityChecks: [],
        conditions: {
          temperature: 0,
          humidity: 0,
          timestamp: ''
        }
      }
    ],
    estimatedDelivery: '2024-02-22T15:00:00Z',
    status: 'in_transit',
    priority: 'high',
    certifications: ['عضوي', 'هاسب', 'ISO 22000'],
    blockchain: {
      transactionHash: '0x1234567890abcdef...',
      verified: true,
      lastUpdate: '2024-02-22T10:30:00Z'
    },
    alerts: [
      {
        id: 'alert_1',
        type: 'temperature',
        severity: 'medium',
        message: 'Temperature spike detected during transport',
        messageAr: 'ارتفاع طفيف في درجة الحرارة أثناء النقل',
        timestamp: '2024-02-22T11:15:00Z',
        resolved: false
      }
    ]
  },
  {
    id: 'track_2',
    batchId: 'BATCH-2024-002',
    productName: 'Premium Olive Oil',
    productNameAr: 'زيت زيتون ممتاز',
    category: 'oils',
    quantity: 200,
    unit: 'لتر',
    origin: {
      farm: 'بستان الزيتون الذهبي',
      farmer: 'عبد الرحمن الساحلي',
      location: 'المنستير',
      harvestDate: '2024-01-15T09:00:00Z'
    },
    destination: {
      type: 'export',
      name: 'شركة التصدير العالمية',
      location: 'ميناء رادس'
    },
    currentStep: 6,
    totalSteps: 6,
    steps: [
      // Simplified steps for brevity
      {
        id: 'step_oil_1',
        stepNumber: 1,
        name: 'Harvest',
        nameAr: 'قطف الزيتون',
        type: 'production',
        status: 'completed',
        location: {
          name: 'بستان الزيتون الذهبي',
          coordinates: [35.7643, 10.8113],
          address: 'المنستير'
        },
        timestamp: '2024-01-15T09:00:00Z',
        estimatedTime: '2024-01-15T09:00:00Z',
        actualTime: '2024-01-15T09:30:00Z',
        operator: {
          name: 'عبد الرحمن الساحلي',
          role: 'مزارع',
          contact: '+216 13 456 789'
        },
        documents: ['harvest_certificate.pdf'],
        qualityChecks: [
          {
            id: 'qc_oil_1',
            parameter: 'النضج',
            value: 95,
            unit: '%',
            status: 'pass',
            threshold: { min: 90, max: 100 },
            timestamp: '2024-01-15T10:00:00Z',
            inspector: 'مريم الفاسي'
          }
        ],
        conditions: {
          temperature: 18,
          humidity: 60,
          timestamp: '2024-01-15T09:30:00Z'
        }
      }
    ],
    estimatedDelivery: '2024-01-18T14:00:00Z',
    actualDelivery: '2024-01-18T13:45:00Z',
    status: 'delivered',
    priority: 'medium',
    certifications: ['أصل تونسي', 'بكر ممتاز', 'تصدير'],
    blockchain: {
      transactionHash: '0xabcdef1234567890...',
      verified: true,
      lastUpdate: '2024-01-18T14:00:00Z'
    },
    alerts: []
  }
];

const mockMetrics = {
  totalShipments: 1456,
  onTimeDelivery: 87.5,
  averageTransitTime: 18.5,
  qualityFailures: 2.3,
  costPerKm: 0.85,
  customerSatisfaction: 4.6,
  environmentalImpact: {
    co2Emissions: 1240,
    fuelConsumption: 580,
    carbonFootprint: 2350
  }
};

export const getSupplyChainTracking: RequestHandler = (req, res) => {
  try {
    const { status = 'all', search = '' } = req.query;
    
    let filteredRecords = [...mockTrackingRecords];
    
    // Filter by status
    if (status !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.status === status);
    }
    
    // Filter by search query
    if (search) {
      filteredRecords = filteredRecords.filter(record => 
        record.batchId.includes(search as string) ||
        record.productNameAr.includes(search as string) ||
        record.origin.farm.includes(search as string)
      );
    }
    
    res.json({
      success: true,
      data: filteredRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supply chain tracking data'
    });
  }
};

export const getSupplyChainMetrics: RequestHandler = (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    res.json({
      success: true,
      data: mockMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supply chain metrics'
    });
  }
};

export const getTrackingByBatch: RequestHandler = (req, res) => {
  try {
    const { batchId } = req.params;
    
    const record = mockTrackingRecords.find(r => r.batchId === batchId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Tracking record not found'
      });
    }
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking record'
    });
  }
};

export const updateTrackingStep: RequestHandler = (req, res) => {
  try {
    const { trackingId, stepId } = req.params;
    const updateData = req.body;
    
    // In production, update the step in database
    res.json({
      success: true,
      message: 'Tracking step updated successfully',
      data: {
        trackingId,
        stepId,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update tracking step'
    });
  }
};

export const addQualityCheck: RequestHandler = (req, res) => {
  try {
    const { trackingId, stepId } = req.params;
    const qualityCheckData = req.body;
    
    const newQualityCheck = {
      id: `qc_${Date.now()}`,
      ...qualityCheckData,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: newQualityCheck,
      message: 'Quality check added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add quality check'
    });
  }
};

export const resolveAlert: RequestHandler = (req, res) => {
  try {
    const { trackingId, alertId } = req.params;
    const { actionTaken } = req.body;
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: {
        alertId,
        resolved: true,
        actionTaken,
        resolvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
};

export const generateTrackingReport: RequestHandler = (req, res) => {
  try {
    const { trackingId } = req.params;
    const { format = 'pdf' } = req.query;
    
    // In production, generate actual report
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportId: `report_${Date.now()}`,
        format,
        downloadUrl: `/api/reports/download/tracking_${trackingId}.${format}`,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate tracking report'
    });
  }
};
