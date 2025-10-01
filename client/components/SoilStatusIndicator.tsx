import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoilStatusIndicatorProps {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  excellent: {
    label: 'ممتاز',
    icon: CheckCircle,
    color: 'bg-soil-healthy text-white',
    iconColor: 'text-soil-healthy'
  },
  good: {
    label: 'جيد',
    icon: CheckCircle,
    color: 'bg-soil-info text-white',
    iconColor: 'text-soil-info'
  },
  fair: {
    label: 'متوسط',
    icon: AlertTriangle,
    color: 'bg-soil-warning text-white',
    iconColor: 'text-soil-warning'
  },
  poor: {
    label: 'ضعيف',
    icon: XCircle,
    color: 'bg-soil-danger text-white',
    iconColor: 'text-soil-danger'
  }
};

export default function SoilStatusIndicator({ 
  status, 
  score, 
  size = 'md',
  showIcon = true,
  className 
}: SoilStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn("flex items-center space-x-2 rtl:space-x-reverse", className)}>
      {showIcon && (
        <Icon className={cn(iconSizes[size], config.iconColor)} />
      )}
      <Badge className={cn(config.color, sizeClasses[size])}>
        {config.label}
        {score !== undefined && ` (${Math.round(score)}%)`}
      </Badge>
    </div>
  );
}
