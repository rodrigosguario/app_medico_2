import React from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, Plus, Eye, 
         Stethoscope, BookOpen, CreditCard, Building } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import HeatMap from '../components/HeatMap';
import EventsList from '../components/EventsList';
import QuickSummary from '../components/QuickSummary';
import QuickActions from '../components/QuickActions';
import ConnectionStatus from '../components/ConnectionStatus';
import UserProfile from '../components/UserProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import { AIAssistant } from '@/components/AIAssistant';
import { AssistantButton } from '@/components/AssistantButton';
import { Button } from '@/components/ui/button';
import { useSupabaseDashboard } from '@/hooks/useSupabaseDashboard';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { dashboardData, loading, error, refreshDashboard } = useSupabaseDashboard();
  const { isMinimized, isVisible, showAssistant, hideAssistant, toggleMinimized } = useAIAssistant();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner text="Carregando dashboard..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">Erro ao carregar dados: {error}</p>
            <Button onClick={refreshDashboard}>Tentar Novamente</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="flex">
        <main className={cn(
          "flex-1 transition-all duration-300",
          !isMinimized && isVisible ? "mr-96" : ""
        )}>
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
            <div className="space-y-8">
              {/* Ultra Modern Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
                  <p className="text-lg text-muted-foreground">Visão geral completa da sua gestão médica</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="status-dot bg-accent"></div>
                    Online
                  </div>
                  <AssistantButton 
                    onClick={showAssistant}
                    variant="default" 
                    size="sm"
                    className="modern-button"
                  />
                </div>
              </div>
          {/* Métricas Modernas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricCard
              title="Horas Totais"
              value={`${dashboardData?.metrics?.total_hours || 0}h`}
              subtitle="Este mês"
              icon={Clock}
              trend={dashboardData?.metrics?.total_hours ? { value: 12, isPositive: true } : undefined}
              variant="primary"
            />
            <MetricCard
              title="Plantões"
              value={`${dashboardData?.metrics?.total_shifts || 0}`}
              subtitle="Plantões realizados"
              icon={Stethoscope}
              trend={dashboardData?.metrics?.total_shifts ? { value: 8, isPositive: true } : undefined}
              variant="secondary"
            />
            <MetricCard
              title="Receita Mensal"
              value={`R$ ${(dashboardData?.metrics?.monthly_revenue || 0).toLocaleString('pt-BR')}`}
              subtitle="Receita bruta"
              icon={DollarSign}
              trend={dashboardData?.metrics?.monthly_revenue ? { value: 15, isPositive: true } : undefined}
              variant="success"
            />
            <MetricCard
              title="Taxa de Conclusão"
              value={`${dashboardData?.metrics?.completion_rate || 0}%`}
              subtitle="Eventos realizados"
              icon={TrendingUp}
              trend={dashboardData?.metrics?.completion_rate ? { value: 3, isPositive: true } : undefined}
              variant="accent"
            />
          </div>

          {/* Conteúdo Principal Moderno */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Próximos eventos - Área principal */}
            <div className="xl:col-span-3 space-y-6">
              <EventsList events={dashboardData?.upcoming_events || []} />
              <HeatMap />
            </div>
            
            {/* Sidebar com informações */}
            <div className="xl:col-span-1 space-y-6">
              <QuickSummary summary={dashboardData?.quick_summary || {}} />
              <QuickActions />
            </div>
          </div>
            </div>
          </div>
        </main>

        {/* AI Assistant Sidebar */}
        {isVisible && (
          <aside className={cn(
            "fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-40 transition-transform duration-300",
            isMinimized ? "translate-x-full" : "translate-x-0"
          )}>
            <div className="h-full pt-16">
              <AIAssistant 
                className="h-full"
                minimized={isMinimized}
                onMinimizeToggle={toggleMinimized}
              />
            </div>
          </aside>
        )}

        {/* Minimized Assistant Button */}
        {isMinimized && (
          <AIAssistant 
            minimized={true}
            onMinimizeToggle={toggleMinimized}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;