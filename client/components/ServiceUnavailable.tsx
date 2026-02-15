import React from 'react';
import { AlertTriangle, ExternalLink, Settings, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ServiceUnavailableProps {
  serviceName: string;
  description?: string;
  requiresLocal?: boolean;
  errorMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const ServiceUnavailable: React.FC<ServiceUnavailableProps> = ({
  serviceName,
  description,
  requiresLocal = false,
  errorMessage,
  showRetry = false,
  onRetry,
  compact = false
}) => {
  if (compact) {
    return (
      <Alert variant="destructive" className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Service Unavailable</AlertTitle>
        <AlertDescription>
          {serviceName} is currently not available.
          {requiresLocal && " Requires local AI services."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-orange-900 flex items-center justify-center gap-2">
          {serviceName}
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            Unavailable
          </Badge>
        </CardTitle>
        {description && (
          <CardDescription className="text-orange-700">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {requiresLocal ? (
          <Alert className="border-blue-200 bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Local AI Services Required</AlertTitle>
            <AlertDescription className="text-blue-800">
              This feature requires local AI microservices to be running. 
              Please set up the local development environment to use this service.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <Zap className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Service Connection Error</AlertTitle>
            <AlertDescription className="text-red-800">
              {errorMessage || "Unable to connect to the service at this time."}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {showRetry && onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Try Again
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/service-status'}
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View All Services
          </Button>
        </div>

        <div className="text-xs text-gray-600 text-center pt-2 border-t border-orange-200">
          For development setup instructions, check the project README or contact support.
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceUnavailable;
