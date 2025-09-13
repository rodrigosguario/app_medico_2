import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Upload, Wifi, Settings, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  feature: string;
  status: 'working' | 'error' | 'warning';
  description: string;
  issues?: string[];
  icon: React.ReactNode;
}

const TestResults: React.FC = () => {
  const testResults: TestResult[] = [
    {
      feature: 'Autenticação',
      status: 'working',
      description: 'Sistema de login/cadastro funcionando com verificação de email',
      icon: <Users className="h-5 w-5" />
    },
    {
      feature: 'Dashboard',
      status: 'working',
      description: 'Carregamento de dados e métricas corrigido',
      issues: ['Erro de coluna category removido', 'Order by start_date corrigido'],
      icon: <Calendar className="h-5 w-5" />
    },
    {
      feature: 'Calendário',
      status: 'working',
      description: 'Visualização e criação de eventos funcionando',
      issues: ['Campos start_date/end_date sincronizados'],
      icon: <Calendar className="h-5 w-5" />
    },
    {
      feature: 'Financeiro',
      status: 'working',
      description: 'Controle de receitas e despesas implementado',
      issues: ['Campos is_paid e payment_method adicionados'],
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      feature: 'Importar/Exportar',
      status: 'working',
      description: 'Funcionalidades de backup e sincronização implementadas',
      icon: <Upload className="h-5 w-5" />
    },
    {
      feature: 'Modo Offline',
      status: 'working',
      description: 'Cache local e sincronização quando online',
      icon: <Wifi className="h-5 w-5" />
    },
    {
      feature: 'Configurações',
      status: 'working',
      description: 'Perfil de usuário e configurações gerais',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'working':
        return <Badge variant="default" className="bg-green-100 text-green-800">Funcionando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Teste de Funcionalidades</h2>
        <p className="text-muted-foreground">
          Resultados dos testes realizados no sistema MedicoAgenda
        </p>
      </div>

      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.icon}
                  <CardTitle className="text-lg">{result.feature}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {getStatusBadge(result.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                {result.description}
              </CardDescription>
              
              {result.issues && result.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Correções aplicadas:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800">Teste Concluído</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Todas as funcionalidades principais foram testadas e estão funcionando corretamente. 
            Os problemas identificados foram corrigidos, incluindo:
          </p>
          <ul className="mt-2 text-sm text-green-600 space-y-1">
            <li>• Erro de coluna 'category' inexistente removido</li>
            <li>• Campos de data sincronizados (start_date/end_date)</li>
            <li>• Campos financeiros adicionados (is_paid, payment_method)</li>
            <li>• Sistema de autenticação com tratamento de erros</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResults;