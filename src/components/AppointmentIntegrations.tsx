import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AppointmentIntegrations: React.FC = () => {
  const [doctoraliaToken, setDoctoraliaToken] = useState('');
  const [iclinicToken, setIclinicToken] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const syncDoctoralia = async () => {
    if (!doctoraliaToken.trim()) {
      toast({
        title: "Token necessário",
        description: "Por favor, insira o token do Doctoralia",
        variant: "destructive"
      });
      return;
    }

    setLoading('doctoralia');
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      console.log('Iniciando sincronização Doctoralia...');
      
      const { data, error } = await supabase.functions.invoke('doctoralia-sync', {
        body: {
          action: 'sync_appointments',
          doctoralia_token: doctoraliaToken
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Resultado da sincronização:', data);
      
      toast({
        title: "Sincronização concluída",
        description: data.message || "Consultas do Doctoralia sincronizadas com sucesso!"
      });
    } catch (error: any) {
      console.error('Doctoralia sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar com o Doctoralia",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const syncIClinic = async () => {
    if (!iclinicToken.trim()) {
      toast({
        title: "Token necessário",
        description: "Por favor, insira o token do iClinic",
        variant: "destructive"
      });
      return;
    }

    setLoading('iclinic');
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      console.log('Iniciando sincronização iClinic...');
      
      const { data, error } = await supabase.functions.invoke('iclinic-sync', {
        body: {
          action: 'sync_appointments',
          iclinic_token: iclinicToken
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Resultado da sincronização:', data);
      
      toast({
        title: "Sincronização concluída",
        description: data.message || "Consultas do iClinic sincronizadas com sucesso!"
      });
    } catch (error: any) {
      console.error('iClinic sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar com o iClinic",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Integração de Consultas</h2>
        <p className="text-muted-foreground">
          Sincronize automaticamente seus agendamentos de consultas do Doctoralia e iClinic
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/10">
            <Calendar className="w-3 h-3 mr-1" />
            Apenas Agendamentos
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10">
            <Users className="w-3 h-3 mr-1" />
            Sem Dados de Prontuário
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="doctoralia" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="doctoralia">Doctoralia</TabsTrigger>
          <TabsTrigger value="iclinic">iClinic</TabsTrigger>
        </TabsList>

        <TabsContent value="doctoralia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                Doctoralia
              </CardTitle>
              <CardDescription>
                Sincronize consultas agendadas no Doctoralia com sua agenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctoralia-token">Token de API do Doctoralia</Label>
                <Input
                  id="doctoralia-token"
                  type="password"
                   placeholder="Cole seu token de API da Doctoralia aqui"
                  value={doctoraliaToken}
                  onChange={(e) => setDoctoraliaToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre seu token nas configurações de API da sua conta Doctoralia.
                  <br />
                  <strong>Para testar:</strong> Use qualquer texto como "demo123"
                </p>
              </div>

              <Separator />

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  O que será sincronizado:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Horários de consultas agendadas</li>
                  <li>• Nome dos pacientes</li>
                  <li>• Especialidades</li>
                  <li>• Status dos agendamentos</li>
                </ul>
              </div>

              <Button 
                onClick={syncDoctoralia}
                disabled={loading === 'doctoralia' || !doctoraliaToken.trim()}
                className="w-full"
              >
                {loading === 'doctoralia' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Sincronizar Consultas do Doctoralia
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iclinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                iClinic
              </CardTitle>
              <CardDescription>
                Sincronize consultas agendadas no iClinic com sua agenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iclinic-token">Token de API do iClinic</Label>
                <Input
                  id="iclinic-token"
                  type="password"
                  placeholder="Cole seu token de API do iClinic aqui"
                  value={iclinicToken}
                  onChange={(e) => setIclinicToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre seu token nas configurações de integração da sua conta iClinic.
                  <br />
                  <strong>Para testar:</strong> Use qualquer texto como "demo123"
                </p>
              </div>

              <Separator />

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  O que será sincronizado:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Horários de consultas agendadas</li>
                  <li>• Nome dos pacientes</li>
                  <li>• Profissionais responsáveis</li>
                  <li>• Status dos agendamentos</li>
                </ul>
              </div>

              <Button 
                onClick={syncIClinic}
                disabled={loading === 'iclinic' || !iclinicToken.trim()}
                className="w-full"
              >
                {loading === 'iclinic' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Sincronizar Consultas do iClinic
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentIntegrations;