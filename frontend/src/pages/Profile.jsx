import React, { useMemo } from 'react';
import { User, Calendar, Heart, BookOpen, Star, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../supabase';

export default function Profile({ topics, tests, moods, user }) {
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'GATE Aspirant';

  // 1. Overall completion rates
  const syllabusStats = useMemo(() => {
    const total = topics.length;
    if (total === 0) return { percent: 0, done: 0, total: 0 };
    const done = topics.filter(t => t.status === 'DONE').length;
    return {
      percent: Math.round((done / total) * 100),
      done,
      total
    };
  }, [topics]);

  // 2. Mock / Test statistics
  const testStats = useMemo(() => {
    const totalTests = tests.length;
    if (totalTests === 0) return { total: 0, avg: 0 };
    const sumPct = tests.reduce((sum, t) => sum + (t.marks_scored / t.total_marks), 0);
    return {
      total: totalTests,
      avg: Math.round((sumPct / totalTests) * 100)
    };
  }, [tests]);

  // 3. Subject-wise metrics
  const subjectAverages = useMemo(() => {
    const groups = {};
    tests.forEach(t => {
      if (!groups[t.subject]) {
        groups[t.subject] = { scored: 0, total: 0, count: 0 };
      }
      groups[t.subject].scored += t.marks_scored;
      groups[t.subject].total += t.total_marks;
      groups[t.subject].count += 1;
    });

    return Object.keys(groups).map(subject => {
      const g = groups[subject];
      return {
        subject,
        avg: Math.round((g.scored / g.total) * 100),
        count: g.count
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [tests]);

  // 4. Latest Mood check-in details
  const latestMood = useMemo(() => {
    if (moods.length === 0) return null;
    const sorted = [...moods].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  }, [moods]);

  // 5. Streaks or general highlights
  const highlights = useMemo(() => {
    const list = [];
    if (syllabusStats.percent >= 10) {
      list.push({ title: "Syllabus Starter", desc: "Completed over 10% of overall syllabus topics.", color: "bg-emerald-50 text-emerald-700 border-emerald-100" });
    }
    if (syllabusStats.percent >= 50) {
      list.push({ title: "Halfway Mark", desc: "You have conquered 50% of the entire syllabus checklist!", color: "bg-indigo-50 text-indigo-700 border-indigo-100" });
    }
    if (testStats.total >= 5) {
      list.push({ title: "Consistent Tester", desc: "Logged 5 or more practice/PYQ testing sessions.", color: "bg-amber-50 text-amber-700 border-amber-100" });
    }
    if (testStats.avg >= 70) {
      list.push({ title: "Top Performer", desc: "Maintain an overall testing average above 70%.", color: "bg-rose-50 text-rose-700 border-rose-100" });
    }
    if (list.length === 0) {
      list.push({ title: "Ready to Conquer", desc: "Start checking off syllabus items and logging practice scores to earn badges.", color: "bg-slate-50 text-slate-600 border-slate-200" });
    }
    return list;
  }, [syllabusStats, testStats]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Profile Banner */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        {/* Glow decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-white shadow-inner shrink-0">
          <User size={38} className="stroke-[1.5]" />
        </div>
        
        {/* Bio */}
        <div className="text-center md:text-left flex-1 space-y-1">
          <h2 className="text-2xl font-bold tracking-tight uppercase">{username}</h2>
          <p className="text-white/80 text-sm font-medium">GATE CS 2027 Aspirant</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-white/70 pt-2 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              <span>Target: Feb 2027</span>
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={13} />
              <span>Computer Science & IT</span>
            </span>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="px-4.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 ml-auto"
        >
          <LogOut size={13} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Grid of Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Syllabus Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Syllabus Completion</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">{syllabusStats.percent}%</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{syllabusStats.done} of {syllabusStats.total} topics marked done</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-500 h-full rounded-full" style={{ width: `${syllabusStats.percent}%` }} />
          </div>
        </div>

        {/* Tests Logged */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Practice Sessions</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800">{testStats.total}</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Overall testing average is {testStats.avg}%</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${testStats.avg}%` }} />
          </div>
        </div>

        {/* Today's Energy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Latest Mood State</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 capitalize">
              {latestMood ? latestMood.mood : 'N/A'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {latestMood ? `(Energy: ${latestMood.energy_level}/5)` : ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            {latestMood && latestMood.note ? `"${latestMood.note}"` : 'No notes logged recently.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Subject breakdown & highlight badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Standings Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Subject Performance</h3>
            <p className="text-slate-500 text-xs mt-0.5">Average scores ranked by mock/practice history</p>
          </div>

          {subjectAverages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
              No test logs available to compile standings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-2">Subject</th>
                    <th className="py-2.5 px-2 w-24 text-center">Tests Logged</th>
                    <th className="py-2.5 px-2 w-24 text-center">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px] font-medium text-slate-700">
                  {subjectAverages.map((sub, idx) => (
                    <tr key={sub.subject} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === subjectAverages.length - 1 ? 'bg-rose-400' : 'bg-slate-300'}`} />
                        <span className="truncate max-w-[220px]" title={sub.subject}>{sub.subject}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500">{sub.count}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">{sub.avg}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Milestones and Badges */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <Star size={16} className="text-brand-500 fill-brand-500" />
              <span>Milestones Earned</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Highlights of your study goals and consistency</p>
          </div>

          <div className="space-y-3">
            {highlights.map((badge, idx) => (
              <div key={idx} className={`p-4.5 rounded-xl border flex flex-col gap-1 ${badge.color}`}>
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles size={13} />
                  {badge.title}
                </span>
                <span className="text-[11px] opacity-90 leading-relaxed font-medium">
                  {badge.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reflective timelines */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <Heart size={16} className="text-rose-500 fill-rose-500" />
          <span>Journal Notes</span>
        </h3>

        {moods.filter(m => m.note).length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            You haven't logged any text notes in your daily check-ins yet. Add reflections in the Mood tab.
          </div>
        ) : (
          <div className="space-y-3">
            {moods.filter(m => m.note).slice(-4).reverse().map((log) => (
              <div key={log.id} className="border border-slate-100 p-4 rounded-xl flex items-start gap-4 bg-slate-50/20">
                <div className="text-[10px] text-slate-400 font-bold font-mono pt-0.5 whitespace-nowrap">
                  {new Date(log.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 italic font-medium">"{log.note}"</p>
                  <span className="text-[9px] text-slate-400 block mt-1 font-semibold uppercase tracking-wider">
                    Mood: {log.mood} | Energy: {log.energy_level}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
