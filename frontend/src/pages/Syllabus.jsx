import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Grid3X3 } from 'lucide-react';

// Week date ranges: weekName -> { start: 'YYYY-MM-DD', days: number }
const WEEK_RANGES = {
  "Week: Setup": { start: "2026-06-20", days: 3 },
  "Week 1 (Jun 23-29) — PDS Part 1": { start: "2026-06-23", days: 7 },
  "Week 2 (Jun 30-Jul 6) — PDS Part 2": { start: "2026-06-30", days: 7 },
  "Week 3 (Jul 7-13) — Algorithms Part 1": { start: "2026-07-07", days: 7 },
  "Week 4 (Jul 14-20) — Algorithms Part 2": { start: "2026-07-14", days: 7 },
  "Week 5 (Jul 21-27) — Discrete Maths Part 1": { start: "2026-07-21", days: 7 },
  "Week 6 (Jul 28-Aug 3) — Discrete Maths Part 2": { start: "2026-07-28", days: 7 },
  "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1": { start: "2026-08-04", days: 7 },
  "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1": { start: "2026-08-11", days: 7 },
  "Week 9 (Aug 18-23) — CN Part 2 + Catch-up": { start: "2026-08-18", days: 6 },
  "Week 10 (Aug 24-30) — DBMS Part 1": { start: "2026-08-24", days: 7 },
  "Week 11 (Aug 31-Sep 6) — DBMS Part 2": { start: "2026-08-31", days: 7 },
  "Week 12 (Sep 7-13) — Computer Organization Part 1": { start: "2026-09-07", days: 7 },
  "Week 13 (Sep 14-20) — Computer Organization Part 2": { start: "2026-09-14", days: 7 },
  "Week 14 (Sep 21-27) — Theory of Computation": { start: "2026-09-21", days: 7 },
  "Week 15 (Sep 28-Oct 4) — Digital Logic + Compiler Design": { start: "2026-09-28", days: 7 },
  "Week 16-17 (Oct 5-15) — Full Revision + Mocks": { start: "2026-10-05", days: 11 },
  "Period: Oct 16-31": { start: "2026-10-16", days: 16 },
  "Period: Nov 1-15": { start: "2026-11-01", days: 15 },
  "Period: Nov 16-25": { start: "2026-11-16", days: 10 },
  "Period: Nov 26-30": { start: "2026-11-26", days: 5 },
};

// Short day labels: Mon, Tue, etc.
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Get date string YYYY-MM-DD for a day offset from start
function getDateForDay(startStr, offset) {
  const d = new Date(startStr + 'T00:00:00');
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    dayName: DAY_NAMES[d.getDay()],
    date: d.getDate(),
    month: MONTH_SHORT[d.getMonth()],
  };
}

// Check if a date string is today
function isToday(dateStr) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

