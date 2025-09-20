import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Copy, MoreVertical } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status: string;
  value?: number | null;
  location?: string;
  description?: string;
  calendar_id?: string;
  hospital_id?: string;
  tax_type?: string | null;
  tax_rate?: number | null;
}

interface EventActionsProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onCopy: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDelete: (eventId: string) => void;
  className?: string;
}

export function EventActions({ event, onEdit, onCopy, onDelete, className }: EventActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 hover:bg-white/20 text-white ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(event)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => onCopy(event, e)}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(event.id)}
          className="text-destructive"
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}