import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertTriangle, Info, XCircle, Download, Upload, RefreshCw, Calendar } from 'lucide-react';

interface FeedbackToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: string;
}

export const useImprovedFeedbackToast = () => {
  const { toast } = useToast();

  const showFeedback = ({ type, title, description, duration = 5000, action }: FeedbackToastProps) => {
    const config = {
      success: {
        icon: CheckCircle2,
        variant: 'default' as const,
        className: 'border-green-200 bg-green-50 text-green-900'
      },
      error: {
        icon: XCircle,
        variant: 'destructive' as const,
        className: 'border-red-200'
      },
      warning: {
        icon: AlertTriangle,
        variant: 'default' as const,
        className: 'border-yellow-200 bg-yellow-50 text-yellow-900'
      },
      info: {
        icon: Info,
        variant: 'default' as const,
        className: 'border-blue-200 bg-blue-50 text-blue-900'
      }
    };

    const { icon: Icon, variant, className } = config[type];

    toast({
      title,
      description,
      duration,
      variant,
      className,
      action: (
        <div className="flex items-center gap-1">
          <Icon className="h-4 w-4" />
        </div>
      ),
    });
  };

  return {
    success: (title: string, description?: string, action?: string) => 
      showFeedback({ type: 'success', title, description, action }),
    
    error: (title: string, description?: string, action?: string) => 
      showFeedback({ type: 'error', title, description, action }),
    
    warning: (title: string, description?: string, action?: string) => 
      showFeedback({ type: 'warning', title, description, action }),
    
    info: (title: string, description?: string, action?: string) => 
      showFeedback({ type: 'info', title, description, action }),

    // Specialized toasts for common actions
    exportSuccess: (count: number) => 
      showFeedback({ 
        type: 'success', 
        title: 'Calendário exportado!', 
        description: `${count} eventos exportados com sucesso.`,
        action: 'export'
      }),

    importSuccess: (count: number, errors: number = 0) => 
      showFeedback({ 
        type: errors > 0 ? 'warning' : 'success', 
        title: 'Importação concluída!', 
        description: `${count} eventos importados${errors > 0 ? `, ${errors} falharam` : ''}.`,
        action: 'import'
      }),

    syncInProgress: (provider: string) => 
      showFeedback({ 
        type: 'info', 
        title: 'Sincronizando...', 
        description: `Sincronizando eventos do ${provider}`,
        duration: 3000,
        action: 'sync'
      }),

    syncComplete: (provider: string, count: number) => 
      showFeedback({ 
        type: 'success', 
        title: 'Sincronização concluída!', 
        description: `${count} eventos sincronizados do ${provider}`,
        action: 'sync'
      }),

    eventCreated: (title: string) => 
      showFeedback({ 
        type: 'success', 
        title: 'Evento criado!', 
        description: `"${title}" foi adicionado ao seu calendário.`,
        action: 'create'
      }),

    eventUpdated: (title: string) => 
      showFeedback({ 
        type: 'success', 
        title: 'Evento atualizado!', 
        description: `"${title}" foi modificado com sucesso.`,
        action: 'update'
      }),

    eventDeleted: (title: string) => 
      showFeedback({ 
        type: 'info', 
        title: 'Evento removido', 
        description: `"${title}" foi excluído do calendário.`,
        action: 'delete'
      }),
  };
};