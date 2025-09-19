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
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.25) return 'bg-medical-light/20';
    if (intensity < 0.5) return 'bg-medical-light/40';
    if (intensity < 0.75) return 'bg-medical-light/60';
    return 'bg-medical-light/80';
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading || heatMapData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Mapa de Carga de Trabalho
        </h3>
        <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
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
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Mapa de Carga de Trabalho
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Intensidade de trabalho por dia da semana
      </p>

      {/* Grid do heat map */}
      <div className="space-y-1">
        {/* Cabeçalho com dias da semana */}
        <div className="grid grid-cols-8 gap-1 text-xs text-gray-500 mb-2">
          <div></div>
          {dayLabels.map(day => (
            <div key={day} className="text-center">{day}</div>
          ))}
        </div>

        {/* Linhas do heat map */}
        {heatMapData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-8 gap-1">
            <div className="text-xs text-gray-500 pr-2 flex items-center">
              {getWeekLabel(week, weekIndex)}
            </div>
            {week.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`h-4 w-full rounded-sm cursor-pointer hover:opacity-80 transition-opacity ${
                  day ? getIntensityColor(day.intensity) : 'bg-gray-50'
                }`}
                title={
                  day 
                    ? `${formatDate(day.date)} (${dayLabels[dayIndex]}): ${day.eventCount} eventos, ${day.hours.toFixed(1)}h, ${Math.round(day.intensity * 100)}% intensidade`
                    : 'Sem dados'
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Menos</span>
        <div className="flex space-x-1">
          {[0, 0.2, 0.4, 0.6, 0.8].map(intensity => (
            <div
              key={intensity}
              className={`h-3 w-3 rounded-sm ${getIntensityColor(intensity)}`}
            />
          ))}
        </div>
        <span>Mais</span>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.activeDays}</div>
          <div className="text-xs text-gray-500">Dias com atividade</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.intenseDays}</div>
          <div className="text-xs text-gray-500">Dias intensos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {Math.round(stats.averageIntensity * 100)}%
          </div>
          <div className="text-xs text-gray-500">Intensidade média</div>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;