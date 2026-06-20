import React, { useState, useMemo } from 'react';
import { Calendar, Trash2, Edit, Plus, Download, AlertTriangle, RefreshCw, Check, X, Search, LogOut } from 'lucide-react';
import { api } from '../api';
import { supabase } from '../supabase';

export default function Settings({ 
  topics, 
  settings, 
  onUpdateSettings, 
  onAddTopic, 
  onUpdateTopic, 
  onDeleteTopic, 
  onResetAll 
}) {
  // Exam Date Config
  const [febDate, setFebDate] = useState(settings.feb_exam_date || '2027-02-07');
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Topic Form
  const [newPhase, setNewPhase] = useState('PHASE 1 — First Full Pass (Jun 23 – Aug 23)');
  const [newWeek, setNewWeek] = useState('Week 1 (Jun 23-29) — PDS Part 1');
  const [newTitle, setNewTitle] = useState('');

  // Editing Topic state
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editWeek, setEditWeek] = useState('');

  // Reset confirmation
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Search/Filter for topics editor
  const [searchQuery, setSearchQuery] = useState('');

  // Export data
  const [isExporting, setIsExporting] = useState(false);

  // Save target date
  const handleSaveDate = async (e) => {
    e.preventDefault();
    setIsSavingDate(true);
    try {
      await onUpdateSettings({ feb_exam_date: febDate });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDate(false);
    }
  };

  // Add custom topic
  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTopic({
      phase: newPhase,
      week: newWeek,
      title: newTitle.trim()
    });
    setNewTitle('');
  };

  // Edit topic submit
  const handleStartEdit = (topic) => {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
    setEditPhase(topic.phase);
    setEditWeek(topic.week);
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
  };

  const handleSaveEdit = (id) => {
    if (!editTitle.trim()) return;
    onUpdateTopic(id, {
      title: editTitle.trim(),
      phase: editPhase,
      week: editWeek
    });
    setEditingTopicId(null);
  };

  // Export JSON handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `gate_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset Handler
  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (resetConfirmInput.trim().toUpperCase() === 'RESET') {
      onResetAll();
      setShowResetModal(false);
      setResetConfirmInput('');
    } else {
      alert('Confirmation word does not match. Please type "RESET"');
    }
  };

  // Unique list of phases and weeks from existing topics to help populate dropdowns
  const uniquePhases = useMemo(() => {
    return Array.from(new Set(topics.map(t => t.phase)));
  }, [topics]);

  const uniqueWeeks = useMemo(() => {
    return Array.from(new Set(topics.map(t => t.week)));
  }, [topics]);

  // Filter topics for editing table
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;
    return topics.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.week.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phase.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topics, searchQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings & Customization</h2>
        <p className="text-slate-500 text-sm mt-0.5">Manage your exam targets, syllabus checklist, and backup data.</p>
      </div>

      {/* Target Date Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <Calendar size={17} className="text-brand-500" />
          <span>Config Target Exam Date</span>
        </h3>
        <form onSubmit={handleSaveDate} className="flex flex-col sm:flex-row sm:items-end gap-4 max-w-lg">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              GATE 2027 Date
            </label>
            <input
              type="date"
              value={febDate}
              onChange={(e) => setFebDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSavingDate}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 h-[42px] justify-center"
          >
            {saveSuccess ? (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Date</span>
            )}
          </button>
        </form>
      </div>

      {/* Backup and Wipe Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
              <Download size={17} className="text-brand-500" />
              <span>Export Study Data</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Backup all your syllabus checklists, mood logs, and test performance logs in a single JSON file. 
              You can keep this as a safe copy on your device.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            <span>Download JSON Backup</span>
          </button>
        </div>

        {/* Reset Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
              <AlertTriangle size={17} className="text-red-500" />
              <span>Reset Tracker Progress</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Permanently delete all custom topics, test logs, and mood logs, and reset all syllabus items back to "Not Started". 
              <strong>This action is irreversible.</strong>
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Reset All Progress</span>
          </button>
        </div>
      </div>

      {/* Syllabus Editor Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Plus size={18} className="text-brand-500" />
            <span>Syllabus Topic Editor</span>
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">Customize your prep checklist. Add new subjects, delete topics, or re-schedule Weeks.</p>
        </div>

        {/* Add Topic Form */}
        <form onSubmit={handleAddTopic} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Add Custom Topic</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phase</label>
              <select
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
              >
                {uniquePhases.map(ph => (
                  <option key={ph} value={ph}>{ph}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Week</label>
              <select
                value={newWeek}
                onChange={(e) => setNewWeek(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
              >
                {uniqueWeeks.map(wk => (
                  <option key={wk} value={wk}>{wk}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Topic Title</label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. Learn AVL Tree rotations or solve 2025 PYQs"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={13} />
                <span>Add Topic</span>
              </button>
            </div>
          </div>
        </form>

        {/* Search & List of Topics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modify Existing Topics ({filteredTopics.length})</h4>
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[11px] border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3 w-28 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px] font-medium text-slate-600">
                {filteredTopics.map((topic) => {
                  const isEditing = editingTopicId === topic.id;
                  return (
                    <tr key={topic.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1 font-medium text-xs focus:outline-none bg-white"
                          />
                        ) : (
                          <span className="font-semibold text-slate-700 block truncate max-w-[280px]" title={topic.title}>
                            {topic.title}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-medium block mt-0.5 truncate max-w-[280px]">
                          {isEditing ? (
                            <select
                              value={editPhase}
                              onChange={(e) => setEditPhase(e.target.value)}
                              className="text-[9px] border border-slate-200 rounded mr-2"
                            >
                              {uniquePhases.map(ph => (
                                <option key={ph} value={ph}>{ph}</option>
                              ))}
                            </select>
                          ) : (
                            topic.phase
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {isEditing ? (
                          <select
                            value={editWeek}
                            onChange={(e) => setEditWeek(e.target.value)}
                            className="text-[10px] border border-slate-200 rounded max-w-[150px]"
                          >
                            {uniqueWeeks.map(wk => (
                              <option key={wk} value={wk}>{wk}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="truncate max-w-[150px] block" title={topic.week}>
                            {topic.week}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 w-28 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(topic.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(topic)}
                              className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => onDeleteTopic(topic.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Account Section — Log Out */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
          <LogOut size={17} className="text-slate-500" />
          <span>Account</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">Sign out of your GATE Tracker account on this device.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Are you absolutely sure?</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  This will completely clear your performance error logs, daily check-ins, custom syllabus items, 
                  and reset all checkbox items to Not Started.
                </p>
              </div>
              
              <form onSubmit={handleResetSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Type "RESET" to confirm
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RESET"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    className="w-full text-center font-bold text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetConfirmInput('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm transition-colors"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
