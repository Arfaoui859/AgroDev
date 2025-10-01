import { RequestHandler } from 'express';

// إدارة المستخدمين والأدوار
interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  firstNameArabic: string;
  lastName: string;
  lastNameArabic: string;
  role: 'farmer' | 'agronomist' | 'trader' | 'veterinarian' | 'inspector' | 'admin' | 'government' | 'investor';
  roleArabic: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  profile: {
    avatar?: string;
    bio: string;
    bioArabic: string;
    location: string;
    locationArabic: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female';
    languagePreference: 'ar' | 'en' | 'both';
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
  permissions: Permission[];
  subscription?: Subscription;
  activityLog: ActivityLog[];
  securityLog: SecurityEvent[];
}

// نظام الصلاحيات
interface Permission {
  id: string;
  name: string;
  nameArabic: string;
  category: 'user_management' | 'content_management' | 'system_settings' | 'financial' | 'reporting' | 'security';
  categoryArabic: string;
  description: string;
  descriptionArabic: string;
  level: 'read' | 'write' | 'delete' | 'admin';
  scope: 'own' | 'department' | 'organization' | 'global';
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

interface Role {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  level: number;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
  canBeDeleted: boolean;
}

// إدارة الاشتراكات والمدفوعات
interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planNameArabic: string;
  planType: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  trialPeriod: boolean;
  trialEndDate?: string;
  pricing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly' | 'lifetime';
    discount?: {
      percentage: number;
      code: string;
      validUntil: string;
    };
  };
  features: {
    farmCount: number;
    cropCount: number;
    storageGB: number;
    apiCalls: number;
    supportLevel: 'basic' | 'priority' | '24/7';
    advancedAnalytics: boolean;
    exportReports: boolean;
    mobileApp: boolean;
    customBranding: boolean;
  };
  usage: {
    farmsUsed: number;
    cropsUsed: number;
    storageUsedGB: number;
    apiCallsUsed: number;
    lastUsageUpdate: string;
  };
  paymentHistory: Payment[];
  invoices: Invoice[];
}

interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  method: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'local_payment';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId: string;
  processedAt: string;
  metadata: {
    gateway: string;
    reference: string;
    failureReason?: string;
  };
}

interface Invoice {
  id: string;
  subscriptionId: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  items: Array<{
    description: string;
    descriptionArabic: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  downloadUrl: string;
}

// مراقبة النظام والأداء
interface SystemMetrics {
  server: {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    loadAverage: number[];
    responseTime: number;
    requestCount: number;
    errorRate: number;
  };
  database: {
    connectionCount: number;
    queryCount: number;
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    storageUsed: number;
    backupStatus: 'success' | 'failed' | 'in_progress';
    lastBackup: string;
  };
  application: {
    activeUsers: number;
    totalUsers: number;
    newRegistrations: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  api: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    rateLimitHits: number;
    endpointUsage: Array<{
      endpoint: string;
      calls: number;
      avgTime: number;
      errorRate: number;
    }>;
  };
  security: {
    activeThreats: number;
    blockedIPs: number;
    failedLogins: number;
    suspiciousActivity: number;
    twoFactorAdoption: number;
    passwordStrength: number;
    sslScore: number;
  };
}

// سجل الأنشطة والأحداث
interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userNameArabic: string;
  action: string;
  actionArabic: string;
  category: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'settings';
  categoryArabic: string;
  target: string;
  targetId?: string;
  targetType?: string;
  details: string;
  detailsArabic: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'blocked';
  sessionId: string;
}

// الأحداث الأمنية
interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access' | 'data_breach' | 'malware' | 'ddos';
  typeArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    city: string;
  };
  description: string;
  descriptionArabic: string;
  impact: string;
  impactArabic: string;
  mitigation: string;
  mitigationArabic: string;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  evidenceUrls: string[];
  relatedEvents: string[];
}

