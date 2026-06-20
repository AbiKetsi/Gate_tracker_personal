import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Heart, Activity, AlertCircle, Calendar, Sparkles } from 'lucide-react';

const MOODS = [
  { id: 'energized', label: 'Energized', weight: 5, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'okay', label: 'Okay', weight: 4, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  { id: 'tired', label: 'Tired', weight: 3, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'stressed', label: 'Stressed', weight: 2, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'burnt out', label: 'Burnt Out', weight: 1, color: 'text-red-600 bg-red-50 border-red-200' }
];

export default function Mood({ moods, onLogMood }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMood, setSelectedMood] = useState('okay');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [note, setNote] = useState('');

  // If user changes the date, check if they already have an entry for that date and populate it
  useEffect(() => {
    const existing = moods.find(m => m.date === date);
    if (existing) {
      setSelectedMood(existing.mood);
      setEnergyLevel(existing.energy_level);
      setNote(existing.note || '');
    } else {
      setSelectedMood('okay');
      setEnergyLevel(3);
      setNote('');
    }
  }, [date, moods]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogMood({
      date,
      mood: selectedMood,
      energy_level: energyLevel,
      note
    });
    setNote('');
  };

  // Check for burnout: 3+ consecutive logged entries of stressed or burnt out
  const isBurntOut = useMemo(() => {
    if (moods.length < 3) return false;
    // Sort chronologically
    const sorted = [...moods].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Get last 3 logs
    const lastThree = sorted.slice(-3);
    return lastThree.every(m => m.mood === 'stressed' || m.mood === 'burnt out');
  }, [moods]);

  // Map mood IDs to labels
  const moodLabelMap = useMemo(() => {
    return MOODS.reduce((acc, curr) => {
      acc[curr.id] = curr.label;
      return acc;
    }, {});
  }, []);

  // Format chart data
  const chartData = useMemo(() => {
    const sorted = [...moods].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map(m => {
      const moodObj = MOODS.find(mo => mo.id === m.mood);
      return {
        dateStr: new Date(m.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        date: m.date,
        energy: m.energy_level,
        moodWeight: moodObj ? moodObj.weight : 3,
        moodLabel: moodObj ? moodObj.label : 'Okay'
      };
    });
  }, [moods]);

  return (
    <div className="space-y-6">
      {/* Burnout Warning Banner */}
      {isBurntOut && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-bold text-orange-800 text-sm">Take a breather today</h4>
            <p className="text-orange-700 text-xs mt-0.5 leading-relaxed">
              You've logged "Stressed" or "Burnt Out" for 3 consecutive days. Remember, rest is a active part of prep. 
              Consider a lighter revision schedule or taking the afternoon off to recharge.
            </p>
          </div>
        </div>
      )}

      {/* Main check-in grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check in Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Sparkles size={17} className="text-brand-500" />
              <span>Daily Check-in</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">How's your mood?</label>
                <div className="flex flex-col gap-2">
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMood(m.id)}
                        className={`w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? `${m.color} ring-2 ring-brand-500/20 border-slate-400 font-bold scale-[1.01]`
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Energy Level: <span className="text-brand-600 font-bold">{energyLevel}/5</span>
                </label>
                <div className="flex justify-between items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`flex-1 aspect-square rounded-xl border flex items-center justify-center font-bold text-sm transition-all duration-150 ${
                        energyLevel === lvl
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Journal Note (optional)</label>
                <textarea
                  placeholder="How went your day? Any blocks?"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors mt-2"
              >
                Log Check-in
              </button>
            </form>
          </div>
        </div>

        {/* Recharts Mood & Energy Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base">Weekly Mood & Energy Trend</h3>
            <p className="text-slate-500 text-xs mt-0.5">Visualize your fatigue level and mood patterns side-by-side</p>
          </div>

          <div className="flex-1 min-h-[300px] h-[340px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Log today's check-in to start mapping your mood.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[1, 5]} tickCount={5} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value, name) => {
                      if (name === 'Energy Level') return [`${value}/5`, 'Energy'];
                      // Find matching mood label
                      const moodLabel = MOODS.find(m => m.weight === value)?.label || value;
                      return [moodLabel, 'Mood'];
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Line
                    name="Energy Level"
                    type="monotone"
                    dataKey="energy"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 3 }}
                  />
                  <Line
                    name="Mood (Normalized)"
                    type="monotone"
                    dataKey="moodWeight"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ fill: '#818cf8', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Mood History list */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <Calendar size={17} className="text-brand-500" />
          <span>Mood Logs</span>
        </h3>

        {moods.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No mood checks logged yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {[...moods].reverse().map((log) => {
              const mObj = MOODS.find(mo => mo.id === log.mood);
              return (
                <div key={log.id} className="border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/20">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {new Date(log.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${mObj ? mObj.color : ''}`}>
                      {mObj ? mObj.label : log.mood}
                    </span>
                    <span className="text-xs text-slate-500">
                      Energy: <strong className="text-slate-700">{log.energy_level}/5</strong>
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-xs text-slate-600 bg-white border border-slate-100 px-3 py-1.5 rounded-lg italic flex-1 max-w-lg md:text-right md:ml-auto">
                      "{log.note}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
