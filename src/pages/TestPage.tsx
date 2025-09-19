import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '../components/Navigation';
import { SystemDiagnostic } from '@/components/SystemDiagnostic';
import { CalendarTester } from '@/components/CalendarTester';
import { useAuth } from '@/components/AuthGuard';
import { 
  TestTube, 
  Settings, 
  Calendar,
  Database,
  User,
  Shield
} from 'lucide-react';

const TestPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Página de Testes</h1>
            <p className="text-muted-foreground">
              Ferramentas para testar e diagnosticar funcionalidades do aplicativo
            </p>
            
            {/* Status do usuário */}
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Autenticado" : "Não autenticado"}
              </Badge>
              {user && (
                <Badge variant="outline">
                  {user.email}
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs de testes */}
          <Tabs defaultValue="diagnostic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diagnostic" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Diagnóstico
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Banco de Dados
              </TabsTrigger>
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Autenticação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostic" className="space-y-4">
              <SystemDiagnostic />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <CalendarTester />
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Testes de Banco de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Aqui você pode testar a conectividade e estrutura do banco de dados Supabase.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Estrutura das Tabelas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>✅ profiles - Perfis de médicos</li>
                            <li>✅ events - Eventos do calendário</li>
                            <li>✅ calendars - Calendários dos usuários</li>
                            <li>✅ hospitals - Hospitais cadastrados</li>
                            <li>✅ financial_events - Eventos financeiros</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Políticas RLS</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>🔒 Usuários só veem seus próprios dados</li>
                            <li>🔒 Hospitais são públicos para leitura</li>
                            <li>🔒 Triggers automáticos configurados</li>
                            <li>🔒 Timestamps atualizados automaticamente</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status da Autenticação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Autenticado</Badge>
                          <span className="text-sm text-muted-foreground">
                            Usuário logado com sucesso
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Informações do Usuário</h4>
                            <ul className="space-y-1 text-sm">
                              <li><strong>ID:</strong> {user?.id}</li>
                              <li><strong>Email:</strong> {user?.email}</li>
                              <li><strong>Criado em:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Metadados</h4>
                            <ul className="space-y-1 text-sm">
                              <li><strong>Nome:</strong> {user?.user_metadata?.name || 'N/A'}</li>
                              <li><strong>CRM:</strong> {user?.user_metadata?.crm || 'N/A'}</li>
                              <li><strong>Especialidade:</strong> {user?.user_metadata?.specialty || 'N/A'}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Não Autenticado</Badge>
                          <span className="text-sm text-muted-foreground">
                            Faça login para acessar todas as funcionalidades
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Para testar as funcionalidades completas, é necessário estar logado.
                          Vá para a página inicial e faça login ou crie uma conta.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TestPage;
