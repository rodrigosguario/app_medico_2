import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import HospitalManager from '@/components/HospitalManager';
import { CalendarSync } from '@/components/CalendarSync';
import { SystemStatus } from '@/components/SystemStatus';
import { DocumentationLink } from '@/components/DocumentationLink';
import { 
  User, 
  Bell, 
  Building2, 
  Calendar, 
  Database,
  Settings,
  Download,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get default tax rates
  const getDefaultTaxRate = (taxType: string): number => {
    switch (taxType) {
      case 'mei':
        return 6.00;
      case 'simples_nacional':
        return 11.00;
      case 'lucro_presumido':
        return 15.00;
      case 'lucro_real':
        return 25.00;
      default:
        return 6.00;
    }
  };

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    crm: '',
    specialty: '',
    phone: '',
    tax_rate: 6.00,
    tax_type: 'mei' as 'simples_nacional' | 'mei' | 'lucro_presumido' | 'lucro_real'
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    syncNotifications: true,
    weeklyReports: false,
    dailyReminders: true
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        crm: profile.crm || '',
        specialty: profile.specialty || '',
        phone: profile.phone || '',
        tax_rate: profile.tax_rate || getDefaultTaxRate(profile.tax_type || 'mei'),
        tax_type: (profile.tax_type as 'simples_nacional' | 'mei' | 'lucro_presumido' | 'lucro_real') || 'mei'
      });
    } else if (user && !profileLoading) {
      // Initialize with user metadata if no profile exists
      setProfileForm(prev => ({
        ...prev,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        crm: user.user_metadata?.crm || '',
        specialty: user.user_metadata?.specialty || '',
        tax_rate: 6.00,
        tax_type: 'mei'
      }));
    }
  }, [profile, user, profileLoading]);

  // Load notification preferences
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications_preferences');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  const handleProfileSave = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('💾 Salvando perfil...', profileForm);

      // Ensure tax_rate is a number
      const dataToSave = {
        user_id: user.id,
        name: profileForm.name,
        email: profileForm.email,
        crm: profileForm.crm,
        specialty: profileForm.specialty,
        phone: profileForm.phone,
        tax_rate: Number(profileForm.tax_rate),
        tax_type: profileForm.tax_type,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(dataToSave);

      if (error) {
        console.error('❌ Erro ao salvar perfil:', error);
        throw error;
      }

      console.log('✅ Perfil salvo com sucesso');
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('💥 Erro inesperado ao salvar:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          errorMessage = 'Sem permissão para salvar dados.';
        } else if (error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou em conflito.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    setIsLoading(true);
    try {
      // Store in localStorage
      localStorage.setItem('notifications_preferences', JSON.stringify(notifications));
      
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações de notificação foram atualizadas.',
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      if (!user) throw new Error('Usuário não autenticado');

      // Export user data (events, profile, hospitals, etc.)
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);

      const { data: financials } = await supabase
        .from('financial_events')
        .select('*')
        .eq('user_id', user.id);

      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile: profileForm,
        events,
        financials,
        hospitals,
        notifications,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medico-agenda-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Dados exportados',
        description: 'Backup dos seus dados baixado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e informações pessoais
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hospitais</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={profileForm.crm}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, crm: e.target.value }))}
                    placeholder="12345/SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Cardiologia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_type">Tipo de Tributação</Label>
                  <Select 
                    value={profileForm.tax_type} 
                    onValueChange={(value: any) => {
                      // Auto-set tax rate based on company type
                      const defaultRate = getDefaultTaxRate(value);
                      setProfileForm(prev => ({ 
                        ...prev, 
                        tax_type: value,
                        tax_rate: defaultRate 
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mei">MEI (6%)</SelectItem>
                      <SelectItem value="simples_nacional">Simples Nacional (11%)</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido (15%)</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real (25%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={profileForm.tax_rate}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="6.00"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Taxa de imposto sobre o faturamento bruto
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Alertas por E-mail</h4>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações importantes por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações Push</h4>
                    <p className="text-sm text-muted-foreground">
                      Notificações no navegador e dispositivos móveis
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações de Sincronização</h4>
                    <p className="text-sm text-muted-foreground">
                      Avisos sobre sincronização de calendários
                    </p>
                  </div>
                  <Switch
                    checked={notifications.syncNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('syncNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Relatórios Semanais</h4>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal de atividades e métricas
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Lembretes Diários</h4>
                    <p className="text-sm text-muted-foreground">
                      Lembretes sobre compromissos do dia
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyReminders}
                    onCheckedChange={(checked) => handleNotificationChange('dailyReminders', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNotificationsSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Preferências
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="hospitals">
          <HospitalManager />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarSync />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Exportar Dados</h4>
                    <p className="text-sm text-muted-foreground">
                      Baixar backup completo dos seus dados
                    </p>
                  </div>
                  <Button onClick={handleExportData} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-destructive">Excluir Conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Remover permanentemente todos os seus dados
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemStatus />
          <DocumentationLink />
        </TabsContent>
      </Tabs>
    </div>
  );
}