import { RequestHandler } from "express";

// Sample logistics data
const mockVehicles = [
  {
    id: 'vehicle_1',
    plateNumber: 'TN-12345',
    type: 'refrigerated',
    capacity: 5000,
    currentLoad: 3500,
    status: 'in_transit',
    driver: {
      id: 'driver_1',
      name: 'محمد الترابلسي',
      phone: '+216 12 345 678',
      rating: 4.8,
      experience: 8
    },
    location: {
      latitude: 35.8256,
      longitude: 10.6411,
      address: 'الطريق السيار A1، سوسة',
      lastUpdate: '2024-02-22T12:30:00Z'
    },
    route: {
      id: 'route_1',
      origin: 'مستودع سوسة',
      destination: 'سوبر ماركت تونس',
      distance: 140,
      estimatedDuration: 2.5,
      actualDuration: 2.8,
      stops: [
        {
          id: 'stop_1',
          address: 'مستودع سوسة',
          coordinates: [35.8256, 10.6411],
          type: 'pickup',
          estimatedTime: '2024-02-22T08:00:00Z',
          actualTime: '2024-02-22T08:15:00Z',
          status: 'completed',
          cargo: {
            items: ['طماطم', 'خيار', 'فلفل'],
            weight: 3500,
            value: 8750
          }
        },
        {
          id: 'stop_2',
          address: 'محطة وقود Shell',
          coordinates: [36.2000, 10.4000],
          type: 'fuel',
          estimatedTime: '2024-02-22T10:30:00Z',
          actualTime: '2024-02-22T10:45:00Z',
          status: 'completed',
          cargo: {
            items: [],
            weight: 0,
            value: 0
          }
        },
        {
          id: 'stop_3',
          address: 'سوبر ماركت الخير - تونس',
          coordinates: [36.8065, 10.1815],
          type: 'delivery',
          estimatedTime: '2024-02-22T13:00:00Z',
          status: 'pending',
          cargo: {
            items: ['طماطم', 'خيار', 'فلفل'],
            weight: 3500,
            value: 8750
          }
        }
      ]
    },
    fuelLevel: 75,
    temperature: 4,
    maintenance: {
      lastService: '2024-01-15',
      nextService: '2024-04-15',
      mileage: 45600,
      issues: ['فحص الفرامل', 'تغيير زي�� المحرك']
    },
    performance: {
      onTimeDeliveries: 94,
      fuelEfficiency: 12.5,
      safetyScore: 98,
      customerRating: 4.7
    }
  },
  {
    id: 'vehicle_2',
    plateNumber: 'TN-67890',
    type: 'truck',
    capacity: 8000,
    currentLoad: 0,
    status: 'available',
    driver: {
      id: 'driver_2',
      name: 'فاطمة السالمي',
      phone: '+216 13 987 654',
      rating: 4.9,
      experience: 12
    },
    location: {
      latitude: 34.7406,
      longitude: 10.7603,
      address: 'مستودع صفاقس الرئيسي',
      lastUpdate: '2024-02-22T11:00:00Z'
    },
    route: {
      id: 'route_2',
      origin: 'مستودع صفاقس',
      destination: 'ميناء رادس',
      distance: 0,
      estimatedDuration: 0,
      stops: []
    },
    fuelLevel: 90,
    maintenance: {
      lastService: '2024-02-01',
      nextService: '2024-05-01',
      mileage: 32400,
      issues: []
    },
    performance: {
      onTimeDeliveries: 97,
      fuelEfficiency: 15.2,
      safetyScore: 99,
      customerRating: 4.9
    }
  },
  {
    id: 'vehicle_3',
    plateNumber: 'TN-11223',
    type: 'van',
    capacity: 2000,
    currentLoad: 1800,
    status: 'loading',
    driver: {
      id: 'driver_3',
      name: 'أ��مد البحيري',
      phone: '+216 14 555 777',
      rating: 4.5,
      experience: 5
    },
    location: {
      latitude: 35.7643,
      longitude: 10.8113,
      address: 'مركز التوزيع المنستير',
      lastUpdate: '2024-02-22T13:15:00Z'
    },
    route: {
      id: 'route_3',
      origin: 'مركز التوزيع المنستير',
      destination: 'متاجر المنستير',
      distance: 25,
      estimatedDuration: 1.5,
      stops: [
        {
          id: 'stop_van_1',
          address: 'بقالة النور',
          coordinates: [35.7700, 10.8200],
          type: 'delivery',
          estimatedTime: '2024-02-22T14:30:00Z',
          status: 'pending',
          cargo: {
            items: ['خبز', 'حليب', 'جبن'],
            weight: 600,
            value: 1200
          }
        },
        {
          id: 'stop_van_2',
          address: 'سوبر ماركت العائلة',
          coordinates: [35.7600, 10.8000],
          type: 'delivery',
          estimatedTime: '2024-02-22T15:00:00Z',
          status: 'pending',
          cargo: {
            items: ['لحوم', 'دجاج', 'أسماك'],
            weight: 1200,
            value: 3600
          }
        }
      ]
    },
    fuelLevel: 60,
    maintenance: {
      lastService: '2024-01-20',
      nextService: '2024-04-20',
      mileage: 28900,
      issues: []
    },
    performance: {
      onTimeDeliveries: 89,
      fuelEfficiency: 8.5,
      safetyScore: 95,
      customerRating: 4.5
    }
  }
];

