import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Trend {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: Trend;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'accent';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default'
}) => {
  const getVariantStyles = (variant: string) => {
    const styles = {
      default: 'text-muted-foreground',
      primary: 'text-medical',
      secondary: 'text-medical-secondary',
      success: 'text-success',
      accent: 'text-accent'
    };
    return styles[variant as keyof typeof styles] || styles.default;
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            {trend && (
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-muted`}>
          <Icon className={`h-8 w-8 ${getVariantStyles(variant)}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;