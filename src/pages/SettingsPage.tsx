import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '../components/Navigation';
import { User, Bell, Shield, Calendar, Database, Download, Trash2, Save, Building2 } from 'lucide-react';
import HospitalManager from '../components/HospitalManager';

const SettingsPage: React.FC = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    crm: '',
    specialty: '',
    phone: '',
    tax_rate: 6.00,
    tax_type: 'simples_nacional'
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
    return {
      emailAlerts: true,
      pushNotifications: true,
      weeklyReports: false,
      eventReminders: true
    };
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        crm: profile.crm || '',
        specialty: profile.specialty || '',
        phone: profile.phone || '',
        tax_rate: profile.tax_rate || 6.00,
        tax_type: profile.tax_type || 'simples_nacional'
      });
    }
  }, [profile, user]);

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    localStorage.setItem('notifications_preferences', JSON.stringify(newNotifications));
    
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências de notificação foram salvas automaticamente.",
    });
  };

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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profileForm.name,
          email: profileForm.email,
          crm: profileForm.crm,
          specialty: profileForm.specialty,
          phone: profileForm.phone,
          tax_rate: profileForm.tax_rate,
          tax_type: profileForm.tax_type,
        });

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
      // For now, just store in localStorage until notifications table is created
      localStorage.setItem('notifications_preferences', JSON.stringify(notifications));
      
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie suas preferências e informações pessoais</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="hospitals" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hospitais
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Dados
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
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Digite seu e-mail"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crm">CRM</Label>
                      <Input
                        id="crm"
                        value={profileForm.crm}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, crm: e.target.value }))}
                        placeholder="Ex: 12345/SP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Input
                        id="specialty"
                        value={profileForm.specialty}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, specialty: e.target.value }))}
                        placeholder="Ex: Cardiologia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Configurações Fiscais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax_type">Tipo de Tributação</Label>
                        <Select 
                          value={profileForm.tax_type} 
                          onValueChange={(value) => {
                            // Automatically set tax rate based on taxation type
                            let defaultTaxRate = 6.00;
                            switch (value) {
                              case 'mei':
                                defaultTaxRate = 5.00;
                                break;
                              case 'simples_nacional':
                                defaultTaxRate = 6.00;
                                break;
                              case 'sociedade_simples_limitada':
                                defaultTaxRate = 11.00;
                                break;
                              default:
                                defaultTaxRate = 6.00;
                            }
                            setProfileForm(prev => ({ 
                              ...prev, 
                              tax_type: value,
                              tax_rate: defaultTaxRate
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                            <SelectItem value="sociedade_simples_limitada">Sociedade Simples Limitada</SelectItem>
                            <SelectItem value="mei">MEI</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                        <Input
                          id="tax_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={profileForm.tax_rate}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                          placeholder="6.00"
                        />
                        <p className="text-xs text-muted-foreground">
                          {profileForm.tax_type === 'sociedade_simples_limitada' 
                            ? 'Taxa personalizada para sua Sociedade Simples Limitada'
                            : 'Taxa de imposto sobre o faturamento bruto'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas por E-mail</Label>
                      <p className="text-sm text-muted-foreground">Receber notificações importantes por e-mail</p>
                    </div>
                    <Switch
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Relatórios Semanais</Label>
                      <p className="text-sm text-muted-foreground">Receber resumo semanal de atividades</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes de Eventos</Label>
                      <p className="text-sm text-muted-foreground">Receber lembretes de compromissos</p>
                    </div>
                    <Switch
                      checked={notifications.eventReminders}
                      onCheckedChange={(checked) => handleNotificationChange('eventReminders', checked)}
                    />
                  </div>
                  <Button onClick={handleNotificationsSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hospitals" className="space-y-6">
              <HospitalManager />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Calendário</CardTitle>
                  <CardDescription>Personalize a exibição e comportamento do calendário</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Exibir fins de semana</Label>
                      <p className="text-sm text-muted-foreground">Mostrar sábados e domingos no calendário</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Visualização padrão</Label>
                      <p className="text-sm text-muted-foreground">Visualização inicial ao abrir o calendário</p>
                    </div>
                    <Select defaultValue="month">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Dia</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Horário de trabalho início</Label>
                      <p className="text-sm text-muted-foreground">Primeiro horário visível no calendário</p>
                    </div>
                    <Select defaultValue="06:00">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Horário de trabalho fim</Label>
                      <p className="text-sm text-muted-foreground">Último horário visível no calendário</p>
                    </div>
                    <Select defaultValue="22:00">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Lembretes automáticos</Label>
                      <p className="text-sm text-muted-foreground">Criar lembretes para todos os eventos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Dados</CardTitle>
                  <CardDescription>Gerencie backup, exportação e privacidade dos dados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Backup automático</Label>
                      <p className="text-sm text-muted-foreground">Fazer backup dos dados semanalmente</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Exportação de dados</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar perfil
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar eventos
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Retenção de dados</Label>
                    <Select defaultValue="2years">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">1 ano</SelectItem>
                        <SelectItem value="2years">2 anos</SelectItem>
                        <SelectItem value="5years">5 anos</SelectItem>
                        <SelectItem value="forever">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Tempo para manter dados antigos</p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir todos os dados
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Esta ação não pode ser desfeita
                    </p>
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

export default SettingsPage;