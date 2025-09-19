import React from 'react';
import { Plus, Calendar, Download, Upload, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      label: 'Novo Evento',
      icon: Plus,
      color: 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-primary',
      onClick: () => navigate('/calendar?action=new')
    },
    {
      label: 'Ver Calendário', 
      icon: Calendar,
      color: 'bg-gradient-to-r from-secondary/10 to-secondary/5 text-secondary border border-secondary/20 hover:bg-secondary/10',
      onClick: () => navigate('/calendar')
    },
    {
      label: 'Exportar ICS',
      icon: Download,
      color: 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border border-blue-200 hover:bg-blue-100',
      onClick: () => navigate('/import-export')
    },
    {
      label: 'Importar ICS',
      icon: Upload,
      color: 'bg-gradient-to-r from-accent/10 to-accent/5 text-accent border border-accent/20 hover:bg-accent/15',
      onClick: () => navigate('/import-export')
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      color: 'bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 border border-purple-200 hover:bg-purple-100',
      onClick: () => navigate('/financial')
    },
    {
      label: 'Configurações',
      icon: Settings,
      color: 'bg-gradient-to-r from-muted to-muted/50 text-muted-foreground border border-border hover:bg-muted',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">
          Ações Rápidas
        </h3>
        <div className="status-dot bg-primary"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`group p-3 rounded-xl transition-all duration-200 text-left 
                         flex flex-col items-center justify-center gap-2 font-medium hover:scale-[1.02] active:scale-[0.98] 
                         min-h-[100px] ${action.color}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates modernos */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Templates Rápidos
        </h4>
        
        <div className="space-y-2">
          {[
            { emoji: '🏥', text: 'Plantão UTI - 12h', time: '12 horas' },
            { emoji: '👩‍⚕️', text: 'Consulta Ambulatório', time: '1 hora' },
            { emoji: '📚', text: 'Aula/Palestra', time: '2 horas' }
          ].map((template, index) => (
            <button 
              key={index}
              onClick={() => navigate('/calendar?action=new&template=' + encodeURIComponent(template.text))}
              className="w-full text-left p-3 rounded-xl hover:bg-muted/50 
                         border border-border/30 hover:border-primary/20 
                         transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {template.emoji}
                  </span>
                  <span className="font-medium text-foreground">{template.text}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded-full">
                  {template.time}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;