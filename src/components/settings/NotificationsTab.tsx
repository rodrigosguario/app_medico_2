import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
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