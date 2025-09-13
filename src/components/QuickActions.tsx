import React from 'react';
import { Plus, Calendar, Download, Upload, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      label: 'Novo Evento',
      icon: Plus,
      color: 'bg-medical text-white hover:bg-medical-dark',
      onClick: () => navigate('/calendar?action=new')
    },
    {
      label: 'Ver Calendário',
      icon: Calendar,
      color: 'bg-white text-medical border border-medical hover:bg-medical-light',
      onClick: () => navigate('/calendar')
    },
    {
      label: 'Exportar ICS',
      icon: Download,
      color: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50',
      onClick: () => navigate('/import-export')
    },
    {
      label: 'Importar ICS',
      icon: Upload,
      color: 'bg-white text-green-600 border border-green-200 hover:bg-green-50',
      onClick: () => navigate('/import-export')
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      color: 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50',
      onClick: () => navigate('/financial')
    },
    {
      label: 'Configurações',
      icon: Settings,
      color: 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Ações Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-3 rounded-lg transition-colors text-left flex items-center gap-2 text-sm font-medium ${action.color}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Seção de templates rápidos */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Templates Rápidos
        </h4>
        
        <div className="space-y-2">
          <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            🏥 Plantão UTI - 12h
          </button>
          <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            👩‍⚕️ Consulta Ambulatório - 1h
          </button>
          <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            📚 Aula/Palestra - 2h
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;