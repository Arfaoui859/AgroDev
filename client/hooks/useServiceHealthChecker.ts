import { useState, useEffect, useCallback } from 'react';
import { serviceStatusManager, ServiceStatus } from '@/lib/serviceStatus';

export interface HealthCheckResult {
  serviceId: string;
  isAvailable: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  coreServicesCount: number;
  aiServicesCount: number;
  availableServices: number;
  totalServices: number;
  criticalIssues: string[];
  healthChecks: HealthCheckResult[];
  lastUpdate: Date;
}

const FALLBACK_TO_MOCK = import.meta.env.VITE_FALLBACK_TO_MOCK !== 'false';

export const useServiceHealthChecker = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const performHealthCheck = useCallback(async (service: ServiceStatus): Promise<HealthCheckResult> => {
    const startTime = Date.now();

    try {
      // Skip health check if no endpoint provided
      if (!service.endpoint) {
        return {
          serviceId: service.id,
          isAvailable: false,
          responseTime: 0,
          lastChecked: new Date(),
          error: 'No endpoint configured'
        };
      }

      // For AI services that require local setup - skip in production
      if (service.requiresLocal) {
        // In production/deployed environments, assume local services are not available
        const responseTime = Date.now() - startTime;
        return {
          serviceId: service.id,
          isAvailable: false,
          responseTime,
          lastChecked: new Date(),
          error: 'Local AI services not running (requires docker-compose up)'
        };
      }

      // For core services (Supabase, etc.)
      if (service.id.includes('supabase') || service.id.includes('auth')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(service.endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          return {
            serviceId: service.id,
            isAvailable: response.ok,
            responseTime,
            lastChecked: new Date(),
            error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';

          return {
            serviceId: service.id,
            isAvailable: false,
            responseTime,
            lastChecked: new Date(),
            error: errorMessage.includes('timeout') || errorMessage.includes('abort')
              ? 'Service request timeout'
              : errorMessage
          };
        }
      }

      // Default: assume service is not available
      return {
        serviceId: service.id,
        isAvailable: false,
        responseTime: 0,
        lastChecked: new Date(),
        error: 'Service type not supported for health checks'
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        serviceId: service.id,
        isAvailable: false,
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unexpected error'
      };
    }
  }, []);

  const checkAllServices = useCallback(async (): Promise<SystemHealth> => {
    setIsChecking(true);
    
    try {
      const { aiServices, coreServices } = await serviceStatusManager.checkAllServices();
      
      const allServices = [
        ...coreServices,
        ...aiServices.flatMap(category => category.services)
      ];

      // Perform health checks in parallel
      const healthCheckPromises = allServices.map(service => performHealthCheck(service));
      const healthChecks = await Promise.all(healthCheckPromises);

      const availableServices = healthChecks.filter(check => check.isAvailable).length;
      const coreServicesCount = coreServices.length;
      const aiServicesCount = aiServices.flatMap(cat => cat.services).length;

      // Determine overall system health
      const coreServicesAvailable = healthChecks
        .filter(check => coreServices.some(s => s.id === check.serviceId))
        .filter(check => check.isAvailable).length;

      let overall: 'healthy' | 'degraded' | 'down';
      
      if (coreServicesAvailable === 0) {
        overall = 'down';
      } else if (coreServicesAvailable < coreServicesCount || availableServices < allServices.length * 0.5) {
        overall = 'degraded';
      } else {
        overall = 'healthy';
      }

      // Identify critical issues
      const criticalIssues: string[] = [];
      
      if (coreServicesAvailable === 0) {
        criticalIssues.push('Database connection failed');
      }
      
      const aiServicesAvailable = healthChecks
        .filter(check => aiServices.flatMap(cat => cat.services).some(s => s.id === check.serviceId))
        .filter(check => check.isAvailable).length;
      
      if (aiServicesAvailable === 0) {
        criticalIssues.push('All AI services unavailable');
      }

      // Check for authentication issues
      const authHealthCheck = healthChecks.find(check => check.serviceId === 'supabase-auth');
      if (authHealthCheck && !authHealthCheck.isAvailable) {
        criticalIssues.push('Authentication service unavailable');
      }

      const systemHealth: SystemHealth = {
        overall,
        coreServicesCount,
        aiServicesCount,
        availableServices,
        totalServices: allServices.length,
        criticalIssues,
        healthChecks,
        lastUpdate: new Date()
      };

      console.log('🔍 System Health Check Results:', {
        overall,
        available: `${availableServices}/${allServices.length}`,
        criticalIssues,
        fallbackMode: FALLBACK_TO_MOCK ? 'ENABLED' : 'DISABLED'
      });

      setSystemHealth(systemHealth);
      return systemHealth;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      const fallbackHealth: SystemHealth = {
        overall: 'down',
        coreServicesCount: 0,
        aiServicesCount: 0,
        availableServices: 0,
        totalServices: 0,
        criticalIssues: ['Health check system failure'],
        healthChecks: [],
        lastUpdate: new Date()
      };
      
      setSystemHealth(fallbackHealth);
      return fallbackHealth;
    } finally {
      setIsChecking(false);
    }
  }, [performHealthCheck]);

  // Auto-check on mount and every 60 seconds
  useEffect(() => {
    checkAllServices();
    
    const interval = setInterval(() => {
      checkAllServices();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAllServices]);

  const isServiceAvailable = useCallback((serviceId: string): boolean => {
    if (!systemHealth) return false;
    
    const healthCheck = systemHealth.healthChecks.find(check => check.serviceId === serviceId);
    return healthCheck?.isAvailable || false;
  }, [systemHealth]);

  const getServiceError = useCallback((serviceId: string): string | undefined => {
    if (!systemHealth) return undefined;
    
    const healthCheck = systemHealth.healthChecks.find(check => check.serviceId === serviceId);
    return healthCheck?.error;
  }, [systemHealth]);

  const shouldShowMockData = useCallback((serviceId: string): boolean => {
    // Only show mock data if explicitly enabled AND service is not available
    return FALLBACK_TO_MOCK && !isServiceAvailable(serviceId);
  }, [isServiceAvailable]);

  return {
    systemHealth,
    isChecking,
    checkAllServices,
    isServiceAvailable,
    getServiceError,
    shouldShowMockData,
    healthChecks: systemHealth?.healthChecks || [],
    isSystemHealthy: systemHealth?.overall === 'healthy',
    hasCriticalIssues: (systemHealth?.criticalIssues.length || 0) > 0
  };
};
