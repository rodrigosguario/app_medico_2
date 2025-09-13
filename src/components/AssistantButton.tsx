import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const AssistantButton: React.FC<AssistantButtonProps> = ({
  onClick,
  className,
  variant = 'default',
  size = 'default'
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        variant === 'default' && "bg-medical hover:bg-medical-dark text-white",
        className
      )}
    >
      <Bot className="h-4 w-4 mr-2" />
      Assistente IA
    </Button>
  );
};