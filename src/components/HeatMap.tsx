import React, { useState, useEffect } from 'react';

const HeatMap: React.FC = () => {
  const [heatMapData, setHeatMapData] = useState<number[][]>([]);

  useEffect(() => {
    generateHeatMapData();
  }, []);

  const generateHeatMapData = () => {
    // Gera dados de exemplo para 4 semanas
    const weeks = 4;
    const daysPerWeek = 7;
    const data: number[][] = [];

    for (let week = 0; week < weeks; week++) {
      const weekData: number[] = [];
      for (let day = 0; day < daysPerWeek; day++) {
        // Simula intensidade baseada em padrões reais
        let intensity = 0;
        
        // Médicos trabalham mais durante a semana
        if (day >= 1 && day <= 5) {
          intensity = Math.random() * 0.7 + 0.1;
        } else {
          intensity = Math.random() * 0.3;
        }
        
        // Algumas semanas são mais intensas
        if (week === 2) {
          intensity *= 1.5;
        }
        
        weekData.push(Math.min(intensity, 1));
      }
      data.push(weekData);
    }

    setHeatMapData(data);
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.25) return 'bg-medical-light/20';
    if (intensity < 0.5) return 'bg-medical-light/40';
    if (intensity < 0.75) return 'bg-medical-light/60';
    return 'bg-medical-light/80';
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (heatMapData.length === 0) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  // Cálculo de estatísticas
  const totalDays = heatMapData.flat();
  const activeDays = totalDays.filter(intensity => intensity > 0).length;
  const intenseDays = totalDays.filter(intensity => intensity > 0.7).length;
  const averageIntensity = totalDays.reduce((sum, intensity) => sum + intensity, 0) / totalDays.length;

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
            <div className="text-xs text-gray-500 pr-2">
              Semana {weekIndex + 1}
            </div>
            {week.map((intensity, dayIndex) => (
              <div
                key={dayIndex}
                className={`h-4 w-full rounded-sm ${getIntensityColor(intensity)} cursor-pointer hover:opacity-80 transition-opacity`}
                title={`Semana ${weekIndex + 1}, ${dayLabels[dayIndex]}: ${Math.round(intensity * 100)}% intensidade`}
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
          <div className="text-2xl font-bold text-medical">{activeDays}</div>
          <div className="text-xs text-gray-500">Dias com atividade</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{intenseDays}</div>
          <div className="text-xs text-gray-500">Dias intensos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {Math.round(averageIntensity * 100)}%
          </div>
          <div className="text-xs text-gray-500">Intensidade média</div>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;