// إحصائيات الاستخدام والتحليلات
interface UsageAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
    churnRate: number;
    avgSessionDuration: number;
    pageViews: number;
    uniqueVisitors: number;
  };
  usersByRole: {
    [role: string]: {
      count: number;
      percentage: number;
      growth: number;
    };
  };
  usersByLocation: Array<{
    country: string;
    countryArabic: string;
    users: number;
    percentage: number;
  }>;
  featureUsage: Array<{
    feature: string;
    featureArabic: string;
    users: number;
    usage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  subscriptions: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    subscriptionsByPlan: {
      [plan: string]: {
        count: number;
        revenue: number;
        growth: number;
      };
    };
  };
  support: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    ticketsByCategory: {
      [category: string]: number;
    };
  };
}

// تكوين النظام
interface SystemConfiguration {
  general: {
    siteName: string;
    siteNameArabic: string;
    siteUrl: string;
    supportEmail: string;
    supportPhone: string;
    timezone: string;
    language: 'ar' | 'en' | 'both';
    currency: string;
    dateFormat: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireUppercase: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorRequired: boolean;
    ipWhitelist: string[];
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    fromEmail: string;
    fromName: string;
    fromNameArabic: string;
    templatesEnabled: boolean;
    trackingEnabled: boolean;
  };
  notifications: {
    pushEnabled: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
    slackWebhook?: string;
    telegramBot?: string;
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: 'local' | 's3' | 'gcs' | 'azure';
    encryption: boolean;
  };
  api: {
    rateLimitEnabled: boolean;
    rateLimit: number;
    cacheEnabled: boolean;
    cacheTtl: number;
    corsEnabled: boolean;
    allowedOrigins: string[];
  };
}

