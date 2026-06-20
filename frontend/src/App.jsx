import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import Performance from './pages/Performance';
import Mood from './pages/Mood';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { api } from './api';
import { supabase } from './supabase';
import { AlertCircle, RefreshCw, GraduationCap, ServerCrash, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth States
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  // Data States
  const [topics, setTopics] = useState([]);
  const [tests, setTests] = useState([]);
  const [moods, setMoods] = useState([]);
  const [aptitude, setAptitude] = useState([]);
  const [settings, setSettings] = useState({ feb_exam_date: '2027-02-07' });

  // App States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Auth: Listen for session changes ─────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setAuthLoading(false);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Data: Fetch all data when user logs in ────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      // Clear data on logout
      setTopics([]);
      setTests([]);
      setMoods([]);
      setAptitude([]);
      setSettings({ feb_exam_date: '2027-02-07' });
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [topicsData, testsData, moodsData, settingsData, aptitudeData] = await Promise.all([
        api.getTopics(),
        api.getTests(),
        api.getMoods(),
        api.getSettings(),
        api.getAptitude()
      ]);
      setTopics(topicsData);
      setTests(testsData);
      setMoods(moodsData);
      setSettings(settingsData);
      setAptitude(aptitudeData);
      setError(null);
    } catch (err) {
      console.error('API connection failed:', err);
      setError('Could not connect to GATE Tracker API server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Topic Handlers ────────────────────────────────────────────────────────
  const handleToggleTopic = async (topic) => {
    let nextStatus = 'NOT_STARTED';
    if (topic.status === 'NOT_STARTED') nextStatus = 'IN_PROGRESS';
    else if (topic.status === 'IN_PROGRESS') nextStatus = 'DONE';

    const prevTopics = [...topics];
    setTopics(prev => prev.map(t =>
      t.id === topic.id
        ? { ...t, status: nextStatus, done_timestamp: nextStatus === 'DONE' ? new Date().toISOString() : null }
        : t
    ));

    try {
      const updated = await api.updateTopic(topic.id, { status: nextStatus });
      setTopics(prev => prev.map(t => t.id === topic.id ? updated : t));
    } catch (err) {
      console.error(err);
      setTopics(prevTopics);
    }
  };

  const handleTickTopic = async (topic, tickDate, checked) => {
    const prevTopics = [...topics];
    setTopics(prev => prev.map(t => {
      if (t.id !== topic.id) return t;
      const existingTicks = t.ticked_dates || [];
      const newTicks = checked
        ? [...new Set([...existingTicks, tickDate])]
        : existingTicks.filter(d => d !== tickDate);
      const newStatus = newTicks.length > 0 ? 'DONE' : 'NOT_STARTED';
      return { ...t, ticked_dates: newTicks, status: newStatus };
    }));

    try {
      const updated = await api.updateTopic(topic.id, { tick_date: tickDate, checked });
      setTopics(prev => prev.map(t => {
        if (t.id !== topic.id) return t;
        return { ...t, ...updated, ticked_dates: updated.ticked_dates || t.ticked_dates };
      }));
    } catch (err) {
      console.error(err);
      setTopics(prevTopics);
    }
  };

  const handleAddTopic = async (topicData) => {
    try {
      const newTopic = await api.addTopic(topicData);
      setTopics(prev => [...prev, { ...newTopic, ticked_dates: [] }]);
    } catch (err) {
      alert('Failed to add topic: ' + err.message);
    }
  };

  const handleUpdateTopic = async (id, updates) => {
    try {
      const updated = await api.updateTopic(id, updates);
      setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updated, ticked_dates: t.ticked_dates } : t));
    } catch (err) {
      alert('Failed to update topic: ' + err.message);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      await api.deleteTopic(id);
      setTopics(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete topic: ' + err.message);
    }
  };

  // ── Test, Mood, Settings, Aptitude Handlers ───────────────────────────────
  const handleLogTest = async (testData) => {
    try {
      const newTest = await api.addTest(testData);
      setTests(prev => [newTest, ...prev]);
    } catch (err) {
      alert('Failed to log test: ' + err.message);
    }
  };

  const handleLogMood = async (moodData) => {
    try {
      const updatedMood = await api.addMood(moodData);
      setMoods(prev => {
        const index = prev.findIndex(m => m.date === moodData.date);
        if (index > -1) {
          const newMoods = [...prev];
          newMoods[index] = updatedMood;
          return newMoods;
        }
        return [...prev, updatedMood];
      });
    } catch (err) {
      alert('Failed to save mood log: ' + err.message);
    }
  };

  const handleUpdateSettings = async (settingsData) => {
    try {
      const updated = await api.updateSettings(settingsData);
      setSettings(updated);
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    }
  };

  const handleLogAptitude = async (date, completed) => {
    const prev = [...aptitude];
    setAptitude(prevLogs => {
      const idx = prevLogs.findIndex(l => l.date === date);
      const newLog = { date, completed: completed ? 1 : 0 };
      if (idx > -1) {
        const updated = [...prevLogs];
        updated[idx] = { ...updated[idx], ...newLog };
        return updated;
      }
      return [...prevLogs, newLog];
    });
    try {
      const updated = await api.logAptitude({ date, completed });
      setAptitude(prevLogs => {
        const idx = prevLogs.findIndex(l => l.date === date);
        if (idx > -1) {
          const newLogs = [...prevLogs];
          newLogs[idx] = updated;
          return newLogs;
        }
        return [...prevLogs, updated];
      });
    } catch (err) {
      console.error('Failed to save aptitude log:', err);
      setAptitude(prev);
    }
  };

  const handleResetAll = async () => {
    try {
      await api.resetData();
      await fetchAllData();
      alert('Reset complete. Start fresh!');
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  // ── Auth Loading Screen ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-sm font-semibold">Loading GATE Tracker...</p>
        </div>
      </div>
    );
  }

  // ── Auth Gate: Show Login/SignUp if not authenticated ─────────────────────
  if (!session) {
    if (authView === 'signup') {
      return <SignUp onLoginClick={() => setAuthView('login')} />;
    }
    return <Login onSignUpClick={() => setAuthView('signup')} />;
  }

  // ── Main Application ──────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            topics={topics}
            tests={tests}
            moods={moods}
            settings={settings}
            aptitude={aptitude}
            setActiveTab={setActiveTab}
            onToggleTopic={handleToggleTopic}
            onLogAptitude={handleLogAptitude}
          />
        );
      case 'syllabus':
        return (
          <Syllabus
            topics={topics}
            onTickTopic={handleTickTopic}
            loading={loading}
          />
        );
      case 'profile':
        return (
          <Profile
            topics={topics}
            tests={tests}
            moods={moods}
            user={user}
          />
        );
      case 'performance':
        return (
          <Performance
            tests={tests}
            aptitude={aptitude}
            onLogTest={handleLogTest}
          />
        );
      case 'mood':
        return (
          <Mood
            moods={moods}
            onLogMood={handleLogMood}
          />
        );
      case 'settings':
        return (
          <Settings
            topics={topics}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onAddTopic={handleAddTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onResetAll={handleResetAll}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-400">Page not found</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc]">
      {/* Sidebar navigation on Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-6">
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 md:sticky md:top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
              <GraduationCap size={18} className="stroke-[2.5]" />
            </div>
            <h1 className="font-bold text-slate-800 text-base leading-none">GATE Tracker</h1>
          </div>
          <div className="hidden md:block text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Preparation Companion
          </div>

          <div className="flex items-center gap-3">
            {/* Logged-in user chip */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
              {user?.user_metadata?.username || user?.email?.split('@')[0]}
            </span>
            {error && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                <ServerCrash size={13} />
                <span>Offline</span>
              </span>
            )}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Refresh all data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </header>

        {/* Dynamic content view */}
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-2.5 text-red-600 text-xs md:text-sm mb-6">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <span className="font-bold">Sync Error:</span> {error}
              </div>
              <button
                onClick={fetchAllData}
                className="bg-white px-2.5 py-1 rounded-lg border border-red-200 text-[10px] font-bold text-red-700 hover:bg-red-50"
              >
                Retry Connection
              </button>
            </div>
          )}

          {loading && topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <RefreshCw size={32} className="animate-spin text-brand-500 mb-4 stroke-[1.5]" />
              <p className="text-sm font-semibold">Connecting & fetching data...</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>

      {/* Floating Bottom Nav on Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
