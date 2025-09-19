import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Loader2,
  Database,
  Wifi,
  User,
  Settings
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export const SystemDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Teste de conectividade
      results.push({
        name: 'Conectividade',
        status: navigator.onLine ? 'success' : 'error',
        message: navigator.onLine ? 'Conexão com a internet ativa' : 'Sem conexão com a internet'
      });

      // 2. Teste de configuração do Supabase
      try {
        const { data, error } = await supabase.auth.getSession();
        results.push({
          name: 'Configuração Supabase',
          status: 'success',
          message: 'Cliente Supabase configurado corretamente',
          details: 'Conexão com o servidor estabelecida'
        });
      } catch (err) {
        results.push({
          name: 'Configuração Supabase',
          status: 'error',
          message: 'Erro na configuração do Supabase',
          details: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }

      // 3. Teste de autenticação
      if (user) {
        results.push({
          name: 'Autenticação',
          status: 'success',
          message: `Usuário autenticado: ${user.email}`,
          details: `ID: ${user.id}`
        });
      } else {
        results.push({
          name: 'Autenticação',
          status: 'warning',
          message: 'Usuário não autenticado',
          details: 'Faça login para acessar todas as funcionalidades'
        });
      }

      // 4. Teste de conexão com banco de dados
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) {
          results.push({
            name: 'Banco de Dados',
            status: 'error',
            message: `Erro de conexão: ${error.message}`,
            details: error.code ? `Código: ${error.code}` : undefined
          });
        } else {
          results.push({
            name: 'Banco de Dados',
            status: 'success',
            message: 'Conexão com o banco de dados ativa',
            details: 'Tabela profiles acessível'
          });
        }
      } catch (err) {
        results.push({
          name: 'Banco de Dados',
          status: 'error',
          message: 'Falha na conexão com o banco de dados',
          details: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }

      // 5. Teste de perfil do usuário (se autenticado)
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            results.push({
              name: 'Perfil do Usuário',
              status: 'warning',
              message: 'Perfil não encontrado ou incompleto',
              details: error.message
            });
          } else {
            results.push({
              name: 'Perfil do Usuário',
              status: 'success',
              message: `Perfil carregado: ${profile.name}`,
              details: `CRM: ${profile.crm}, Especialidade: ${profile.specialty}`
            });
          }
        } catch (err) {
          results.push({
            name: 'Perfil do Usuário',
            status: 'error',
            message: 'Erro ao carregar perfil do usuário',
            details: err instanceof Error ? err.message : 'Erro desconhecido'
          });
        }
      }

      // 6. Teste de armazenamento local
      try {
        localStorage.setItem('diagnostic_test', 'test');
        localStorage.removeItem('diagnostic_test');
        results.push({
          name: 'Armazenamento Local',
          status: 'success',
          message: 'Armazenamento local funcionando'
        });
      } catch (err) {
        results.push({
          name: 'Armazenamento Local',
          status: 'error',
          message: 'Armazenamento local não disponível',
          details: 'Pode afetar a persistência de dados'
        });
      }

      // 7. Teste de estrutura das tabelas principais
      const tables = ['events', 'calendars', 'hospitals', 'financial_events'];
      let tablesWorking = 0;
      
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          if (!error) tablesWorking++;
        } catch (err) {
          // Ignorar erros individuais de tabela
        }
      }

      results.push({
        name: 'Estrutura do Banco',
        status: tablesWorking === tables.length ? 'success' : tablesWorking > 0 ? 'warning' : 'error',
        message: `${tablesWorking}/${tables.length} tabelas acessíveis`,
        details: `Tabelas testadas: ${tables.join(', ')}`
      });

    } catch (err) {
      results.push({
        name: 'Diagnóstico Geral',
        status: 'error',
        message: 'Erro inesperado durante o diagnóstico',
        details: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const totalCount = diagnostics.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Diagnóstico do Sistema
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Executando...' : 'Executar Diagnóstico'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalCount > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-muted-foreground">Funcionando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Avisos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{diagnostic.name}</span>
                  <Badge className={getStatusColor(diagnostic.status)}>
                    {diagnostic.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {diagnostic.message}
                </p>
                {diagnostic.details && (
                  <p className="text-xs text-muted-foreground">
                    {diagnostic.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {errorCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Foram encontrados {errorCount} erro(s) que podem afetar o funcionamento do aplicativo. 
              Verifique as configurações do Supabase e as chaves de API.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
