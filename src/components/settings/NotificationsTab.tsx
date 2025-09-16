import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    syncNotifications: true,
    weeklyReports: false,
    dailyReminders: true
  });

  // Load notification preferences from profile
  useEffect(() => {
    if (profile && !profileLoading) {
      setNotifications({
        emailAlerts: (profile as any).email_alerts ?? true,
        pushNotifications: (profile as any).push_notifications ?? true,
        syncNotifications: (profile as any).sync_notifications ?? true,
        weeklyReports: (profile as any).weekly_reports ?? false,
        dailyReminders: (profile as any).daily_reminders ?? true
      });
    }
  }, [profile, profileLoading]);

  const handleNotificationsSave = async () => {
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

      console.log('💾 Salvando preferências de notificação...', notifications);

      // Save to Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email_alerts: notifications.emailAlerts,
          push_notifications: notifications.pushNotifications,
          sync_notifications: notifications.syncNotifications,
          weekly_reports: notifications.weeklyReports,
          daily_reminders: notifications.dailyReminders
        });

      if (error) {
        console.error('❌ Erro ao salvar preferências:', error);
        throw error;
      }

      console.log('✅ Preferências salvas com sucesso');
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações de notificação foram atualizadas.',
      });
    } catch (error) {
      console.error('💥 Erro inesperado ao salvar:', error);
      
      let errorMessage = 'Não foi possível salvar as preferências.';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          errorMessage = 'Sem permissão para salvar dados.';
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

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando preferências...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
};