const mockOrders = [
  {
    id: 'order_1',
    orderNumber: 'ORD-2024-001',
    customer: {
      name: 'مطعم البحر المتوسط',
      address: 'شارع الحبيب بورقيبة، تونس',
      phone: '+216 71 123 456',
      coordinates: [36.8065, 10.1815]
    },
    items: [
      { name: 'طماطم طازجة', quantity: 20, weight: 20, value: 50, specialRequirements: ['عضوي'] },
      { name: 'خيار', quantity: 15, weight: 15, value: 30 },
      { name: 'فلفل أخضر', quantity: 10, weight: 10, value: 25 }
    ],
    priority: 'high',
    status: 'assigned',
    vehicleId: 'vehicle_1',
    driverId: 'driver_1',
    scheduledTime: '2024-02-22T12:00:00Z',
    estimatedDelivery: '2024-02-22T15:00:00Z',
    specialInstructions: 'يُرجى التأكد من حفظ المنتجات في درجة حرارة مناسبة',
    paymentStatus: 'paid'
  },
  {
    id: 'order_2',
    orderNumber: 'ORD-2024-002',
    customer: {
      name: 'سوبر ماركت الخير',
      address: 'حي النصر، صفاقس',
      phone: '+216 74 987 654',
      coordinates: [34.7500, 10.7700]
    },
    items: [
      { name: 'زيت زيتون', quantity: 50, weight: 50, value: 400 },
      { name: 'معكرونة', quantity: 30, weight: 30, value: 60 },
      { name: 'أرز', quantity: 25, weight: 25, value: 50 }
    ],
    priority: 'medium',
    status: 'pending',
    scheduledTime: '2024-02-23T09:00:00Z',
    estimatedDelivery: '2024-02-23T14:00:00Z',
    paymentStatus: 'cod'
  },
  {
    id: 'order_3',
    orderNumber: 'ORD-2024-003',
    customer: {
      name: 'مخبزة الأمل',
      address: 'شارع فرحات حشاد، سوسة',
      phone: '+216 73 456 789',
      coordinates: [35.8300, 10.6400]
    },
    items: [
      { name: 'دقيق أبيض', quantity: 100, weight: 100, value: 120, specialRequirements: ['جودة عالية'] },
      { name: 'خميرة', quantity: 5, weight: 5, value: 15 },
      { name: 'ملح', quantity: 10, weight: 10, value: 8 }
    ],
    priority: 'urgent',
    status: 'in_transit',
    vehicleId: 'vehicle_3',
    driverId: 'driver_3',
    scheduledTime: '2024-02-22T14:00:00Z',
    estimatedDelivery: '2024-02-22T16:00:00Z',
    paymentStatus: 'paid'
  }
];

const mockMetrics = {
  totalVehicles: 45,
  activeRoutes: 28,
  onTimeDelivery: 89.5,
  fuelEfficiency: 12.8,
  averageSpeed: 65,
  totalDistance: 15670,
  co2Emissions: 2840,
  costPerKm: 0.95,
  customerSatisfaction: 4.6,
  safetyIncidents: 2
};