class AdminPanelService {
  private generateMockUsers(): User[] {
    const roles = [
      { role: 'farmer', roleArabic: 'فلاح' },
      { role: 'agronomist', roleArabic: 'خبير زراعي' },
      { role: 'trader', roleArabic: 'تاجر' },
      { role: 'veterinarian', roleArabic: 'طبيب بيطري' },
      { role: 'inspector', roleArabic: 'مراقب حقول' },
      { role: 'admin', roleArabic: 'مدير' },
      { role: 'government', roleArabic: 'مسؤول حكومي' },
      { role: 'investor', roleArabic: 'مستثمر' }
    ];

    const statuses: User['status'][] = ['active', 'inactive', 'suspended', 'pending'];

    return Array.from({ length: 50 }, (_, index) => {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id: `user_${String(index + 1).padStart(3, '0')}`,
        username: `user${index + 1}`,
        email: `user${index + 1}@agrigrowth.tn`,
        phone: `+216 ${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        firstName: `User ${index + 1}`,
        firstNameArabic: `مستخدم ${index + 1}`,
        lastName: `LastName ${index + 1}`,
        lastNameArabic: `العائلة ${index + 1}`,
        role: role.role as any,
        roleArabic: role.roleArabic,
        status,
        emailVerified: Math.random() > 0.2,
        phoneVerified: Math.random() > 0.3,
        twoFactorEnabled: Math.random() > 0.7,
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        loginCount: Math.floor(Math.random() * 200) + 1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        profile: {
          avatar: Math.random() > 0.5 ? `/avatars/user${index + 1}.jpg` : undefined,
          bio: `Biography for user ${index + 1}`,
          bioArabic: `السيرة الذاتية للمستخدم ${index + 1}`,
          location: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Gabès'][Math.floor(Math.random() * 5)],
          locationArabic: ['تونس', 'صفاقس', 'سوسة', 'القيروان', 'قابس'][Math.floor(Math.random() * 5)],
          dateOfBirth: new Date(1980 + Math.random() * 30, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          gender: Math.random() > 0.5 ? 'male' : 'female',
          languagePreference: ['ar', 'en', 'both'][Math.floor(Math.random() * 3)] as any,
          timezone: 'Africa/Tunis',
          notifications: {
            email: Math.random() > 0.3,
            sms: Math.random() > 0.5,
            push: Math.random() > 0.2,
            marketing: Math.random() > 0.6
          }
        },
        permissions: this.generateMockPermissions(),
        subscription: Math.random() > 0.3 ? this.generateMockSubscription(`user_${String(index + 1).padStart(3, '0')}`) : undefined,
        activityLog: this.generateMockActivityLog(`user_${String(index + 1).padStart(3, '0')}`),
        securityLog: Math.random() > 0.8 ? this.generateMockSecurityEvents(`user_${String(index + 1).padStart(3, '0')}`) : []
      };
    });
  }

  private generateMockPermissions(): Permission[] {
    const permissions = [
      { name: 'View Users', nameArabic: 'عرض المستخدمين', category: 'user_management', categoryArabic: 'إدارة المستخدمين' },
      { name: 'Edit Users', nameArabic: 'تحرير المستخدمين', category: 'user_management', categoryArabic: 'إدارة المستخدمين' },
      { name: 'Delete Users', nameArabic: 'حذف المستخدمين', category: 'user_management', categoryArabic: 'إدارة المستخدمين' },
      { name: 'View Content', nameArabic: 'عرض المحتوى', category: 'content_management', categoryArabic: 'إدارة المحتوى' },
      { name: 'Edit Content', nameArabic: 'تحرير المحتوى', category: 'content_management', categoryArabic: 'إدارة المحتوى' },
      { name: 'System Settings', nameArabic: 'إعدادات النظام', category: 'system_settings', categoryArabic: 'إعدادات النظام' },
      { name: 'Financial Data', nameArabic: 'البيانات المالية', category: 'financial', categoryArabic: 'مالية' },
      { name: 'Generate Reports', nameArabic: 'إنشاء التقارير', category: 'reporting', categoryArabic: 'تقارير' },
      { name: 'Security Management', nameArabic: 'إدارة الأمان', category: 'security', categoryArabic: 'أمان' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 5) + 2 }, () => {
      const permission = permissions[Math.floor(Math.random() * permissions.length)];
      const levels: Permission['level'][] = ['read', 'write', 'delete', 'admin'];
      const scopes: Permission['scope'][] = ['own', 'department', 'organization', 'global'];
      
      return {
        id: `perm_${Math.random().toString(36).substr(2, 9)}`,
        name: permission.name,
        nameArabic: permission.nameArabic,
        category: permission.category as any,
        categoryArabic: permission.categoryArabic,
        description: `Permission to ${permission.name.toLowerCase()}`,
        descriptionArabic: `صلاحية ${permission.nameArabic}`,
        level: levels[Math.floor(Math.random() * levels.length)],
        scope: scopes[Math.floor(Math.random() * scopes.length)],
        granted: true,
        grantedBy: 'admin_001',
        grantedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };
    });
  }

  private generateMockSubscription(userId: string): Subscription {
    const plans = [
      { id: 'free', name: 'Free Plan', nameArabic: 'خطة مجانية', type: 'free' },
      { id: 'basic', name: 'Basic Plan', nameArabic: 'خطة أساسية', type: 'basic' },
      { id: 'premium', name: 'Premium Plan', nameArabic: 'خطة متميزة', type: 'premium' },
      { id: 'enterprise', name: 'Enterprise Plan', nameArabic: 'خطة المؤسسات', type: 'enterprise' }
    ];

    const plan = plans[Math.floor(Math.random() * plans.length)];
    const statuses: Subscription['status'][] = ['active', 'inactive', 'cancelled', 'suspended', 'expired', 'pending'];

    return {
      id: `sub_${userId}`,
      userId,
      planId: plan.id,
      planName: plan.name,
      planNameArabic: plan.nameArabic,
      planType: plan.type as any,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: Math.random() > 0.3,
      trialPeriod: Math.random() > 0.7,
      trialEndDate: Math.random() > 0.7 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      pricing: {
        amount: plan.type === 'free' ? 0 : plan.type === 'basic' ? 29 : plan.type === 'premium' ? 79 : 199,
        currency: 'TND',
        interval: ['monthly', 'yearly'][Math.floor(Math.random() * 2)] as any,
        discount: Math.random() > 0.8 ? {
          percentage: Math.floor(Math.random() * 30) + 10,
          code: 'SUMMER2024',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : undefined
      },
      features: {
        farmCount: plan.type === 'free' ? 1 : plan.type === 'basic' ? 3 : plan.type === 'premium' ? 10 : -1,
        cropCount: plan.type === 'free' ? 5 : plan.type === 'basic' ? 20 : plan.type === 'premium' ? 100 : -1,
        storageGB: plan.type === 'free' ? 1 : plan.type === 'basic' ? 10 : plan.type === 'premium' ? 100 : 1000,
        apiCalls: plan.type === 'free' ? 1000 : plan.type === 'basic' ? 10000 : plan.type === 'premium' ? 100000 : -1,
        supportLevel: plan.type === 'free' ? 'basic' : plan.type === 'basic' ? 'basic' : plan.type === 'premium' ? 'priority' : '24/7',
        advancedAnalytics: plan.type !== 'free',
        exportReports: plan.type !== 'free',
        mobileApp: true,
        customBranding: plan.type === 'enterprise'
      },
      usage: {
        farmsUsed: Math.floor(Math.random() * (plan.type === 'free' ? 1 : plan.type === 'basic' ? 3 : 8)) + 1,
        cropsUsed: Math.floor(Math.random() * (plan.type === 'free' ? 5 : plan.type === 'basic' ? 20 : 50)) + 1,
        storageUsedGB: Math.round((Math.random() * (plan.type === 'free' ? 0.8 : plan.type === 'basic' ? 8 : 80)) * 100) / 100,
        apiCallsUsed: Math.floor(Math.random() * (plan.type === 'free' ? 800 : plan.type === 'basic' ? 8000 : 80000)),
        lastUsageUpdate: new Date().toISOString()
      },
      paymentHistory: this.generateMockPayments(`sub_${userId}`),
      invoices: this.generateMockInvoices(`sub_${userId}`)
    };
  }

  private generateMockPayments(subscriptionId: string): Payment[] {
    return Array.from({ length: Math.floor(Math.random() * 12) + 1 }, (_, index) => {
      const statuses: Payment['status'][] = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
      const methods: Payment['method'][] = ['credit_card', 'bank_transfer', 'paypal', 'stripe', 'local_payment'];

      return {
        id: `pay_${subscriptionId}_${index + 1}`,
        subscriptionId,
        amount: Math.floor(Math.random() * 200) + 29,
        currency: 'TND',
        method: methods[Math.floor(Math.random() * methods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        transactionId: `txn_${Math.random().toString(36).substr(2, 15)}`,
        processedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          gateway: 'stripe',
          reference: `ref_${Math.random().toString(36).substr(2, 10)}`,
          failureReason: Math.random() > 0.8 ? 'Insufficient funds' : undefined
        }
      };
    });
  }

  private generateMockInvoices(subscriptionId: string): Invoice[] {
    return Array.from({ length: Math.floor(Math.random() * 6) + 1 }, (_, index) => {
      const statuses: Invoice['status'][] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      const amount = Math.floor(Math.random() * 200) + 29;

      return {
        id: `inv_${subscriptionId}_${index + 1}`,
        subscriptionId,
        number: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
        amount,
        currency: 'TND',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        issuedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: Math.random() > 0.3 ? new Date().toISOString() : undefined,
        items: [
          {
            description: 'Monthly Subscription',
            descriptionArabic: 'اشتراك شهري',
            quantity: 1,
            unitPrice: amount,
            totalPrice: amount
          }
        ],
        downloadUrl: `/invoices/${subscriptionId}_${index + 1}.pdf`
      };
    });
  }

  private generateMockActivityLog(userId: string): ActivityLog[] {
    const actions = [
      { action: 'Login', actionArabic: 'تسجيل دخول', category: 'login' },
      { action: 'Logout', actionArabic: 'تسجيل خروج', category: 'logout' },
      { action: 'Create Farm', actionArabic: 'إنشاء مزرعة', category: 'create' },
      { action: 'Update Profile', actionArabic: 'تحديث الملف الشخصي', category: 'update' },
      { action: 'Delete Crop', actionArabic: 'حذف محصول', category: 'delete' },
      { action: 'View Report', actionArabic: 'عرض تقرير', category: 'view' },
      { action: 'Export Data', actionArabic: 'تصدير البيانات', category: 'export' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, index) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const severities: ActivityLog['severity'][] = ['low', 'medium', 'high', 'critical'];
      const statuses: ActivityLog['status'][] = ['success', 'failed', 'blocked'];

      return {
        id: `log_${userId}_${index + 1}`,
        userId,
        userName: `User ${userId}`,
        userNameArabic: `مستخدم ${userId}`,
        action: action.action,
        actionArabic: action.actionArabic,
        category: action.category as any,
        categoryArabic: action.actionArabic,
        target: 'system',
        targetId: `target_${Math.random().toString(36).substr(2, 9)}`,
        targetType: 'entity',
        details: `User performed ${action.action.toLowerCase()}`,
        detailsArabic: `قام المستخدم بـ${action.actionArabic}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: {
          country: 'Tunisia',
          city: ['Tunis', 'Sfax', 'Sousse', 'Kairouan'][Math.floor(Math.random() * 4)],
          latitude: 36.8 + (Math.random() - 0.5) * 2,
          longitude: 10.1 + (Math.random() - 0.5) * 2
        },
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        sessionId: `sess_${Math.random().toString(36).substr(2, 15)}`
      };
    });
  }

  private generateMockSecurityEvents(userId?: string): SecurityEvent[] {
    const eventTypes = [
      { type: 'failed_login', typeArabic: 'فشل تسجيل الدخول' },
      { type: 'brute_force', typeArabic: 'هجوم القوة الغاشمة' },
      { type: 'sql_injection', typeArabic: 'حقن SQL' },
      { type: 'xss_attempt', typeArabic: 'محاولة XSS' },
      { type: 'unauthorized_access', typeArabic: 'وصول غير مصرح' },
      { type: 'data_breach', typeArabic: 'اختراق البيانات' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, index) => {
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severities: SecurityEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
      const statuses: SecurityEvent['status'][] = ['detected', 'investigating', 'resolved', 'false_positive'];

      return {
        id: `sec_${Date.now()}_${index}`,
        type: event.type as any,
        typeArabic: event.typeArabic,
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        userId,
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: {
          country: ['Tunisia', 'Algeria', 'Morocco', 'Unknown'][Math.floor(Math.random() * 4)],
          city: ['Tunis', 'Algiers', 'Casablanca', 'Unknown'][Math.floor(Math.random() * 4)]
        },
        description: `Security event: ${event.type}`,
        descriptionArabic: `حدث أمني: ${event.typeArabic}`,
        impact: 'Medium impact on system security',
        impactArabic: 'تأثير متوسط على أمان النظام',
        mitigation: 'Blocked IP address and increased monitoring',
        mitigationArabic: 'تم حظر عنوان IP وزيادة المراقبة',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        resolvedBy: Math.random() > 0.5 ? 'admin_001' : undefined,
        evidenceUrls: [`/security/evidence/${index + 1}.log`],
        relatedEvents: []
      };
    });
  }

  private generateMockSystemMetrics(): SystemMetrics {
    return {
      server: {
        uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60), // seconds
        cpuUsage: Math.round(Math.random() * 100 * 100) / 100,
        memoryUsage: Math.round(Math.random() * 100 * 100) / 100,
        diskUsage: Math.round(Math.random() * 100 * 100) / 100,
        loadAverage: [
          Math.round(Math.random() * 4 * 100) / 100,
          Math.round(Math.random() * 4 * 100) / 100,
          Math.round(Math.random() * 4 * 100) / 100
        ],
        responseTime: Math.round(Math.random() * 500 + 50),
        requestCount: Math.floor(Math.random() * 100000) + 10000,
        errorRate: Math.round(Math.random() * 5 * 100) / 100
      },
      database: {
        connectionCount: Math.floor(Math.random() * 100) + 10,
        queryCount: Math.floor(Math.random() * 50000) + 5000,
        avgQueryTime: Math.round(Math.random() * 100 + 10),
        slowQueries: Math.floor(Math.random() * 50),
        cacheHitRate: Math.round((80 + Math.random() * 20) * 100) / 100,
        storageUsed: Math.round(Math.random() * 1000 * 100) / 100,
        backupStatus: ['success', 'failed', 'in_progress'][Math.floor(Math.random() * 3)] as any,
        lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      },
      application: {
        activeUsers: Math.floor(Math.random() * 500) + 50,
        totalUsers: Math.floor(Math.random() * 10000) + 1000,
        newRegistrations: Math.floor(Math.random() * 20) + 1,
        dailyActiveUsers: Math.floor(Math.random() * 300) + 30,
        weeklyActiveUsers: Math.floor(Math.random() * 800) + 100,
        monthlyActiveUsers: Math.floor(Math.random() * 2000) + 200,
        sessionDuration: Math.round(Math.random() * 3600 + 300), // seconds
        bounceRate: Math.round(Math.random() * 50 * 100) / 100,
        conversionRate: Math.round(Math.random() * 10 * 100) / 100
      },
      api: {
        totalRequests: Math.floor(Math.random() * 1000000) + 100000,
        successRate: Math.round((90 + Math.random() * 10) * 100) / 100,
        avgResponseTime: Math.round(Math.random() * 200 + 50),
        rateLimitHits: Math.floor(Math.random() * 1000),
        endpointUsage: [
          { endpoint: '/api/farms', calls: Math.floor(Math.random() * 10000), avgTime: Math.round(Math.random() * 100), errorRate: Math.round(Math.random() * 5 * 100) / 100 },
          { endpoint: '/api/crops', calls: Math.floor(Math.random() * 8000), avgTime: Math.round(Math.random() * 100), errorRate: Math.round(Math.random() * 5 * 100) / 100 },
          { endpoint: '/api/users', calls: Math.floor(Math.random() * 5000), avgTime: Math.round(Math.random() * 100), errorRate: Math.round(Math.random() * 5 * 100) / 100 }
        ]
      },
      security: {
        activeThreats: Math.floor(Math.random() * 5),
        blockedIPs: Math.floor(Math.random() * 100) + 10,
        failedLogins: Math.floor(Math.random() * 200) + 20,
        suspiciousActivity: Math.floor(Math.random() * 50) + 5,
        twoFactorAdoption: Math.round(Math.random() * 50 * 100) / 100,
        passwordStrength: Math.round((70 + Math.random() * 30) * 100) / 100,
        sslScore: Math.round((85 + Math.random() * 15) * 100) / 100
      }
    };
  }

  private generateMockUsageAnalytics(): UsageAnalytics {
    return {
      overview: {
        totalUsers: Math.floor(Math.random() * 10000) + 1000,
        activeUsers: Math.floor(Math.random() * 500) + 50,
        newUsers: Math.floor(Math.random() * 50) + 5,
        retentionRate: Math.round((70 + Math.random() * 25) * 100) / 100,
        churnRate: Math.round(Math.random() * 10 * 100) / 100,
        avgSessionDuration: Math.round(Math.random() * 3600 + 300),
        pageViews: Math.floor(Math.random() * 100000) + 10000,
        uniqueVisitors: Math.floor(Math.random() * 5000) + 500
      },
      usersByRole: {
        farmer: { count: 650, percentage: 65, growth: 12.5 },
        agronomist: { count: 89, percentage: 8.9, growth: 8.3 },
        trader: { count: 134, percentage: 13.4, growth: 15.2 },
        veterinarian: { count: 45, percentage: 4.5, growth: 6.8 },
        inspector: { count: 23, percentage: 2.3, growth: 18.9 },
        admin: { count: 12, percentage: 1.2, growth: 0 },
        government: { count: 28, percentage: 2.8, growth: 22.1 },
        investor: { count: 19, percentage: 1.9, growth: 31.5 }
      },
      usersByLocation: [
        { country: 'Tunisia', countryArabic: 'تونس', users: 850, percentage: 85 },
        { country: 'Algeria', countryArabic: 'الجزائر', users: 89, percentage: 8.9 },
        { country: 'Morocco', countryArabic: 'المغرب', users: 45, percentage: 4.5 },
        { country: 'Egypt', countryArabic: 'مصر', users: 16, percentage: 1.6 }
      ],
      featureUsage: [
        { feature: 'Farm Management', featureArabic: 'إدارة المزرعة', users: 734, usage: 89.2, trend: 'up' },
        { feature: 'Crop Monitoring', featureArabic: 'مراقبة المحاصيل', users: 612, usage: 74.3, trend: 'up' },
        { feature: 'Market Analysis', featureArabic: 'تحليل السوق', users: 445, usage: 54.1, trend: 'stable' },
        { feature: 'Weather Forecasting', featureArabic: 'توقعات الطقس', users: 523, usage: 63.5, trend: 'up' },
        { feature: 'Financial Tracking', featureArabic: 'تتبع المالية', users: 289, usage: 35.1, trend: 'down' }
      ],
      subscriptions: {
        totalRevenue: 45680,
        monthlyRecurringRevenue: 12340,
        annualRecurringRevenue: 148080,
        averageRevenuePerUser: 65.4,
        customerLifetimeValue: 892.3,
        subscriptionsByPlan: {
          free: { count: 450, revenue: 0, growth: 8.2 },
          basic: { count: 320, revenue: 9280, growth: 15.6 },
          premium: { count: 180, revenue: 14220, growth: 22.3 },
          enterprise: { count: 50, revenue: 9950, growth: 28.7 }
        }
      },
      support: {
        totalTickets: 234,
        openTickets: 23,
        resolvedTickets: 211,
        avgResolutionTime: 4.2, // hours
        customerSatisfaction: 4.6,
        ticketsByCategory: {
          'Technical Issues': 89,
          'Billing Questions': 45,
          'Feature Requests': 67,
          'Account Problems': 33
        }
      }
    };
  }

  getDashboardOverview(): any {
    const users = this.generateMockUsers();
    const metrics = this.generateMockSystemMetrics();
    const analytics = this.generateMockUsageAnalytics();
    const securityEvents = this.generateMockSecurityEvents();

    return {
      success: true,
      data: {
        summary: {
          totalUsers: analytics.overview.totalUsers,
          activeUsers: analytics.overview.activeUsers,
          newUsers: analytics.overview.newUsers,
          totalRevenue: analytics.subscriptions.totalRevenue,
          monthlyRecurring: analytics.subscriptions.monthlyRecurringRevenue,
          supportTickets: analytics.support.openTickets,
          systemUptime: metrics.server.uptime,
          securityAlerts: securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
        },
        recentUsers: users.slice(0, 5),
        systemHealth: {
          status: 'healthy',
          cpuUsage: metrics.server.cpuUsage,
          memoryUsage: metrics.server.memoryUsage,
          diskUsage: metrics.server.diskUsage,
          responseTime: metrics.server.responseTime
        },
        recentActivity: users.flatMap(u => u.activityLog).slice(0, 10),
        securityAlerts: securityEvents.filter(e => e.status !== 'resolved').slice(0, 5),
        lastUpdated: new Date().toISOString()
      }
    };
  }

  getUsers(): any {
    return {
      success: true,
      data: this.generateMockUsers()
    };
  }

  getSystemMetrics(): any {
    return {
      success: true,
      data: this.generateMockSystemMetrics()
    };
  }

  getUsageAnalytics(): any {
    return {
      success: true,
      data: this.generateMockUsageAnalytics()
    };
  }

  getSecurityEvents(): any {
    return {
      success: true,
      data: this.generateMockSecurityEvents()
    };
  }

  getActivityLogs(): any {
    const users = this.generateMockUsers();
    const allLogs = users.flatMap(u => u.activityLog);
    
    return {
      success: true,
      data: allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  }

  getSubscriptions(): any {
    const users = this.generateMockUsers();
    const subscriptions = users.filter(u => u.subscription).map(u => u.subscription);
    
    return {
      success: true,
      data: subscriptions
    };
  }
}

const adminPanelService = new AdminPanelService();

export const getAdminDashboard: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getDashboardOverview();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin dashboard' });
  }
};

export const getAdminUsers: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const getAdminSystemMetrics: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getSystemMetrics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch system metrics' });
  }
};

export const getAdminUsageAnalytics: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getUsageAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch usage analytics' });
  }
};

export const getAdminSecurityEvents: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getSecurityEvents();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch security events' });
  }
};

export const getAdminActivityLogs: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getActivityLogs();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
};

export const getAdminSubscriptions: RequestHandler = (req, res) => {
  try {
    const result = adminPanelService.getSubscriptions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
  }
};
