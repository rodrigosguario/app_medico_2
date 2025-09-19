import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCcw, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';

export function GoogleCalendarSync() {
  const { 
    isLoading, 
    isConnected, 
    lastSync, 
    connect, 
    disconnect, 
    sync, 
    checkConnection 
  } = useGoogleCalendarSync();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-100 text-blue-700';
    if (isConnected) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusText = () => {
    if (isLoading) return 'Processando...';
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <strong>Última sincronização:</strong> {formatLastSync(lastSync)}
        </div>

        {!isConnected && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Conecte sua conta do Google para sincronizar eventos automaticamente
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={connect} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              {isLoading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={sync} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                {isLoading ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={disconnect} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Unlink className="h-4 w-4" />
                Desconectar
              </Button>
            </>
          )}
        </div>

        {isConnected && (
          <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded-md">
            ✅ <strong>Conectado com sucesso!</strong><br />
            Seus eventos do Google Calendar podem ser sincronizados automaticamente.
            Use o botão "Sincronizar Agora" para buscar os eventos mais recentes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
