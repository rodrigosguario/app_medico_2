import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/utils/offlineStorage';
import { useSupabaseSync } from './useSupabaseSync';

interface DashboardMetrics {
  total_hours: number;
  total_shifts: number;
  monthly_revenue: number;
  completion_rate: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status: string;
  value: number | null;
  location?: string;
  hospital_name?: string;
  calendar_color?: string;
}

interface QuickSummary {
  events_today: number;
  events_this_week: number;
  next_shift_time: string | null;
  net_revenue: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  upcoming_events: UpcomingEvent[];
  quick_summary: QuickSummary;
}

export const useSupabaseDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncStatus } = useSupabaseSync();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (syncStatus.isOnline) {
        // Load dashboard data from Supabase
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          throw new Error('Usuário não autenticado');
        }

        const userId = user.data.user.id;

        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Load events for current month
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            calendars(name, color, category),
            hospitals(name)
          `)
          .eq('user_id', userId)
          .gte('start_date', monthStart.toISOString())
          .lte('start_date', monthEnd.toISOString())
          .order('start_date', { ascending: true });

        if (eventsError) throw eventsError;

        // Load financial events for current month
        const { data: financialEvents, error: finError } = await supabase
          .from('financial_events')
          .select('*')
          .eq('user_id', userId)
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0]);

        if (finError) throw finError;

        // Calculate metrics
        const metrics = calculateMetrics(events || [], financialEvents || []);
        const upcomingEvents = getUpcomingEvents(events || []);
        const quickSummary = calculateQuickSummary(events || [], financialEvents || []);

        const data: DashboardData = {
          metrics,
          upcoming_events: upcomingEvents,
          quick_summary: quickSummary
        };

        setDashboardData(data);
        
        // Cache for offline use
        offlineStorage.saveData('dashboard', data);
        offlineStorage.markAsSynced('dashboard');
      } else {
        // Load from offline storage
        const cachedData = offlineStorage.getData<DashboardData>('dashboard');
        if (cachedData) {
          setDashboardData(cachedData);
        } else {
          // Fallback to mock data if no cache
          setDashboardData(getMockDashboardData());
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      
      // Fallback to cached data or mock data
      const cachedData = offlineStorage.getData<DashboardData>('dashboard');
      if (cachedData) {
        setDashboardData(cachedData);
      } else {
        setDashboardData(getMockDashboardData());
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (events: any[], financialEvents: any[]): DashboardMetrics => {
    // Calculate total hours from events
    const totalHours = events.reduce((total, event) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    // Count plantões (shifts)
    const totalShifts = events.filter(event => event.event_type === 'PLANTAO').length;

    // Calculate monthly revenue from financial events
    const monthlyRevenue = financialEvents
      .filter(fe => fe.type === 'income')
      .reduce((total, fe) => total + parseFloat(fe.amount), 0);

    // Calculate completion rate
    const completedEvents = events.filter(event => event.status === 'REALIZADO').length;
    const completionRate = events.length > 0 ? (completedEvents / events.length) * 100 : 0;

    return {
      total_hours: Math.round(totalHours * 10) / 10,
      total_shifts: totalShifts,
      monthly_revenue: monthlyRevenue,
      completion_rate: Math.round(completionRate)
    };
  };

  const getUpcomingEvents = (events: any[]): UpcomingEvent[] => {
    const now = new Date();
    
    return events
      .filter(event => new Date(event.start_date) > now)
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        event_type: event.event_type,
        status: event.status,
        value: event.value,
        location: event.location,
        hospital_name: event.hospitals?.name,
        calendar_color: event.calendars?.color
      }));
  };

  const calculateQuickSummary = (events: any[], financialEvents: any[]): QuickSummary => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Start of current week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Events today
    const eventsToday = events.filter(event => {
      const eventStart = new Date(event.start_date);
      return eventStart >= startOfToday && eventStart < endOfToday;
    }).length;

    // Events this week
    const eventsThisWeek = events.filter(event => {
      const eventStart = new Date(event.start_date);
      return eventStart >= startOfWeek && eventStart < endOfWeek;
    }).length;

    // Next shift time (next PLANTAO)
    const nextShift = events
      .filter(event => event.event_type === 'PLANTAO' && new Date(event.start_date) > today)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    const nextShiftTime = nextShift 
      ? new Date(nextShift.start_date).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : null;

    // Net revenue (revenue - expenses)
    const revenue = financialEvents
      .filter(fe => fe.type === 'income')
      .reduce((total, fe) => total + parseFloat(fe.amount), 0);
    
    const expenses = financialEvents
      .filter(fe => fe.type === 'expense')
      .reduce((total, fe) => total + parseFloat(fe.amount), 0);

    return {
      events_today: eventsToday,
      events_this_week: eventsThisWeek,
      next_shift_time: nextShiftTime,
      net_revenue: revenue - expenses
    };
  };

  const getMockDashboardData = (): DashboardData => ({
    metrics: {
      total_hours: 0,
      total_shifts: 0,
      monthly_revenue: 0,
      completion_rate: 0
    },
    upcoming_events: [],
    quick_summary: {
      events_today: 0,
      events_this_week: 0,
      next_shift_time: null,
      net_revenue: 0
    }
  });

  // Load data when component mounts or online status changes
  useEffect(() => {
    loadDashboardData();
  }, [syncStatus.isOnline]);

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard: loadDashboardData
  };
};