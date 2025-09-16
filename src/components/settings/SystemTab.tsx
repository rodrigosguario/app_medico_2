import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const SystemTab: React.FC = () => {
  const { user } = useAuth();
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runSystemChecks = async () => {
    setIsChecking(true);
    const checks: SystemCheck[] = [];

    try {
      // Check internet connectivity
      const isOnline = navigator.onLine;
      checks.push({
        name: 'Conectividade',
        status: isOnline ? 'success' : 'error',
        message: isOnline ? 'Conexão com a internet ativa' : 'Sem conexão com a internet'
      });

      // Check Supabase connection
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        checks.push({
          name: 'Banco de Dados',
          status: error ? 'error' : 'success',
          message: error ? `Erro de conexão: ${error.message}` : 'Conexão com o banco de dados ativa'
        });
      } catch (error) {
        checks.push({
          name: 'Banco de Dados',
          status: 'error',
          message: 'Falha na conexão com o banco de dados'
        });
      }

      // Check authentication
      checks.push({
        name: 'Autenticação',
        status: user ? 'success' : 'error',
        message: user ? `Usuário autenticado: ${user.email}` : 'Usuário não autenticado'
      });

      // Check profile data
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          checks.push({
            name: 'Perfil do Usuário',
            status: error ? 'warning' : 'success',
            message: error ? 'Perfil não encontrado ou incompleto' : 'Perfil carregado com sucesso'
          });
        } catch (error) {
          checks.push({
            name: 'Perfil do Usuário',
            status: 'error',
            message: 'Erro ao carregar perfil do usuário'
          });
        }
      }

      // Check local storage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        checks.push({
          name: 'Armazenamento Local',
          status: 'success',
          message: 'Armazenamento local funcionando'
        });
      } catch (error) {
        checks.push({
          name: 'Armazenamento Local',
          status: 'error',
          message: 'Armazenamento local não disponível'
        });
      }

      // Check session validity
      if (user) {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          checks.push({
            name: 'Sessão Ativa',
            status: (sessionError || !session) ? 'error' : 'success',
            message: (sessionError || !session) ? 'Sessão expirada ou inválida' : 'Sessão válida e ativa'
          });
        } catch (error) {
          checks.push({
            name: 'Sessão Ativa',
            status: 'error',
            message: 'Erro ao verificar sessão'
          });
        }
      }

    } catch (error) {
      console.error('Error running system checks:', error);
      checks.push({
        name: 'Sistema Geral',
        status: 'error',
        message: 'Erro ao executar verificações do sistema'
      });
    }

    setSystemChecks(checks);
    setIsChecking(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">OK</Badge>;
      case 'warning':
        return <Badge variant="secondary">Atenção</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status do Sistema</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runSystemChecks}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h4 className="font-medium">{check.name}</h4>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Versão do App:</span>
              <span className="ml-2 text-muted-foreground">1.0.0</span>
            </div>
            <div>
              <span className="font-medium">Navegador:</span>
              <span className="ml-2 text-muted-foreground">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            <div>
              <span className="font-medium">Última Atualização:</span>
              <span className="ml-2 text-muted-foreground">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <span className="font-medium">Modo:</span>
              <span className="ml-2 text-muted-foreground">Produção</span>
            </div>
            <div>
              <span className="font-medium">Usuário:</span>
              <span className="ml-2 text-muted-foreground">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">ID do Projeto:</span>
              <span className="ml-2 text-muted-foreground">kmwsoppkrjzjioeadtqb</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links Úteis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="https://docs.lovable.dev" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação do Lovable
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação do Supabase
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Componentes UI (shadcn/ui)
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`https://supabase.com/dashboard/project/kmwsoppkrjzjioeadtqb`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard Supabase
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};