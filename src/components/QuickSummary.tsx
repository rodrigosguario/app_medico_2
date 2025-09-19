import React from 'react';
import { Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface QuickSummaryProps {
  summary: {
    events_today?: number;
    events_this_week?: number;
    next_shift_time?: string;
    net_revenue?: number;
  };
}

const QuickSummary: React.FC<QuickSummaryProps> = ({ summary }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const summaryItems = [
    {
      label: 'Eventos hoje',
      value: summary.events_today || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Esta semana',
      value: summary.events_this_week || 0,
      suffix: ' eventos',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Próximo plantão',
      value: summary.next_shift_time || '--:--',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Receita líquida',
      value: summary.net_revenue ? formatCurrency(summary.net_revenue) : 'R$ 0,00',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">
          Resumo Rápido
        </h3>
        <div className="status-dot bg-accent"></div>
      </div>

      <div className="space-y-3">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <div 
              key={index} 
              className="group flex items-center justify-between p-4 rounded-xl 
                         border border-border/30 hover:border-primary/20 
                         hover:bg-muted/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${item.bgColor} group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              </div>
              
              <span className="text-lg font-bold text-foreground">
                {item.value}{item.suffix || ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Notificação importante moderna */}
      {summary.events_this_week > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 
                        border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Lembrete</h4>
              <p className="text-sm text-amber-700">
                Você tem <strong>{summary.events_this_week} eventos confirmados</strong> para esta semana
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSummary;