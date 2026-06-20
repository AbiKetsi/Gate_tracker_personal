import React from 'react';
import { LayoutDashboard, CheckSquare, BarChart3, Activity, Settings as SettingsIcon, User } from 'lucide-react';

const navItems = [
  { id: 'dashboard', name: 'Home', icon: LayoutDashboard },
  { id: 'syllabus', name: 'Syllabus', icon: CheckSquare },
  { id: 'performance', name: 'Tests', icon: BarChart3 },
  { id: 'mood', name: 'Mood', icon: Activity },
  { id: 'profile', name: 'Profile', icon: User },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-brand-600 font-semibold'
                : 'text-slate-400 font-medium'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
            <span className="text-[10px] tracking-wide">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
