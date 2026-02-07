
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Character } from '../types';

interface StatsRadarProps {
  character: Character;
}

const StatsRadar: React.FC<StatsRadarProps> = ({ character }) => {
  const data = [
    { subject: 'STR (Init)', value: character.str_init, fullMark: 100 },
    { subject: 'AGI (Init)', value: character.agi_init, fullMark: 100 },
    { subject: 'STA (Init)', value: character.sta_init, fullMark: 100 },
    { subject: 'STR (BMV)', value: character.bmv_str, fullMark: 100 },
    { subject: 'AGI (BMV)', value: character.bmv_agi, fullMark: 100 },
    { subject: 'STA (BMV)', value: character.bmv_sta, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Stat Distribution</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 50]} tick={false} axisLine={false} />
          <Radar
            name={character.name}
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsRadar;