export default function Syllabus({ topics, onTickTopic, loading }) {
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [collapsedWeeks, setCollapsedWeeks] = useState({});

  // Group topics by phase and week
  const structuredSyllabus = useMemo(() => {
    const groups = {};
    topics.forEach((t) => {
      if (!groups[t.phase]) {
        groups[t.phase] = { name: t.phase, weeks: {}, total: 0, done: 0 };
      }
      if (!groups[t.phase].weeks[t.week]) {
        groups[t.phase].weeks[t.week] = { name: t.week, topics: [], totalTicks: 0, maxTicks: 0 };
      }
      groups[t.phase].weeks[t.week].topics.push(t);

      const weekRange = WEEK_RANGES[t.week];
      const numDays = weekRange ? weekRange.days : 7;
      const ticked = (t.ticked_dates || []).length;
      groups[t.phase].weeks[t.week].totalTicks += ticked;
      groups[t.phase].weeks[t.week].maxTicks += numDays;

      groups[t.phase].total++;
      if (t.status === 'DONE') groups[t.phase].done++;
    });
    return groups;
  }, [topics]);

  const togglePhase = (n) => setCollapsedPhases(prev => ({ ...prev, [n]: !prev[n] }));
  const toggleWeek = (n) => setCollapsedWeeks(prev => ({ ...prev, [n]: !prev[n] }));

  // Overall statistics
  const overall = useMemo(() => {
    const total = topics.length;
    const done = topics.filter(t => t.status === 'DONE').length;
    return { percent: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
  }, [topics]);

  if (loading && topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
        <span>Loading syllabus...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall progress bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Grid3X3 size={20} className="text-brand-500" />
            Syllabus Grid Tracker
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Each cell = one study session for that topic on that day. Tick as many days as you study it!
          </p>
        </div>
        <div className="flex-1 md:max-w-md w-full">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Overall syllabus progress</span>
            <span className="text-sm font-bold text-slate-800">{overall.percent}% ({overall.done}/{overall.total})</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Structured syllabus tree */}
      <div className="space-y-4">
        {Object.values(structuredSyllabus).map((phase) => {
          const isPhaseCollapsed = !!collapsedPhases[phase.name];
          const phasePercent = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;

          return (
            <div key={phase.name} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Phase Header */}
              <div
                onClick={() => togglePhase(phase.name)}
                className="p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-700 text-sm md:text-base truncate">{phase.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                      {phase.done}/{phase.total} topics marked done
                    </span>
                    <div className="flex items-center gap-1.5 w-24 md:w-32">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-600 h-full rounded-full" style={{ width: `${phasePercent}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{phasePercent}%</span>
                    </div>
                  </div>
                </div>
                <button className="text-slate-400 p-1 hover:text-slate-600">
                  {isPhaseCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Phase Content */}
              {!isPhaseCollapsed && (
                <div className="p-4 space-y-4">
                  {Object.values(phase.weeks).map((week) => {
                    const isWeekCollapsed = !!collapsedWeeks[week.name];
                    const weekRange = WEEK_RANGES[week.name];
                    const numDays = weekRange ? weekRange.days : 7;
                    const startStr = weekRange ? weekRange.start : null;

                    // Build day date strings
                    const dayDates = startStr
                      ? Array.from({ length: numDays }, (_, i) => getDateForDay(startStr, i))
                      : Array.from({ length: numDays }, (_, i) => `day-${i + 1}`);

                    // Compute % of ticks filled for this week
                    const totalCells = week.topics.length * numDays;
                    const filledCells = week.topics.reduce(
                      (sum, t) => sum + (t.ticked_dates || []).length, 0
                    );
                    const weekFillPct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

                    return (
                      <div key={week.name} className="border border-slate-100 rounded-xl overflow-hidden">
                        {/* Week Header */}
                        <div
                          onClick={() => toggleWeek(week.name)}
                          className="p-3 bg-slate-50/30 hover:bg-slate-50/60 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-600 text-xs md:text-sm truncate">{week.name}</h4>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-medium">
                                {filledCells}/{totalCells} cells ticked
                              </span>
                              <div className="flex items-center gap-1 w-16 md:w-24">
                                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                  <div className="bg-brand-400 h-full rounded-full" style={{ width: `${weekFillPct}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">{weekFillPct}%</span>
                              </div>
                            </div>
                          </div>
                          <button className="text-slate-400 p-0.5">
                            {isWeekCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>

                        {/* Week Grid */}
                        {!isWeekCollapsed && (
                          <div className="p-3 bg-white border-t border-slate-50 overflow-x-auto">
                            <table className="w-full text-xs border-collapse min-w-max">
                              <thead>
                                <tr>
                                  {/* Topic column header */}
                                  <th className="text-left py-2 pr-3 pl-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-40 min-w-[140px]">
                                    Topic
                                  </th>
                                  {/* Day columns */}
                                  {dayDates.map((dateStr, di) => {
                                    const label = startStr ? getDayLabel(dateStr) : null;
                                    const today = startStr ? isToday(dateStr) : false;
                                    return (
                                      <th
                                        key={di}
                                        className={`text-center py-2 px-1 min-w-[44px] ${today ? 'text-brand-600' : 'text-slate-400'}`}
                                      >
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className={`text-[9px] font-semibold uppercase ${today ? 'text-brand-600' : 'text-slate-400'}`}>
                                            {label ? label.dayName : `D${di + 1}`}
                                          </span>
                                          <span className={`text-[10px] font-bold ${today ? 'text-brand-700' : 'text-slate-600'}`}>
                                            {label ? label.date : di + 1}
                                          </span>
                                          {label && (
                                            <span className="text-[8px] text-slate-400">{label.month}</span>
                                          )}
                                          {today && (
                                            <span className="block w-1.5 h-1.5 rounded-full bg-brand-500 mx-auto mt-0.5" />
                                          )}
                                        </div>
                                      </th>
                                    );
                                  })}
                                  {/* Done indicator column */}
                                  <th className="text-center py-2 px-1 min-w-[44px] text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {week.topics.map((topic, ti) => {
                                  const tickedSet = new Set(topic.ticked_dates || []);
                                  const tickCount = tickedSet.size;
                                  const isDone = topic.status === 'DONE';
                                  const isInProgress = topic.status === 'IN_PROGRESS';

                                  return (
                                    <tr
                                      key={topic.id}
                                      className={`border-t ${ti % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} group`}
                                    >
                                      {/* Topic name */}
                                      <td className="py-2.5 pr-3 pl-1 min-w-[140px]">
                                        <div className="flex items-center gap-1.5">
                                          {isDone ? (
                                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0 fill-emerald-50" />
                                          ) : (
                                            <span className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                                              isInProgress ? 'border-amber-400 bg-amber-100' : 'border-slate-300 bg-white'
                                            }`} />
                                          )}
                                          <span className={`text-[11px] font-medium leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                            {topic.title}
                                          </span>
                                        </div>
                                        {tickCount > 0 && (
                                          <div className="ml-4 mt-0.5">
                                            <span className="text-[9px] text-brand-600 font-semibold">
                                              {tickCount} day{tickCount !== 1 ? 's' : ''} studied
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Day checkboxes */}
                                      {dayDates.map((dateStr, di) => {
                                        const isTicked = tickedSet.has(dateStr);
                                        const today = startStr ? isToday(dateStr) : false;

                                        return (
                                          <td key={di} className="text-center py-2 px-1">
                                            <button
                                              onClick={() => onTickTopic(topic, dateStr, !isTicked)}
                                              className={`
                                                w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto
                                                transition-all duration-150 cursor-pointer select-none
                                                ${isTicked
                                                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-200'
                                                  : today
                                                    ? 'border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-400 hover:border-brand-400'
                                                    : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 text-slate-300 hover:text-brand-400'
                                                }
                                              `}
                                              title={`Mark "${topic.title}" on ${dateStr}`}
                                            >
                                              {isTicked && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              )}
                                            </button>
                                          </td>
                                        );
                                      })}

                                      {/* Status column */}
                                      <td className="text-center py-2 px-1">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${
                                          isDone
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : isInProgress
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          {isDone ? 'Done' : isInProgress ? 'Active' : 'New'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
