import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calendar, Award, Target, Flame, BarChart3, Trash2, Search, Filter, BookOpen } from 'lucide-react';

// ─── Aptitude Heatmap ──────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildHeatmapData() {
  // All days Jun 20 → Nov 30, 2026
  const days = [];
  const cursor = new Date('2026-06-20T00:00:00');
  const end    = new Date('2026-11-30T00:00:00');
  while (cursor <= end) {
    days.push({
      date: `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`,
      dow:  cursor.getDay(),           // 0=Sun … 6=Sat
      month: cursor.getMonth(),
      day:   cursor.getDate(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const ALL_DAYS = buildHeatmapData();

function AptitudeHeatmap({ aptitude }) {
  const [tooltip, setTooltip] = useState(null);

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  })();

  const doneSet = useMemo(() => {
    const s = new Set();
    (aptitude || []).forEach(l => { if (l.completed === 1 || l.completed === true) s.add(l.date); });
    return s;
  }, [aptitude]);

  // Group days into columns: one column per week (Sun→Sat)
  // Each column = array of {date,dow,month,day} or null (padding)
  const columns = useMemo(() => {
    const cols = [];
    let col = [];
    // Pad start so first day lands on correct row
    const firstDow = ALL_DAYS[0].dow;
    for (let i = 0; i < firstDow; i++) col.push(null); // top padding nulls

    ALL_DAYS.forEach(d => {
      col.push(d);
      if (d.dow === 6) { // Saturday — end of week
        cols.push(col);
        col = [];
      }
    });
    if (col.length > 0) {
      // Pad end
      while (col.length < 7) col.push(null);
      cols.push(col);
    }
    return cols;
  }, []);

  // Month label positions: for each column index, if the first non-null day in it
  // is the 1st or it's the very first column → show month label
  const monthLabels = useMemo(() => {
    const labels = {};
    let lastMonth = -1;
    columns.forEach((col, ci) => {
      const first = col.find(d => d !== null);
      if (first && first.month !== lastMonth) {
        labels[ci] = MONTH_NAMES[first.month];
        lastMonth = first.month;
      }
    });
    return labels;
  }, [columns]);

  const totalDays = ALL_DAYS.length;
  const doneDays = doneSet.size;
  const pct = Math.round((doneDays / totalDays) * 100);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <BookOpen size={17} className="text-brand-500" />
            Aptitude Practice History
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Jun 20 → Nov 30, 2026 · {doneDays}/{totalDays} days completed ({pct}%)
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-400 inline-block" />
            Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-slate-200 inline-block" />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
            Upcoming
          </span>
        </div>
      </div>

      {/* Day-of-week labels on the left */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Left axis: day labels */}
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          <div className="h-4" />{/* month label row spacer */}
          {DAY_LABELS.map(d => (
            <div key={d} className="h-[14px] flex items-center">
              <span className="text-[9px] text-slate-400 font-semibold w-7 text-right pr-1 leading-none">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Heatmap columns */}
        <div className="flex gap-1 overflow-x-auto">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {/* Month label */}
              <div className="h-4 flex items-center">
                {monthLabels[ci] && (
                  <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                    {monthLabels[ci]}
                  </span>
                )}
              </div>
              {/* Cells */}
              {col.map((d, ri) => {
                if (!d) {
                  return <div key={ri} className="w-[14px] h-[14px]" />;
                }
                const isDone    = doneSet.has(d.date);
                const isFuture  = d.date > today;
                const isToday   = d.date === today;

                let cellClass = '';
                if (isDone)           cellClass = 'bg-emerald-400 hover:bg-emerald-500';
                else if (isFuture)    cellClass = 'bg-slate-100 border border-slate-200';
                else if (isToday)     cellClass = 'bg-brand-200 border-2 border-brand-400';
                else                  cellClass = 'bg-slate-200 hover:bg-slate-300';

                return (
                  <div
                    key={ri}
                    className={`w-[14px] h-[14px] rounded-sm cursor-pointer transition-colors duration-100 ${cellClass}`}
                    onMouseEnter={() => setTooltip({
                      date: d.date,
                      status: isDone ? 'Done ✓' : isFuture ? 'Upcoming' : isToday ? 'Today' : 'Missed'
                    })}
                    onMouseLeave={() => setTooltip(null)}
                    title={`${d.date} · ${isDone ? 'Done' : isFuture ? 'Upcoming' : isToday ? 'Today (not done yet)' : 'Missed'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip display */}
      {tooltip && (
        <div className="mt-3 text-xs font-semibold text-slate-600 flex items-center gap-2">
          <Calendar size={13} className="text-slate-400" />
          <span>{tooltip.date}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            tooltip.status.startsWith('Done') ? 'bg-emerald-100 text-emerald-700'
            : tooltip.status === 'Upcoming'   ? 'bg-slate-100 text-slate-500'
            : tooltip.status === 'Today'      ? 'bg-brand-100 text-brand-700'
            :                                   'bg-slate-200 text-slate-600'
          }`}>{tooltip.status}</span>
        </div>
      )}
    </div>
  );
}

// ─── Performance ───────────────────────────────────────────────────────────

const SUBJECTS = [
  "Programming & Data Structures",
  "Algorithms",
  "Discrete Mathematics",
  "Engineering Mathematics",
  "Operating Systems",
  "Computer Networks",
  "Databases (DBMS)",
  "Computer Organization & Architecture",
  "Theory of Computation",
  "Digital Logic",
  "Compiler Design",
  "General Aptitude"
];

export default function Performance({ tests, aptitude, onLogTest }) {
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [marksScored, setMarksScored] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [timeTaken, setTimeTaken] = useState('');
  const [qAttempted, setQAttempted] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  
  // Filtering & Search State
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartSubject, setChartSubject] = useState('ALL');

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !subject || !topic || !marksScored || !totalMarks) return;

    onLogTest({
      date,
      subject,
      topic,
      marks_scored: parseFloat(marksScored),
      total_marks: parseFloat(totalMarks),
      time_taken: timeTaken ? parseInt(timeTaken, 10) : null,
      questions_attempted: qAttempted ? parseInt(qAttempted, 10) : null,
      questions_correct: qCorrect ? parseInt(qCorrect, 10) : null
    });

    // Reset some fields
    setTopic('');
    setMarksScored('');
    setTotalMarks('');
    setTimeTaken('');
    setQAttempted('');
    setQCorrect('');
  };

  // Performance calculations
  const stats = useMemo(() => {
    if (tests.length === 0) {
      return {
        overallAvg: 0,
        weakest: 'N/A',
        mostImproved: 'N/A',
        subjectStats: {}
      };
    }

    // 1. Group tests by subject
    const groups = {};
    let overallScoredTotal = 0;
    let overallMarksTotal = 0;

    tests.forEach(t => {
      if (!groups[t.subject]) {
        groups[t.subject] = [];
      }
      groups[t.subject].push(t);
      overallScoredTotal += t.marks_scored;
      overallMarksTotal += t.total_marks;
    });

    // 2. Average per subject
    const subjectStats = {};
    Object.keys(groups).forEach(sub => {
      const list = groups[sub];
      const sumScored = list.reduce((a, b) => a + b.marks_scored, 0);
      const sumTotal = list.reduce((a, b) => a + b.total_marks, 0);
      subjectStats[sub] = {
        avg: Math.round((sumScored / sumTotal) * 100),
        count: list.length,
        tests: list
      };
    });

    // 3. Find weakest subject (lowest average, min 1 test)
    let weakestSub = 'N/A';
    let minAvg = Infinity;
    Object.keys(subjectStats).forEach(sub => {
      if (subjectStats[sub].avg < minAvg) {
        minAvg = subjectStats[sub].avg;
        weakestSub = `${sub} (${minAvg}%)`;
      }
    });

    // 4. Find most improved (comparing first 5 vs last 5 chronologically)
    let mostImprovedSub = 'N/A';
    let maxDiff = -Infinity;

    Object.keys(groups).forEach(sub => {
      const list = [...groups[sub]].sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());
      
      if (list.length >= 2) {
        // Compare early vs later. If less than 10, split in half (up to 5 each)
        const size = Math.min(5, Math.ceil(list.length / 2));
        const firstFew = list.slice(0, size);
        const lastFew = list.slice(-size);

        const firstAvg = firstFew.reduce((sum, t) => sum + (t.marks_scored / t.total_marks), 0) / firstFew.length;
        const lastAvg = lastFew.reduce((sum, t) => sum + (t.marks_scored / t.total_marks), 0) / lastFew.length;

        const diff = (lastAvg - firstAvg) * 100;
        
        if (diff > maxDiff && diff > 0) {
          maxDiff = Math.round(diff);
          mostImprovedSub = `${sub} (+${maxDiff}%)`;
        }
      }
    });

    return {
      overallAvg: Math.round((overallScoredTotal / overallMarksTotal) * 100),
      weakest: weakestSub,
      mostImproved: mostImprovedSub,
      subjectStats
    };
  }, [tests]);

  // Chart Data preparation (chronological order)
  const chartData = useMemo(() => {
    const sorted = [...tests].sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());
    
    const filtered = chartSubject === 'ALL' 
      ? sorted 
      : sorted.filter(t => t.subject === chartSubject);

    return filtered.map((t, idx) => ({
      name: idx + 1,
      date: t.date,
      percentage: Math.round((t.marks_scored / t.total_marks) * 100),
      subject: t.subject,
      topic: t.topic
    }));
  }, [tests, chartSubject]);

  // Table Data filtered and searched
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const matchesSubject = filterSubject === 'ALL' || t.subject === filterSubject;
      const matchesSearch = t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [tests, filterSubject, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Overall Avg Score</span>
            <span className="text-2xl font-bold text-slate-800">{stats.overallAvg}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-calm-red-50 text-red-600 flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Weakest Subject</span>
            <span className="text-sm font-bold text-slate-800 truncate block max-w-[200px]" title={stats.weakest}>
              {stats.weakest}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-calm-green-50 text-emerald-600 flex items-center justify-center">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Most Improved</span>
            <span className="text-sm font-bold text-slate-800 truncate block max-w-[200px]" title={stats.mostImproved}>
              {stats.mostImproved}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logging Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <BarChart3 size={17} className="text-brand-500" />
            <span>Log Practice Session</span>
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {SUBJECTS.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Topic / Test Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Heaps PYQs or Mini Mock 1"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Marks Scored</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 15"
                  value={marksScored}
                  onChange={(e) => setMarksScored(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Marks</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 20"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Taken (minutes, optional)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Questions Attempted</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={qAttempted}
                  onChange={(e) => setQAttempted(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Questions Correct</label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors mt-2"
            >
              Log Session
            </button>
          </form>
        </div>

        {/* Recharts Analytics Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Performance Trend</h3>
              <p className="text-slate-500 text-xs mt-0.5">Track your scoring percentages over sequential test attempts</p>
            </div>
            <select
              value={chartSubject}
              onChange={(e) => setChartSubject(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none font-medium text-slate-600"
            >
              <option value="ALL">All Subjects</option>
              {SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-h-[300px] h-[340px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Log at least one practice session to view trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    labelFormatter={(label) => `Attempt #${label}`}
                    formatter={(value, name, props) => [
                      `${value}%`,
                      `${props.payload.subject} (${props.payload.topic})`
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#5c74a6" 
                    strokeWidth={2.5}
                    dot={{ fill: '#5c74a6', r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-bold text-slate-800 text-base">Practice History</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search topic or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            {/* Subject Filter */}
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none text-slate-600 font-medium"
              >
                <option value="ALL">Filter: All Subjects</option>
                {SUBJECTS.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No matching practice logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredTests.map((t) => {
                  const pct = Math.round((t.marks_scored / t.total_marks) * 100);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(t.date + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 max-w-[150px] truncate" title={t.subject}>{t.subject}</td>
                      <td className="py-3.5 px-4">{t.topic}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{t.marks_scored}/{t.total_marks}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pct >= 75 
                            ? 'bg-emerald-50 text-emerald-600'
                            : pct >= 50
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50/70 text-red-600'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {t.time_taken ? `${t.time_taken} min` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {t.questions_attempted ? `${t.questions_correct || 0}/${t.questions_attempted}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── APTITUDE HEATMAP ─────────────────────────────────────────── */}
      <AptitudeHeatmap aptitude={aptitude} />

    </div>
  );
}
