import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceStatusManager, ServiceStatus } from '@/lib/serviceStatus';

export interface HealthCheckResult {
  serviceId: string;
  isAvailable: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
  modelSource?: string;
  advisoryModelSource?: string;
  advisoryConfigured?: boolean;
  isRealModel?: boolean;
  modelTrainedOnSyntheticData?: boolean;
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
  services: ServiceStatus[];
  aiServiceIds: string[];
}

// Mock UI data is opt-in for local development only. It is never enabled
// by default and can never be enabled in a production build.
const FALLBACK_TO_MOCK =
  import.meta.env.DEV && import.meta.env.VITE_FALLBACK_TO_MOCK === "true";

export const useServiceHealthChecker = () => {

  const performHealthCheck = useCallback(async (service: ServiceStatus): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      // Skip health check if no endpoint provided
      if (!service.endpoint) {
        const isAvailable = service.status === 'available';

        return {
          serviceId: service.id,
          isAvailable,
          responseTime: 0,
          lastChecked: new Date(),
          error: isAvailable
            ? undefined
            : service.errorMessage ?? 'No endpoint configured'
        };
      }

      // For AI services that require local setup
      if (service.requiresLocal) {
        try {
          const response = await fetch(service.endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            return {
              serviceId: service.id,
              isAvailable: true,
              responseTime,
              lastChecked: new Date()
            };
          } else {
            return {
              serviceId: service.id,
              isAvailable: false,
              responseTime,
              lastChecked: new Date(),
              error: `HTTP ${response.status}: ${response.statusText}`
            };
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            serviceId: service.id,
            isAvailable: false,
            responseTime,
            lastChecked: new Date(),
            error: service.requiresLocal ? 
              'Local AI services not running (requires docker-compose up)' : 
              error instanceof Error ? error.message : 'Connection failed'
          };
        }
      }

      // For core services (Supabase)
      if (service.id.includes('supabase')) {
        try {
          const response = await fetch(service.endpoint, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout for external services
          });
          
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
          return {
            serviceId: service.id,
            isAvailable: false,
            responseTime,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Connection failed'
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

  const healthQuery = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      try {
        const { aiServices, coreServices } =
          await serviceStatusManager.checkAllServices();

        const allServices = [
          ...coreServices,
          ...aiServices.flatMap(category => category.services)
        ];

        const aiServiceIds = new Set(
          aiServices.flatMap(category =>
            category.services.map(service => service.id)
          )
        );

        const healthChecks = await Promise.all(
          allServices.map(async service => {
            if (aiServiceIds.has(service.id)) {
              return {
                serviceId: service.id,
                isAvailable: service.status === 'available',
                responseTime: 0,
                lastChecked: service.lastChecked ?? new Date(),
                modelSource: service.modelSource,
                advisoryModelSource: service.advisoryModelSource,
                advisoryConfigured: service.advisoryConfigured,
                isRealModel: service.isRealModel,
                modelTrainedOnSyntheticData: service.modelTrainedOnSyntheticData,
                error: service.status === 'available'
                  ? undefined
                  : service.errorMessage ?? 'AI service unavailable'
              };
            }

            return performHealthCheck(service);
          })
        );

        const availableServices =
          healthChecks.filter(check => check.isAvailable).length;

        const coreServicesCount = coreServices.length;
        const aiServicesCount =
          aiServices.reduce((count, category) =>
            count + category.services.length, 0);

        const coreServicesAvailable = healthChecks
          .filter(check => coreServices.some(
            service => service.id === check.serviceId
          ))
          .filter(check => check.isAvailable).length;

        let overall: SystemHealth['overall'];

        if (coreServicesAvailable === 0) {
          overall = 'down';
        } else if (
          coreServicesAvailable < coreServicesCount ||
          availableServices < allServices.length * 0.5
        ) {
          overall = 'degraded';
        } else {
          overall = 'healthy';
        }

        const criticalIssues: string[] = [];

        if (coreServicesAvailable === 0) {
          criticalIssues.push('Database connection failed');
        }

        const aiServicesAvailable = healthChecks
          .filter(check => aiServiceIds.has(check.serviceId))
          .filter(check => check.isAvailable).length;

        if (aiServicesAvailable === 0) {
          criticalIssues.push('All AI services unavailable');
        }

        const authHealthCheck = healthChecks.find(
          check => check.serviceId === 'supabase-auth'
        );

        if (authHealthCheck && !authHealthCheck.isAvailable) {
          criticalIssues.push('Authentication service unavailable');
        }

        return {
          overall,
          coreServicesCount,
          aiServicesCount,
          availableServices,
          totalServices: allServices.length,
          criticalIssues,
          healthChecks,
          lastUpdate: new Date(),
          services: allServices.map(service => {
            const check = healthChecks.find(
              result => result.serviceId === service.id
            );

            if (!check) return service;

            const status: ServiceStatus['status'] =
              aiServiceIds.has(service.id) || !service.endpoint
                ? service.status
                : check.isAvailable
                  ? 'available'
                  : check.error?.startsWith('HTTP ')
                    ? 'unavailable'
                    : 'error';

            return {
              ...service,
              status,
              lastChecked: check.lastChecked,
              errorMessage: check.isAvailable
                ? undefined
                : service.errorMessage ?? check.error
            };
          }),
          aiServiceIds: [...aiServiceIds]
        };
      } catch (error) {
        console.error('❌ Health check failed:', error);

        return {
          overall: 'down',
          coreServicesCount: 0,
          aiServicesCount: 0,
          availableServices: 0,
          totalServices: 0,
          criticalIssues: ['Health check system failure'],
          healthChecks: [],
          lastUpdate: new Date(),
          services: [],
          aiServiceIds: []
        };
      }
    },
    staleTime: 55_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: false
  });

  const systemHealth = healthQuery.data ?? null;
  const isChecking = healthQuery.isFetching;

  const checkAllServices = useCallback(async (): Promise<SystemHealth> => {
    const result = await healthQuery.refetch();

    return result.data ?? {
      overall: 'down',
      coreServicesCount: 0,
      aiServicesCount: 0,
      availableServices: 0,
      totalServices: 0,
      criticalIssues: ['Health check system failure'],
      healthChecks: [],
      lastUpdate: new Date(),
      services: [],
      aiServiceIds: []
    };
  }, [healthQuery.refetch]);

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
    services: systemHealth?.services || [],
    aiServiceIds: systemHealth?.aiServiceIds || [],
    isSystemHealthy: systemHealth?.overall === 'healthy',
    hasCriticalIssues: (systemHealth?.criticalIssues.length || 0) > 0
  };
};
