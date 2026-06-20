import React from 'react';
import { LayoutDashboard, CheckSquare, BarChart3, Activity, Settings as SettingsIcon, GraduationCap, User } from 'lucide-react';
import { getOrCreateDeviceId } from '../api';

const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'syllabus', name: 'Syllabus', icon: CheckSquare },
  { id: 'performance', name: 'Performance', icon: BarChart3 },
  { id: 'mood', name: 'Mood & Energy', icon: Activity },
  { id: 'settings', name: 'Settings', icon: SettingsIcon },
  { id: 'profile', name: 'Profile', icon: User },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const deviceId = getOrCreateDeviceId();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0">
      {/* Brand logo & header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
          <GraduationCap size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-800 text-lg leading-tight">GATE Tracker</h1>
          <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Class of 2027</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/10 text-brand-700 shadow-sm shadow-brand-500/5'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer / Device info */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">
          Active Session
        </div>
        <div className="text-xs text-slate-600 font-mono truncate select-all cursor-help" title={deviceId}>
          {deviceId}
        </div>
      </div>
    </aside>
  );
}