const mockRouteOptimizations = [
  {
    id: 'opt_1',
    name: 'تحسين توصيل الخضروات - المنطقة الشمالية',
    vehicles: ['vehicle_1', 'vehicle_2'],
    orders: ['order_1', 'order_2', 'order_3'],
    optimizationFactors: {
      distance: 30,
      time: 25,
      fuel: 20,
      cost: 15,
      priority: 10
    },
    result: {
      totalDistance: 320,
      totalTime: 8.5,
      fuelConsumption: 45,
      estimatedCost: 285,
      co2Emissions: 95,
      routes: [
        {
          vehicleId: 'vehicle_1',
          stops: [],
          totalDistance: 180,
          estimatedTime: 4.5,
          load: 3500,
          priority: 85
        },
        {
          vehicleId: 'vehicle_2',
          stops: [],
          totalDistance: 140,
          estimatedTime: 4.0,
          load: 2800,
          priority: 75
        }
      ]
    },
    status: 'completed',
    createdAt: '2024-02-22T08:00:00Z'
  },
  {
    id: 'opt_2',
    name: 'تحسين توصيل المنطقة الجنوبية',
    vehicles: ['vehicle_3'],
    orders: ['order_4', 'order_5'],
    optimizationFactors: {
      distance: 35,
      time: 30,
      fuel: 20,
      cost: 10,
      priority: 5
    },
    result: {
      totalDistance: 95,
      totalTime: 3.2,
      fuelConsumption: 12,
      estimatedCost: 85,
      co2Emissions: 28,
      routes: [
        {
          vehicleId: 'vehicle_3',
          stops: [],
          totalDistance: 95,
          estimatedTime: 3.2,
          load: 1800,
          priority: 70
        }
      ]
    },
    status: 'optimizing',
    createdAt: '2024-02-22T10:30:00Z'
  }
];

export const getLogisticsVehicles: RequestHandler = (req, res) => {
  try {
    const { status = 'all', search = '' } = req.query;
    
    let filteredVehicles = [...mockVehicles];
    
    // Filter by status
    if (status !== 'all') {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === status);
    }
    
    // Filter by search query
    if (search) {
      filteredVehicles = filteredVehicles.filter(vehicle => 
        vehicle.plateNumber.includes(search as string) ||
        vehicle.driver.name.includes(search as string)
      );
    }
    
    res.json({
      success: true,
      data: filteredVehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logistics vehicles'
    });
  }
};

export const getLogisticsOrders: RequestHandler = (req, res) => {
  try {
    const { status = 'all', priority = 'all' } = req.query;
    
    let filteredOrders = [...mockOrders];
    
    if (status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (priority !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.priority === priority);
    }
    
    res.json({
      success: true,
      data: filteredOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logistics orders'
    });
  }
};

export const getLogisticsMetrics: RequestHandler = (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    res.json({
      success: true,
      data: mockMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logistics metrics'
    });
  }
};

export const getRouteOptimizations: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockRouteOptimizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route optimizations'
    });
  }
};

export const createRouteOptimization: RequestHandler = (req, res) => {
  try {
    const optimizationData = req.body;
    
    const newOptimization = {
      id: `opt_${Date.now()}`,
      ...optimizationData,
      status: 'optimizing',
      createdAt: new Date().toISOString()
    };
    
    // In production, trigger actual optimization algorithm
    setTimeout(() => {
      // Simulate optimization completion
      newOptimization.status = 'completed';
    }, 5000);
    
    res.json({
      success: true,
      data: newOptimization,
      message: 'Route optimization started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create route optimization'
    });
  }
};

export const updateVehicleLocation: RequestHandler = (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { latitude, longitude, address } = req.body;
    
    res.json({
      success: true,
      message: 'Vehicle location updated successfully',
      data: {
        vehicleId,
        location: {
          latitude,
          longitude,
          address,
          lastUpdate: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle location'
    });
  }
};

export const updateOrderStatus: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId,
        status,
        notes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
};

export const assignOrderToVehicle: RequestHandler = (req, res) => {
  try {
    const { orderId, vehicleId, driverId } = req.body;
    
    res.json({
      success: true,
      message: 'Order assigned to vehicle successfully',
      data: {
        orderId,
        vehicleId,
        driverId,
        assignedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to assign order to vehicle'
    });
  }
};

export const getVehiclePerformance: RequestHandler = (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { period = '30d' } = req.query;
    
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        vehicleId,
        period,
        performance: vehicle.performance,
        maintenance: vehicle.maintenance,
        // Additional performance metrics would be calculated here
        trends: {
          fuelEfficiency: { current: vehicle.performance.fuelEfficiency, change: '+2.3%' },
          onTimeDelivery: { current: vehicle.performance.onTimeDeliveries, change: '+1.8%' },
          safetyScore: { current: vehicle.performance.safetyScore, change: '0%' }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle performance'
    });
  }
};
