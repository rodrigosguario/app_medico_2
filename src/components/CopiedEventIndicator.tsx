import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clipboard } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status: string;
}

interface CopiedEventIndicatorProps {
  copiedEvent: CalendarEvent | null;
  onPaste?: (date: Date) => void;
  targetDate?: Date;
  onClear?: () => void;
  className?: string;
}

export function CopiedEventIndicator({ 
  copiedEvent, 
  onPaste, 
  targetDate, 
  onClear,
  className 
}: CopiedEventIndicatorProps) {
  if (!copiedEvent) return null;

  if (onPaste && targetDate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 hover:bg-primary/10 ${className}`}
            onClick={(e) => {
              e.stopPropagation();
              onPaste(targetDate);
            }}
          >
            <Clipboard className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Colar: {copiedEvent.title}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-md ${className}`}>
      <Clipboard className="h-4 w-4" />
      <span className="font-medium">
        "{copiedEvent.title}" copiado
      </span>
      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0 ml-2"
        >
          ×
        </Button>
      )}
    </div>
  );
}