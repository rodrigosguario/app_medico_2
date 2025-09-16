import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Database, 
  Brain,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SystemCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  icon: React.ComponentType<any>;
}

export const SystemStatus: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runSystemChecks = async () => {
    setLoading(true);
    const newChecks: SystemCheck[] = [];

    // Authentication check
    if (isAuthenticated && user) {
      newChecks.push({
        name: 'Autenticação',
        status: 'ok',
        message: `Usuário autenticado: ${user.email}`,
        icon: User
      });
    } else {
      newChecks.push({
        name: 'Autenticação',
        status: 'error',
        message: 'Usuário não autenticado',
        icon: User
      });
    }

    // Profile check
    if (!profileLoading) {
      if (profile) {
        newChecks.push({
          name: 'Perfil',
          status: 'ok',
          message: `Perfil carregado: ${profile.name || 'Sem nome'}`,
          icon: Settings
        });
      } else {
        newChecks.push({
          name: 'Perfil',
          status: 'warning',
          message: 'Perfil não encontrado - será criado automaticamente',
          icon: Settings
        });
      }
    }

    // Database connectivity check
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      newChecks.push({
        name: 'Base de Dados',
        status: 'ok',
        message: 'Conexão com Supabase funcionando',
        icon: Database
      });
    } catch (error) {
      newChecks.push({
        name: 'Base de Dados',
        status: 'error',
        message: 'Erro de conexão com base de dados',
        icon: Database
      });
    }

    // AI Assistant check
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: 'test', userId: user?.id, includeData: false }
      });
      
      if (error) throw error;
      
      newChecks.push({
        name: 'Assistente de IA',
        status: 'ok',
        message: 'Edge function funcionando',
        icon: Brain
      });
    } catch (error) {
      newChecks.push({
        name: 'Assistente de IA',
        status: 'warning',
        message: 'Configure a API key do OpenAI',
        icon: Brain
      });
    }

    // Calendar sync settings check
    if (user) {
      try {
        const { data, error } = await supabase
          .from('calendar_sync_settings')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const activeConnections = data?.filter(d => d.is_enabled).length || 0;
        
        if (activeConnections > 0) {
          newChecks.push({
            name: 'Sincronização de Calendário',
            status: 'ok',
            message: `${activeConnections} calendário(s) conectado(s)`,
            icon: Calendar
          });
        } else {
          newChecks.push({
            name: 'Sincronização de Calendário',
            status: 'warning',
            message: 'Nenhum calendário conectado',
            icon: Calendar
          });
        }
      } catch (error) {
        newChecks.push({
          name: 'Sincronização de Calendário',
          status: 'error',
          message: 'Erro ao verificar configurações',
          icon: Calendar
        });
      }
    }

    setChecks(newChecks);
    setLoading(false);
  };

  useEffect(() => {
    if (!profileLoading) {
      runSystemChecks();
    }
  }, [user, profile, profileLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ok: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    const labels = {
      ok: 'OK',
      warning: 'Atenção',
      error: 'Erro'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const hasErrors = checks.some(check => check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runSystemChecks}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Alguns componentes críticos apresentam problemas. Verifique as configurações.
            </AlertDescription>
          </Alert>
        )}
        
        {hasWarnings && !hasErrors && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sistema funcionando com algumas limitações. Configure as integrações para funcionalidade completa.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {checks.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <check.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{check.name}</h4>
                    {getStatusIcon(check.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Verificando sistema...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};