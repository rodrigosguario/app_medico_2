import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DayData {
  date: string;
  intensity: number;
  hours: number;
  eventCount: number;
}

interface WeekData {
  days: (DayData | null)[];
}

const HeatMap: React.FC = () => {
  const [heatMapData, setHeatMapData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDays: 0,
    intenseDays: 0,
    averageIntensity: 0
  });

  useEffect(() => {
    loadRealHeatMapData();
  }, []);

  const loadRealHeatMapData = async () => {
    try {
      setLoading(true);
      
      // Get user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      // Get events from the last 4 weeks
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 28); // 4 weeks

      const { data: events, error } = await supabase
        .from('events')
        .select('start_date, end_date, title')
        .eq('user_id', authData.user.id)
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Process events into daily data
      const dailyData: { [key: string]: DayData } = {};

      (events || []).forEach(event => {
        const eventDate = new Date(event.start_date);
        const endEventDate = new Date(event.end_date);
        const dateKey = eventDate.toISOString().split('T')[0];
        
        const hours = (endEventDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60);

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            intensity: 0,
            hours: 0,
            eventCount: 0
          };
        }

        dailyData[dateKey].hours += hours;
        dailyData[dateKey].eventCount += 1;
      });

      // Calculate intensity based on hours worked (normalize to 0-1 scale)
      // Consider 12+ hours as maximum intensity (1.0)
      Object.values(dailyData).forEach(day => {
        day.intensity = Math.min(day.hours / 12, 1);
      });

      // Create 4-week grid structure
      const weeks: WeekData[] = [];
      const today = new Date();
      
      for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
        const week: WeekData = { days: [] };
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const date = new Date(today);
          date.setDate(today.getDate() - (weekOffset * 7) - (6 - dayOfWeek));
          const dateKey = date.toISOString().split('T')[0];
          
          // Only show days that are not in the future
          if (date <= today) {
            week.days.push(dailyData[dateKey] || {
              date: dateKey,
              intensity: 0,
              hours: 0,
              eventCount: 0
            });
          } else {
            week.days.push(null);
          }
        }
        
        weeks.push(week);
      }

      setHeatMapData(weeks);

      // Calculate statistics
      const allDays = Object.values(dailyData);
      const activeDays = allDays.filter(day => day.intensity > 0).length;
      const intenseDays = allDays.filter(day => day.intensity > 0.7).length;
      const averageIntensity = allDays.length > 0 
        ? allDays.reduce((sum, day) => sum + day.intensity, 0) / allDays.length
        : 0;

      setStats({
        activeDays,
        intenseDays,
        averageIntensity
      });

    } catch (error) {
      console.error('Erro ao carregar dados do mapa de calor:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted border border-border/20';
    if (intensity < 0.25) return 'bg-primary/20 border border-primary/30';
    if (intensity < 0.5) return 'bg-primary/40 border border-primary/50';
    if (intensity < 0.75) return 'bg-primary/60 border border-primary/70';
    return 'bg-primary border border-primary/80';
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading || heatMapData.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Mapa de Carga de Trabalho
            </h3>
            <p className="text-sm text-muted-foreground">
              Intensidade de trabalho por dia da semana
            </p>
          </div>
          <div className="status-dot bg-primary animate-pulse"></div>
        </div>
        <div className="animate-pulse bg-muted/50 h-48 rounded-xl"></div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getWeekLabel = (week: WeekData, weekIndex: number) => {
    const firstDay = week.days.find(day => day !== null);
    if (!firstDay) return `Semana ${weekIndex + 1}`;
    
    const date = new Date(firstDay.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    return formatDate(weekStart.toISOString().split('T')[0]);
  };

  // Cálculo de estatísticas removido - agora usamos stats do state

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Mapa de Carga de Trabalho
          </h3>
          <p className="text-sm text-muted-foreground">
            Intensidade de trabalho por dia da semana
          </p>
        </div>
        <div className="status-dot bg-primary"></div>
      </div>

      {/* Grid moderno do heat map */}
      <div className="space-y-3">
        {/* Cabeçalho elegante */}
        <div className="flex items-center gap-4">
          <div className="w-16 text-xs font-medium text-muted-foreground">
            Semana
          </div>
          <div className="flex gap-2 flex-1">
            {dayLabels.map(day => (
              <div key={day} className="flex-1 text-center">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  {day}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid das semanas */}
        <div className="space-y-2">
          {heatMapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex items-center gap-4 group">
              <div className="w-16 text-xs font-medium text-muted-foreground">
                {getWeekLabel(week, weekIndex)}
              </div>
              <div className="flex gap-2 flex-1">
                {week.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex-1">
                    <div
                      className={`h-8 w-full rounded-lg cursor-pointer 
                                 hover:scale-110 hover:shadow-sm
                                 transition-all duration-200 
                                 ${day ? getIntensityColor(day.intensity) : 'bg-muted/30 border border-border/20'}`}
                      title={
                        day 
                          ? `${formatDate(day.date)} (${dayLabels[dayIndex]}): ${day.eventCount} eventos, ${day.hours.toFixed(1)}h, ${Math.round(day.intensity * 100)}% intensidade`
                          : 'Sem dados'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda moderna */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <span className="text-sm font-medium text-muted-foreground">Menos ativo</span>
        <div className="flex items-center gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={`h-4 w-4 rounded ${getIntensityColor(intensity)}`}
              />
            </div>
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground">Mais ativo</span>
      </div>

      {/* Estatísticas modernas */}
      <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/50">
        <div className="text-center group">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
            <span className="text-2xl font-bold text-primary">{stats.activeDays}</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">Dias com atividade</div>
        </div>
        
        <div className="text-center group">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-accent/20 transition-colors">
            <span className="text-2xl font-bold text-accent">{stats.intenseDays}</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">Dias intensos</div>
        </div>
        
        <div className="text-center group">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-secondary/20 transition-colors">
            <span className="text-2xl font-bold text-secondary">
              {Math.round(stats.averageIntensity * 100)}%
            </span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">Intensidade média</div>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;