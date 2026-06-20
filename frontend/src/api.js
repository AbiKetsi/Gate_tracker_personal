// Get or generate a unique device ID for the user
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('gate_tracker_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('gate_tracker_device_id', deviceId);
  }
  return deviceId;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function fetchJson(endpoint, options = {}) {
  const deviceId = getOrCreateDeviceId();
  
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Topics API
  getTopics: () => fetchJson('/api/topics'),
  addTopic: (topic) => fetchJson('/api/topics', {
    method: 'POST',
    body: JSON.stringify(topic)
  }),
  updateTopic: (id, updates) => fetchJson(`/api/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteTopic: (id) => fetchJson(`/api/topics/${id}`, {
    method: 'DELETE'
  }),

  // Test sessions API
  getTests: () => fetchJson('/api/tests'),
  addTest: (testData) => fetchJson('/api/tests', {
    method: 'POST',
    body: JSON.stringify(testData)
  }),

  // Mood logs API
  getMoods: () => fetchJson('/api/moods'),
  addMood: (moodData) => fetchJson('/api/moods', {
    method: 'POST',
    body: JSON.stringify(moodData)
  }),

  // Settings API
  getSettings: () => fetchJson('/api/settings'),
  updateSettings: (settingsData) => fetchJson('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settingsData)
  }),

  // Export and reset
  exportData: () => fetchJson('/api/export'),
  resetData: () => fetchJson('/api/reset', {
    method: 'POST'
  }),

  // Aptitude logs
  getAptitude: () => fetchJson('/api/aptitude'),
  logAptitude: (data) => fetchJson('/api/aptitude', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
