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
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumo Rápido
      </h3>

      <div className="space-y-4">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              
              <span className="text-sm font-semibold text-gray-900">
                {item.value}{item.suffix || ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Alertas ou notificações importantes */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Lembrete</p>
            <p className="text-amber-700 mt-1">
              Você tem 2 plantões confirmados para esta semana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSummary;