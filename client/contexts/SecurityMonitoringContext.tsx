import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// =============== SECURITY MONITORING TYPES ===============

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'suspicious_ip' | 'bot_activity' | 'data_scraping' | 'sql_injection' | 
        'xss_attempt' | 'ddos' | 'unusual_login' | 'privilege_escalation' | 'data_exfiltration';
  typeArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityArabic: string;
  source: {
    ipAddress: string;
    userAgent: string;
    location: string;
    userId?: string;
    sessionId?: string;
  };
  details: {
    description: string;
    descriptionArabic: string;
    evidence: string[];
    affectedResources: string[];
    attackVector: string;
    potentialImpact: string;
  };
  detectedAt: string;
  status: 'active' | 'mitigated' | 'false_positive' | 'investigating';
  statusArabic: string;
  mitigation?: {
    action: 'ban_ip' | 'ban_user' | 'rate_limit' | 'captcha' | 'monitor' | 'block_request';
    actionArabic: string;
    appliedAt: string;
    duration?: string;
    automatic: boolean;
  };
  riskScore: number; // 0-100
  confidence: number; // 0-100
}

export interface BannedEntity {
  id: string;
  type: 'ip' | 'user' | 'user_agent' | 'country';
  value: string;
  reason: string;
  reasonArabic: string;
  bannedBy: 'system' | 'admin';
  bannedAt: string;
  expiresAt?: string;
  isPermanent: boolean;
  isActive: boolean;
  attempts: number;
  lastAttempt?: string;
  whitelist?: boolean; // For trusted IPs/users
}

export interface SecurityRule {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  type: 'rate_limiting' | 'ip_blocking' | 'behavior_analysis' | 'content_filtering' | 'access_control';
  enabled: boolean;
  severity: 'info' | 'warning' | 'critical';
  conditions: {
    maxAttempts?: number;
    timeWindow?: number; // in minutes
    ipWhitelist?: string[];
    ipBlacklist?: string[];
    userAgentPatterns?: string[];
    geoRestrictions?: {
      allowedCountries?: string[];
      blockedCountries?: string[];
    };
    customRules?: {
      field: string;
      operator: 'equals' | 'contains' | 'regex' | 'greater_than' | 'less_than';
      value: string;
    }[];
  };
  actions: {
    immediate: ('log' | 'alert' | 'ban' | 'rate_limit' | 'captcha' | 'block')[];
    escalation: {
      threshold: number;
      actions: ('notify_admin' | 'ban_permanent' | 'escalate_to_security')[];
    };
  };
  metrics: {
    triggered: number;
    blocked: number;
    falsePositives: number;
    lastTriggered?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecurityMetrics {
  overview: {
    totalThreats: number;
    activeThreats: number;
    mitigatedThreats: number;
    bannedIPs: number;
    bannedUsers: number;
    riskScore: number; // Overall system risk 0-100
  };
  threatsByType: { [key: string]: number };
  threatsBySeverity: { [key: string]: number };
  topAttackSources: {
    ip: string;
    location: string;
    attempts: number;
    lastSeen: string;
  }[];
  securityTrends: {
    date: string;
    threats: number;
    blocked: number;
    riskScore: number;
  }[];
  geographicDistribution: {
    country: string;
    countryCode: string;
    threatCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export interface SecurityIncident {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo?: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  affectedSystems: string[];
  timeline: {
    timestamp: string;
    action: string;
    actionArabic: string;
    performedBy: string;
    details: string;
  }[];
  attachments: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  impact: {
    usersAffected: number;
    systemsAffected: number;
    dataCompromised: boolean;
    serviceInterruption: boolean;
    estimatedCost: number;
  };
}

interface SecurityMonitoringContextType {
  // Threat Management
  threats: SecurityThreat[];
  bannedEntities: BannedEntity[];
  securityRules: SecurityRule[];
  
  // Real-time Monitoring
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  
  // Threat Detection
  reportThreat: (threat: Omit<SecurityThreat, 'id' | 'detectedAt' | 'status'>) => void;
  investigateThreat: (threatId: string) => Promise<{ success: boolean; error?: string }>;
  mitigateThreat: (threatId: string, action: SecurityThreat['mitigation']) => Promise<{ success: boolean; error?: string }>;
  dismissThreat: (threatId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  
  // Banning System
  banIP: (ip: string, reason: string, duration?: string) => Promise<{ success: boolean; error?: string }>;
  banUser: (userId: string, reason: string, duration?: string) => Promise<{ success: boolean; error?: string }>;
  unbanEntity: (entityId: string) => Promise<{ success: boolean; error?: string }>;
  checkIfBanned: (type: 'ip' | 'user', value: string) => boolean;
  
  // Security Rules
  createSecurityRule: (rule: Omit<SecurityRule, 'id' | 'metrics' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateSecurityRule: (ruleId: string, updates: Partial<SecurityRule>) => Promise<{ success: boolean; error?: string }>;
  deleteSecurityRule: (ruleId: string) => Promise<{ success: boolean; error?: string }>;
  testSecurityRule: (rule: SecurityRule, testData: any) => boolean;
  
  // Analytics & Reporting
  getSecurityMetrics: (dateRange?: { start: string; end: string }) => SecurityMetrics;
  generateSecurityReport: (format: 'pdf' | 'csv' | 'json') => Promise<{ success: boolean; url?: string; error?: string }>;
  
  // Incident Management
  incidents: SecurityIncident[];
  createIncident: (incident: Omit<SecurityIncident, 'id' | 'reportedAt' | 'timeline'>) => Promise<{ success: boolean; error?: string }>;
  updateIncident: (incidentId: string, updates: Partial<SecurityIncident>) => Promise<{ success: boolean; error?: string }>;
  addIncidentTimeline: (incidentId: string, entry: Omit<SecurityIncident['timeline'][0], 'timestamp'>) => Promise<{ success: boolean; error?: string }>;
  
  // AI & Machine Learning
  analyzeUserBehavior: (userId: string) => Promise<{ riskScore: number; anomalies: string[]; recommendations: string[] }>;
  predictThreats: () => Promise<{ predictedThreats: string[]; confidence: number; timeline: string }>;
  
  // Emergency Response
  emergencyLockdown: (reason: string) => Promise<{ success: boolean; error?: string }>;
  isInLockdown: boolean;
  lockdownReason?: string;
}

const SecurityMonitoringContext = createContext<SecurityMonitoringContextType | undefined>(undefined);

export const useSecurityMonitoring = () => {
  const context = useContext(SecurityMonitoringContext);
  if (context === undefined) {
    throw new Error('useSecurityMonitoring must be used within a SecurityMonitoringProvider');
  }
  return context;
};

// =============== MOCK DATA ===============

const mockSecurityRules: SecurityRule[] = [
  {
    id: 'rule-brute-force',
    name: 'Brute Force Protection',
    nameArabic: 'حماية من القوة الغاشمة',
    description: 'Detect and block brute force login attempts',
    descriptionArabic: 'كشف ومنع محاولات تسجيل الدخول بالقوة الغاشمة',
    type: 'rate_limiting',
    enabled: true,
    severity: 'critical',
    conditions: {
      maxAttempts: 5,
      timeWindow: 15, // 15 minutes
    },
    actions: {
      immediate: ['log', 'ban'],
      escalation: {
        threshold: 10,
        actions: ['notify_admin', 'ban_permanent']
      }
    },
    metrics: {
      triggered: 45,
      blocked: 43,
      falsePositives: 2,
      lastTriggered: new Date(Date.now() - 3600000).toISOString()
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'rule-suspicious-ip',
    name: 'Suspicious IP Detection',
    nameArabic: 'كشف العناوين المشبوهة',
    description: 'Monitor and block suspicious IP addresses',
    descriptionArabic: 'مراقبة ومنع عناوين IP المشبوهة',
    type: 'ip_blocking',
    enabled: true,
    severity: 'warning',
    conditions: {
      ipBlacklist: ['192.168.1.100', '10.0.0.1'],
      geoRestrictions: {
        blockedCountries: ['XX', 'YY'] // Mock country codes
      }
    },
    actions: {
      immediate: ['log', 'block'],
      escalation: {
        threshold: 5,
        actions: ['notify_admin']
      }
    },
    metrics: {
      triggered: 12,
      blocked: 12,
      falsePositives: 0,
      lastTriggered: new Date(Date.now() - 7200000).toISOString()
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

const mockThreats: SecurityThreat[] = [
  {
    id: 'threat-001',
    type: 'brute_force',
    typeArabic: 'قوة غاشمة',
    severity: 'high',
    severityArabic: 'عالي',
    source: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      location: 'Unknown',
      sessionId: 'session-123'
    },
    details: {
      description: 'Multiple failed login attempts detected',
      descriptionArabic: 'تم اكتشاف محاولات تسجيل دخول فاشلة متعددة',
      evidence: ['5 failed attempts in 2 minutes', 'Different usernames tried'],
      affectedResources: ['/api/auth/login'],
      attackVector: 'HTTP POST requests',
      potentialImpact: 'Account compromise'
    },
    detectedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    status: 'active',
    statusArabic: 'نشط',
    mitigation: {
      action: 'ban_ip',
      actionArabic: 'حظر العنوان',
      appliedAt: new Date(Date.now() - 1500000).toISOString(),
      duration: '24h',
      automatic: true
    },
    riskScore: 85,
    confidence: 92
  },
  {
    id: 'threat-002',
    type: 'suspicious_ip',
    typeArabic: 'عنوان مشبوه',
    severity: 'medium',
    severityArabic: 'متوسط',
    source: {
      ipAddress: '10.0.0.1',
      userAgent: 'curl/7.68.0',
      location: 'Proxy Server',
    },
    details: {
      description: 'Access from known proxy/VPN service',
      descriptionArabic: 'وصول من خدمة بروكسي/VPN معروفة',
      evidence: ['IP in known proxy list', 'Unusual user agent'],
      affectedResources: ['/api/data/export'],
      attackVector: 'API requests via proxy',
      potentialImpact: 'Data exfiltration'
    },
    detectedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'investigating',
    statusArabic: 'قيد التحقيق',
    riskScore: 65,
    confidence: 78
  }
];

const mockIncidents: SecurityIncident[] = [
  {
    id: 'incident-001',
    title: 'Coordinated Brute Force Attack',
    titleArabic: 'هجوم قوة غاشمة منسق',
    description: 'Multiple IPs attempting brute force attacks simultaneously',
    descriptionArabic: 'عدة عناوين IP تحاول هجمات القوة الغاشمة في نفس الوقت',
    severity: 'high',
    status: 'investigating',
    reportedBy: 'system',
    reportedAt: new Date(Date.now() - 7200000).toISOString(),
    affectedSystems: ['Authentication Service', 'User Database'],
    timeline: [
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'Incident detected by automated system',
        actionArabic: 'تم اكتشاف الحادث بواسطة النظام التلقائي',
        performedBy: 'system',
        details: 'Multiple failed login attempts from 15 different IPs'
      },
      {
        timestamp: new Date(Date.now() - 6900000).toISOString(),
        action: 'Automatic IP banning initiated',
        actionArabic: 'تم بدء حظر العناوين تلقائياً',
        performedBy: 'system',
        details: '15 IP addresses banned for 24 hours'
      }
    ],
    attachments: [],
    impact: {
      usersAffected: 0,
      systemsAffected: 2,
      dataCompromised: false,
      serviceInterruption: false,
      estimatedCost: 0
    }
  }
];

// =============== SECURITY MONITORING PROVIDER ===============

export const SecurityMonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [threats, setThreats] = useState<SecurityThreat[]>(mockThreats);
  const [bannedEntities, setBannedEntities] = useState<BannedEntity[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>(mockSecurityRules);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(mockIncidents);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isInLockdown, setIsInLockdown] = useState(false);
  const [lockdownReason, setLockdownReason] = useState<string>();

  // Simulated real-time threat detection
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Simulate random threat detection
      if (Math.random() < 0.1) { // 10% chance every interval
        generateMockThreat();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const generateMockThreat = () => {
    const threatTypes = [
      { type: 'brute_force', typeArabic: 'قوة غاشمة', severity: 'high' },
      { type: 'suspicious_ip', typeArabic: 'عنوان مشبوه', severity: 'medium' },
      { type: 'bot_activity', typeArabic: 'نشاط بوت', severity: 'low' }
    ];

    const randomThreat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    
    const newThreat: SecurityThreat = {
      id: `threat-${Date.now()}`,
      type: randomThreat.type as any,
      typeArabic: randomThreat.typeArabic,
      severity: randomThreat.severity as any,
      severityArabic: randomThreat.severity === 'high' ? 'عالي' : randomThreat.severity === 'medium' ? 'متوسط' : 'منخفض',
      source: {
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (automated)',
        location: 'Unknown'
      },
      details: {
        description: `Automated threat detection: ${randomThreat.type}`,
        descriptionArabic: `كشف تهديد تلقائي: ${randomThreat.typeArabic}`,
        evidence: ['Automated detection', 'Pattern matching'],
        affectedResources: ['/api/auth'],
        attackVector: 'HTTP requests',
        potentialImpact: 'Security breach'
      },
      detectedAt: new Date().toISOString(),
      status: 'active',
      statusArabic: 'نشط',
      riskScore: Math.floor(Math.random() * 40) + 30, // 30-70
      confidence: Math.floor(Math.random() * 30) + 70 // 70-100
    };

    setThreats(prev => [newThreat, ...prev.slice(0, 99)]); // Keep last 100

    // Auto-mitigate high severity threats
    if (newThreat.severity === 'high') {
      setTimeout(() => {
        mitigateThreat(newThreat.id, {
          action: 'ban_ip',
          actionArabic: 'حظر العنوان',
          appliedAt: new Date().toISOString(),
          duration: '1h',
          automatic: true
        });
      }, 5000); // Auto-mitigate after 5 seconds
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const reportThreat = (threat: Omit<SecurityThreat, 'id' | 'detectedAt' | 'status'>) => {
    const newThreat: SecurityThreat = {
      ...threat,
      id: `threat-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      status: 'active',
      statusArabic: 'نشط'
    };

    setThreats(prev => [newThreat, ...prev]);
  };

  const investigateThreat = async (threatId: string) => {
    try {
      setThreats(prev => prev.map(threat => 
        threat.id === threatId 
          ? { ...threat, status: 'investigating', statusArabic: 'قيد التحقيق' }
          : threat
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update threat status' };
    }
  };

  const mitigateThreat = async (threatId: string, mitigation: SecurityThreat['mitigation']) => {
    try {
      setThreats(prev => prev.map(threat => 
        threat.id === threatId 
          ? { ...threat, status: 'mitigated', statusArabic: 'تم التخفيف', mitigation }
          : threat
      ));

      // Apply mitigation action
      const threat = threats.find(t => t.id === threatId);
      if (threat && mitigation) {
        switch (mitigation.action) {
          case 'ban_ip':
            await banIP(threat.source.ipAddress, `Automatic ban due to ${threat.type}`, mitigation.duration);
            break;
          case 'ban_user':
            if (threat.source.userId) {
              await banUser(threat.source.userId, `Automatic ban due to ${threat.type}`, mitigation.duration);
            }
            break;
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to mitigate threat' };
    }
  };

  const dismissThreat = async (threatId: string, reason: string) => {
    try {
      setThreats(prev => prev.map(threat => 
        threat.id === threatId 
          ? { ...threat, status: 'false_positive', statusArabic: 'إنذار كاذب' }
          : threat
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to dismiss threat' };
    }
  };

  const banIP = async (ip: string, reason: string, duration?: string) => {
    try {
      const bannedEntity: BannedEntity = {
        id: `ban-ip-${Date.now()}`,
        type: 'ip',
        value: ip,
        reason,
        reasonArabic: reason, // In real app, translate
        bannedBy: 'system',
        bannedAt: new Date().toISOString(),
        expiresAt: duration ? new Date(Date.now() + parseDuration(duration)).toISOString() : undefined,
        isPermanent: !duration,
        isActive: true,
        attempts: 1
      };

      setBannedEntities(prev => [bannedEntity, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to ban IP' };
    }
  };

  const banUser = async (userId: string, reason: string, duration?: string) => {
    try {
      const bannedEntity: BannedEntity = {
        id: `ban-user-${Date.now()}`,
        type: 'user',
        value: userId,
        reason,
        reasonArabic: reason,
        bannedBy: 'system',
        bannedAt: new Date().toISOString(),
        expiresAt: duration ? new Date(Date.now() + parseDuration(duration)).toISOString() : undefined,
        isPermanent: !duration,
        isActive: true,
        attempts: 1
      };

      setBannedEntities(prev => [bannedEntity, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to ban user' };
    }
  };

  const unbanEntity = async (entityId: string) => {
    try {
      setBannedEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, isActive: false }
          : entity
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to unban entity' };
    }
  };

  const checkIfBanned = (type: 'ip' | 'user', value: string): boolean => {
    const entity = bannedEntities.find(e => 
      e.type === type && 
      e.value === value && 
      e.isActive &&
      (!e.expiresAt || new Date(e.expiresAt) > new Date())
    );
    return !!entity;
  };

  const parseDuration = (duration: string): number => {
    const units = { 'm': 60000, 'h': 3600000, 'd': 86400000 };
    const match = duration.match(/^(\d+)([mhd])$/);
    if (!match) return 3600000; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof units;
    return value * units[unit];
  };

  const createSecurityRule = async (rule: Omit<SecurityRule, 'id' | 'metrics' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRule: SecurityRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        metrics: {
          triggered: 0,
          blocked: 0,
          falsePositives: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setSecurityRules(prev => [newRule, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create security rule' };
    }
  };

  const updateSecurityRule = async (ruleId: string, updates: Partial<SecurityRule>) => {
    try {
      setSecurityRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
          : rule
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update security rule' };
    }
  };

  const deleteSecurityRule = async (ruleId: string) => {
    try {
      setSecurityRules(prev => prev.filter(rule => rule.id !== ruleId));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete security rule' };
    }
  };

  const testSecurityRule = (rule: SecurityRule, testData: any): boolean => {
    // Simplified rule testing logic
    if (rule.type === 'rate_limiting' && rule.conditions.maxAttempts) {
      return testData.attempts > rule.conditions.maxAttempts;
    }
    return false;
  };

  const getSecurityMetrics = (dateRange?: { start: string; end: string }): SecurityMetrics => {
    let filteredThreats = threats;
    
    if (dateRange) {
      filteredThreats = threats.filter(threat => 
        threat.detectedAt >= dateRange.start && threat.detectedAt <= dateRange.end
      );
    }

    const threatsByType = filteredThreats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const threatsBySeverity = filteredThreats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topAttackSources = Object.entries(
      filteredThreats.reduce((acc, threat) => {
        const ip = threat.source.ipAddress;
        if (!acc[ip]) {
          acc[ip] = { attempts: 0, location: threat.source.location, lastSeen: threat.detectedAt };
        }
        acc[ip].attempts++;
        if (threat.detectedAt > acc[ip].lastSeen) {
          acc[ip].lastSeen = threat.detectedAt;
        }
        return acc;
      }, {} as any)
    ).map(([ip, data]: [string, any]) => ({
      ip,
      location: data.location,
      attempts: data.attempts,
      lastSeen: data.lastSeen
    })).sort((a, b) => b.attempts - a.attempts).slice(0, 10);

    // Generate mock trends for last 7 days
    const securityTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        threats: Math.floor(Math.random() * 20) + 5,
        blocked: Math.floor(Math.random() * 15) + 2,
        riskScore: Math.floor(Math.random() * 30) + 40
      };
    });

    const geographicDistribution = [
      { country: 'Jordan', countryCode: 'JO', threatCount: 5, riskLevel: 'low' as const },
      { country: 'Unknown', countryCode: 'XX', threatCount: 15, riskLevel: 'high' as const },
      { country: 'United States', countryCode: 'US', threatCount: 8, riskLevel: 'medium' as const }
    ];

    return {
      overview: {
        totalThreats: filteredThreats.length,
        activeThreats: filteredThreats.filter(t => t.status === 'active').length,
        mitigatedThreats: filteredThreats.filter(t => t.status === 'mitigated').length,
        bannedIPs: bannedEntities.filter(e => e.type === 'ip' && e.isActive).length,
        bannedUsers: bannedEntities.filter(e => e.type === 'user' && e.isActive).length,
        riskScore: Math.floor(Math.random() * 30) + 40 // 40-70
      },
      threatsByType,
      threatsBySeverity,
      topAttackSources,
      securityTrends,
      geographicDistribution
    };
  };

  const generateSecurityReport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportUrl = `https://example.com/reports/security-report-${Date.now()}.${format}`;
      return { success: true, url: reportUrl };
    } catch (error) {
      return { success: false, error: 'Failed to generate report' };
    }
  };

  const createIncident = async (incident: Omit<SecurityIncident, 'id' | 'reportedAt' | 'timeline'>) => {
    try {
      const newIncident: SecurityIncident = {
        ...incident,
        id: `incident-${Date.now()}`,
        reportedAt: new Date().toISOString(),
        timeline: [
          {
            timestamp: new Date().toISOString(),
            action: 'Incident created',
            actionArabic: 'تم إنشاء الحادث',
            performedBy: user?.id || 'system',
            details: 'Initial incident report'
          }
        ]
      };

      setIncidents(prev => [newIncident, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create incident' };
    }
  };

  const updateIncident = async (incidentId: string, updates: Partial<SecurityIncident>) => {
    try {
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId ? { ...incident, ...updates } : incident
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update incident' };
    }
  };

  const addIncidentTimeline = async (incidentId: string, entry: Omit<SecurityIncident['timeline'][0], 'timestamp'>) => {
    try {
      const timelineEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };

      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, timeline: [timelineEntry, ...incident.timeline] }
          : incident
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to add timeline entry' };
    }
  };

  const analyzeUserBehavior = async (userId: string) => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      riskScore: Math.floor(Math.random() * 30) + 20, // 20-50
      anomalies: [
        'Unusual login times',
        'Different IP ranges',
        'Increased API usage'
      ],
      recommendations: [
        'Enable 2FA',
        'Monitor user activity',
        'Review access permissions'
      ]
    };
  };

  const predictThreats = async () => {
    // Simulate ML prediction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      predictedThreats: ['DDoS attack', 'Data exfiltration attempt'],
      confidence: 78,
      timeline: '24-48 hours'
    };
  };

  const emergencyLockdown = async (reason: string) => {
    try {
      setIsInLockdown(true);
      setLockdownReason(reason);
      
      // In a real app, this would disable all non-essential services
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to initiate lockdown' };
    }
  };

  const value: SecurityMonitoringContextType = {
    threats,
    bannedEntities,
    securityRules,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reportThreat,
    investigateThreat,
    mitigateThreat,
    dismissThreat,
    banIP,
    banUser,
    unbanEntity,
    checkIfBanned,
    createSecurityRule,
    updateSecurityRule,
    deleteSecurityRule,
    testSecurityRule,
    getSecurityMetrics,
    generateSecurityReport,
    incidents,
    createIncident,
    updateIncident,
    addIncidentTimeline,
    analyzeUserBehavior,
    predictThreats,
    emergencyLockdown,
    isInLockdown,
    lockdownReason
  };

  return (
    <SecurityMonitoringContext.Provider value={value}>
      {children}
    </SecurityMonitoringContext.Provider>
  );
};
