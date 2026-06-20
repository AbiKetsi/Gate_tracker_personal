import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, TrendingUp, Heart, PlusCircle, ArrowRight, Activity, Smile, Flame, BookOpen, Star } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Compute current streak and best streak from an aptitude log array
// Each log: { date: 'YYYY-MM-DD', completed: 0|1 }
function computeStreaks(aptitude) {
  if (!aptitude || aptitude.length === 0) return { current: 0, best: 0 };

  // Build a set of completed dates
  const doneSet = new Set(
    aptitude.filter(l => l.completed === 1 || l.completed === true).map(l => l.date)
  );

  const today = getTodayStr();

  // Walk backward from yesterday (or today if today is done) counting consecutive done days
  // for current streak
  let currentStreak = 0;
  let cursor = new Date(today + 'T00:00:00');

  // If today is done, start from today; otherwise start checking from yesterday
  if (doneSet.has(today)) {
    currentStreak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Walk back until we find a gap
  while (true) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (doneSet.has(dateStr)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    // Safety: don't go before Jun 20, 2026
    if (cursor < new Date('2026-06-19T00:00:00')) break;
  }

  // Compute best streak: scan all dates from Jun 20 to today in order
  const start = new Date('2026-06-20T00:00:00');
  const end = new Date(today + 'T00:00:00');
  let bestStreak = 0;
  let runningStreak = 0;
  const d = new Date(start);
  while (d <= end) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (doneSet.has(ds)) {
      runningStreak++;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
    d.setDate(d.getDate() + 1);
  }

  return { current: currentStreak, best: bestStreak };
}

const getActiveWeekName = (date = new Date()) => {
  const ranges = [
    { name: "Week: Setup", start: "2026-06-20", end: "2026-06-22" },
    { name: "Week 1 (Jun 23-29) — PDS Part 1", start: "2026-06-23", end: "2026-06-29" },
    { name: "Week 2 (Jun 30-Jul 6) — PDS Part 2", start: "2026-06-30", end: "2026-07-06" },
    { name: "Week 3 (Jul 7-13) — Algorithms Part 1", start: "2026-07-07", end: "2026-07-13" },
    { name: "Week 4 (Jul 14-20) — Algorithms Part 2", start: "2026-07-14", end: "2026-07-20" },
    { name: "Week 5 (Jul 21-27) — Discrete Maths Part 1", start: "2026-07-21", end: "2026-07-27" },
    { name: "Week 6 (Jul 28-Aug 3) — Discrete Maths Part 2", start: "2026-07-28", end: "2026-08-03" },
    { name: "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1", start: "2026-08-04", end: "2026-08-10" },
    { name: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1", start: "2026-08-11", end: "2026-08-17" },
    { name: "Week 9 (Aug 18-23) — CN Part 2 + Catch-up", start: "2026-08-18", end: "2026-08-23" },
    { name: "Week 10 (Aug 24-30) — DBMS Part 1", start: "2026-08-24", end: "2026-08-30" },
    { name: "Week 11 (Aug 31-Sep 6) — DBMS Part 2", start: "2026-08-31", end: "2026-09-06" },
    { name: "Week 12 (Sep 7-13) — Computer Organization Part 1", start: "2026-09-07", end: "2026-09-13" },
    { name: "Week 13 (Sep 14-20) — Computer Organization Part 2", start: "2026-09-14", end: "2026-09-20" },
    { name: "Week 14 (Sep 21-27) — Theory of Computation", start: "2026-09-21", end: "2026-09-27" },
    { name: "Week 15 (Sep 28-Oct 4) — Digital Logic + Compiler Design", start: "2026-09-28", end: "2026-10-04" },
    { name: "Week 16-17 (Oct 5-15) — Full Revision + Mocks", start: "2026-10-05", end: "2026-10-15" },
    { name: "Period: Oct 16-31", start: "2026-10-16", end: "2026-10-31" },
    { name: "Period: Nov 1-15", start: "2026-11-01", end: "2026-11-15" },
    { name: "Period: Nov 16-25", start: "2026-11-16", end: "2026-11-25" },
    { name: "Period: Nov 26-30", start: "2026-11-26", end: "2026-11-30" },
  ];

  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  for (const r of ranges) {
    const s = new Date(r.start + 'T00:00:00').getTime();
    const e = new Date(r.end + 'T23:59:59').getTime();
    if (t >= s && t <= e) return r.name;
  }
  if (t < new Date("2026-06-20T00:00:00").getTime()) return "Week: Setup";
  return "Period: Nov 26-30";
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function Dashboard({ topics, tests, moods, settings, aptitude, setActiveTab, onToggleTopic, onLogAptitude }) {
  const now = new Date();
  const today = getTodayStr();

  // Today's aptitude status from server data
  const todayAptitude = useMemo(() => {
    if (!aptitude) return null;
    return aptitude.find(l => l.date === today) || null;
  }, [aptitude, today]);

  const isTodayDone = todayAptitude && (todayAptitude.completed === 1 || todayAptitude.completed === true);

  // Streak computation
  const streaks = useMemo(() => computeStreaks(aptitude), [aptitude]);

  // Formatted today label
  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  // Syllabus statistics
  const syllabusStats = useMemo(() => {
    const total = topics.length;
    if (total === 0) return { count: 0, total: 0, percent: 0 };
    const completed = topics.filter(t => t.status === 'DONE').length;
    return { count: completed, total, percent: Math.round((completed / total) * 100) };
  }, [topics]);

  // Days count downs
  const countdowns = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetNov = new Date('2026-11-30T00:00:00');
    const daysNov = Math.max(0, Math.ceil((targetNov - today) / (1000 * 60 * 60 * 24)));
    const targetFeb = new Date((settings.feb_exam_date || '2027-02-07') + 'T00:00:00');
    const daysFeb = Math.max(0, Math.ceil((targetFeb - today) / (1000 * 60 * 60 * 24)));
    return { daysNov, daysFeb, febDate: settings.feb_exam_date || '2027-02-07' };
  }, [settings, now]);

  const currentWeekName = useMemo(() => getActiveWeekName(now), [now]);

  const doneSet = useMemo(() => {
    if (!aptitude) return new Set();
    return new Set(
      aptitude.filter(l => l.completed === 1 || l.completed === true).map(l => l.date)
    );
  }, [aptitude]);

  const weekDates = useMemo(() => {
    const range = WEEK_RANGES[currentWeekName] || WEEK_RANGES["Week: Setup"];
    const arr = [];
    for (let i = 0; i < range.days; i++) {
      arr.push(getDateForDay(range.start, i));
    }
    return arr;
  }, [currentWeekName]);

  const activeFocusTopics = useMemo(() => {
    return topics.filter(t => t.week === currentWeekName);
  }, [topics, currentWeekName]);

  // Activity Feed (Last 5 actions)
  const activityFeed = useMemo(() => {
    const items = [];
    topics.forEach(t => {
      if (t.status === 'DONE' && t.done_timestamp) {
        items.push({
          type: 'topic',
          title: `Completed topic: "${t.title}"`,
          subtitle: t.week,
          timestamp: new Date(t.done_timestamp).getTime(),
          dateStr: new Date(t.done_timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
      }
    });
    tests.forEach(test => {
      const scorePct = Math.round((test.marks_scored / test.total_marks) * 100);
      items.push({
        type: 'test',
        title: `Logged test score: ${test.marks_scored}/${test.total_marks} (${scorePct}%)`,
        subtitle: `${test.subject} — ${test.topic}`,
        timestamp: new Date(test.created_at || (test.date + 'T12:00:00')).getTime(),
        dateStr: new Date(test.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    });
    moods.forEach(mood => {
      items.push({
        type: 'mood',
        title: `Daily check-in logged`,
        subtitle: `Mood: ${mood.mood} | Energy: ${mood.energy_level}/5`,
        timestamp: new Date(mood.date + 'T12:00:00').getTime(),
        dateStr: new Date(mood.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [topics, tests, moods]);

  return (
    <div className="space-y-6">

      {/* ── APTITUDE TRACKER CARD (always first) ────────────────────────── */}
      <div className={`rounded-2xl border-2 shadow-sm transition-all duration-300 overflow-hidden ${
        isTodayDone
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
          : 'border-slate-200/80 bg-white'
      }`}>
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">

          {/* Left section: Title, Subtitle, and Daily Checkboxes */}
          <div className="flex-1">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-bold text-base leading-tight ${isTodayDone ? 'text-emerald-800' : 'text-slate-800'}`}>
                  Daily Aptitude Practice
                </h3>
                {isTodayDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    ✓ Done today!
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isTodayDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                {isTodayDone
                  ? 'Great work! Keep the streak alive tomorrow.'
                  : `Not done yet today · ${todayLabel}`
                }
              </p>
            </div>

            {/* Checkboxes Row */}
            <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {weekDates.map((dateStr) => {
                const isTicked = doneSet.has(dateStr);
                const isFut = dateStr > today;
                const isTod = dateStr === today;
                const isPast = dateStr < today;
                const label = getDayLabel(dateStr);

                return (
                  <div key={dateStr} className="flex flex-col items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${isTod ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {label.dayName}
                    </span>
                    <button
                      disabled={isFut || isPast} // Only today is clickable!
                      onClick={() => onLogAptitude(dateStr, !isTicked)}
                      className={`
                        w-8 h-8 rounded-lg border-2 flex items-center justify-center relative
                        transition-all duration-150 select-none
                        ${isTicked
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100'
                          : isTod
                            ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer shadow-sm shadow-emerald-50'
                            : isPast
                              ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                              : 'border-slate-100 bg-slate-50 text-slate-200 cursor-not-allowed opacity-45'
                          }
                        `}
                      title={isTod ? "Toggle today's aptitude practice" : isFut ? `Future date (${dateStr})` : `Aptitude on ${dateStr}`}
                    >
                      {isTicked ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">
                          {label.date}
                        </span>
                      )}
                    </button>
                    <span className="text-[8px] text-slate-400 font-semibold">{label.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Streak badges */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {/* Current streak */}
            <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${
              streaks.current > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1">
                <Flame size={16} className={streaks.current > 0 ? 'text-amber-500' : 'text-slate-400'} />
                <span className={`text-xl font-black ${streaks.current > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {streaks.current}
                </span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                day streak
              </span>
            </div>

            {/* Best streak */}
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl border bg-slate-50 border-slate-200">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-slate-400" />
                <span className="text-xl font-black text-slate-500">{streaks.best}</span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                best
              </span>
            </div>
          </div>
        </div>

        {/* Subtle bottom bar showing progress across the whole period */}
        {(() => {
          const totalDays = 164; // Jun 20 → Nov 30
          const doneDays = aptitude ? aptitude.filter(l => l.completed === 1 || l.completed === true).length : 0;
          const pct = Math.round((doneDays / totalDays) * 100);
          return (
            <div className="px-5 pb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Jun 20 → Nov 30 overall
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  {doneDays}/{totalDays} days · {pct}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isTodayDone ? 'bg-emerald-400' : 'bg-brand-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h2>
        <p className="text-slate-500 text-sm mt-0.5">Let's keep the momentum going. Study smart, rest when needed.</p>
      </div>

      {/* ── COUNTDOWN CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Progress Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Syllabus Completion</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-800">{syllabusStats.percent}%</span>
              <span className="text-slate-500 text-xs font-medium">({syllabusStats.count}/{syllabusStats.total} topics)</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${syllabusStats.percent}%` }} />
            </div>
          </div>
        </div>

        {/* Phase End Countdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Study Plan End (Nov 30, 2026)</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-slate-800">{countdowns.daysNov}</span>
              <span className="text-slate-500 text-sm font-medium">days left</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-4">
            <Calendar size={13} />
            <span>Target date: Nov 30, 2026</span>
          </div>
        </div>

        {/* Actual Exam Countdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">GATE 2027 Exam target</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-brand-600">{countdowns.daysFeb}</span>
              <span className="text-slate-500 text-sm font-medium">days left</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-500" />
              <span>Target date: {new Date(countdowns.febDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <button onClick={() => setActiveTab('settings')} className="text-brand-600 hover:text-brand-700 font-semibold hover:underline">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* ── FOCUS + QUICK LOG ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Focus Topics Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">This Week's Focus</h3>
              <p className="text-slate-500 text-[11px] font-medium uppercase mt-0.5">{currentWeekName}</p>
            </div>
            <button
              onClick={() => setActiveTab('syllabus')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 hover:underline"
            >
              View Full Syllabus <ArrowRight size={13} />
            </button>
          </div>

          {activeFocusTopics.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No specific topics scheduled for this calendar week.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {activeFocusTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => onToggleTopic(topic)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-slate-50/50 ${
                    topic.status === 'DONE'
                      ? 'border-emerald-100 bg-emerald-50/20'
                      : topic.status === 'IN_PROGRESS'
                      ? 'border-amber-100 bg-amber-50/10'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <button className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                    topic.status === 'DONE'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : topic.status === 'IN_PROGRESS'
                      ? 'border-amber-500 text-amber-500 bg-amber-50/50'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {topic.status === 'DONE' && <span className="text-[10px] font-bold">✓</span>}
                    {topic.status === 'IN_PROGRESS' && <span className="text-[10px] font-bold">●</span>}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium leading-tight ${topic.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {topic.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      {topic.status === 'DONE' ? 'Done' : topic.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Log Buttons */}
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between h-[148px]">
            <div>
              <h3 className="font-bold text-lg">Log Test Session</h3>
              <p className="text-white/80 text-xs mt-1">Keep track of your scoring trend, accuracy, and weak areas.</p>
            </div>
            <button
              onClick={() => setActiveTab('performance')}
              className="bg-white text-brand-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 transition-colors w-full mt-4"
            >
              <PlusCircle size={15} />
              <span>Log Score Now</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-[148px]">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Heart size={16} className="text-rose-500 fill-rose-500" />
                <span>Daily Check-in</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">Check in with your mood and energy. Prevent burnout early.</p>
            </div>
            <button
              onClick={() => setActiveTab('mood')}
              className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors w-full mt-4"
            >
              <Smile size={15} />
              <span>Log Mood &amp; Energy</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY FEED ───────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-4">
          <Activity size={17} className="text-brand-500" />
          <span>Recent Activity</span>
        </h3>

        {activityFeed.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No activity logged yet. Start checking off topics or logging scores!
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activityFeed.map((activity, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== activityFeed.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'topic'
                            ? 'bg-emerald-50 text-emerald-600'
                            : activity.type === 'test'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {activity.type === 'topic' && <CheckCircle2 size={15} />}
                          {activity.type === 'test' && <TrendingUp size={15} />}
                          {activity.type === 'mood' && <Heart size={15} />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{activity.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{activity.subtitle}</p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-medium pt-0.5">
                          {activity.dateStr}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
