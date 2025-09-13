import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface FeedbackToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export const useFeedbackToast = () => {
  const { toast } = useToast();

  const showFeedback = ({ type, title, description, duration = 5000 }: FeedbackToastProps) => {
    const icons = {
      success: CheckCircle,
      error: AlertTriangle, 
      warning: AlertTriangle,
      info: Info
    };

    const Icon = icons[type];

    toast({
      title,
      description,
      duration,
      variant: type === 'error' ? 'destructive' : 'default',
      action: type === 'success' ? (
        <div className="flex items-center gap-1 text-success">
          <Icon className="h-4 w-4" />
        </div>
      ) : undefined,
    });
  };

  return {
    success: (title: string, description?: string) => 
      showFeedback({ type: 'success', title, description }),
    error: (title: string, description?: string) => 
      showFeedback({ type: 'error', title, description }),
    warning: (title: string, description?: string) => 
      showFeedback({ type: 'warning', title, description }),
    info: (title: string, description?: string) => 
      showFeedback({ type: 'info', title, description }),
  };
};