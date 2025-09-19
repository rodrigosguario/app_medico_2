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
  const getVariantStyles = () => {
    const styles = {
      default: {
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        cardClass: 'metric-card'
      },
      primary: {
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        cardClass: 'metric-card primary'
      },
      secondary: {
        iconBg: 'bg-secondary/10',
        iconColor: 'text-secondary',
        cardClass: 'metric-card secondary'
      },
      success: {
        iconBg: 'bg-accent/10',
        iconColor: 'text-accent',
        cardClass: 'metric-card success'
      },
      accent: {
        iconBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
        iconColor: 'text-purple-600',
        cardClass: 'metric-card accent'
      }
    };
    return styles[variant as keyof typeof styles] || styles.default;
  };

  const variantStyles = getVariantStyles();

  return (
    <div className={variantStyles.cardClass}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
              {trend && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trend.isPositive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span>{trend.isPositive ? '+' : '-'}{trend.value}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${variantStyles.iconBg} shadow-sm`}>
          <Icon className={`h-6 w-6 ${variantStyles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;