require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes (configured to allow typical development hosts like localhost:5173 or Vercel production domains)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
}));

app.use(express.json());

// Middleware to require and extract Device ID
const requireDevice = (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId || deviceId.trim() === '') {
    return res.status(400).json({ error: 'x-device-id header is required to scope data' });
  }
  req.deviceId = deviceId;
  next();
};

// Apply device scoping middleware to all /api routes
app.use('/api', requireDevice);

// Topics API
app.get('/api/topics', (req, res) => {
  try {
    const topics = db.getTopics(req.deviceId);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

app.post('/api/topics', (req, res) => {
  const { phase, week, title } = req.body;
  if (!phase || !week || !title) {
    return res.status(400).json({ error: 'phase, week, and title are required' });
  }
  try {
    const newTopic = db.addTopic(req.deviceId, phase, week, title);
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Error adding topic:', error);
    res.status(500).json({ error: 'Failed to add topic' });
  }
});

app.put('/api/topics/:id', (req, res) => {
  const { id } = req.params;
  const { status, title, phase, week, tick_date, checked } = req.body;
  try {
    let updated;
    if (tick_date !== undefined && checked !== undefined) {
      updated = db.toggleTopicTick(req.deviceId, id, tick_date, checked);
    } else {
      updated = db.updateTopic(req.deviceId, id, status, title, phase, week);
    }
    if (!updated) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

app.delete('/api/topics/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = db.deleteTopic(req.deviceId, id);
    if (!success) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    res.json({ message: 'Topic deleted successfully', id });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// Test Sessions API
app.get('/api/tests', (req, res) => {
  try {
    const tests = db.getTests(req.deviceId);
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

app.post('/api/tests', (req, res) => {
  const { date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct } = req.body;
  if (!date || !subject || !topic || marks_scored === undefined || !total_marks) {
    return res.status(400).json({ error: 'date, subject, topic, marks_scored, and total_marks are required' });
  }
  try {
    const newTest = db.addTest(req.deviceId, {
      date,
      subject,
      topic,
      marks_scored,
      total_marks,
      time_taken,
      questions_attempted,
      questions_correct
    });
    res.status(201).json(newTest);
  } catch (error) {
    console.error('Error logging test session:', error);
    res.status(500).json({ error: 'Failed to log test session' });
  }
});

// Mood Logs API
app.get('/api/moods', (req, res) => {
  try {
    const moods = db.getMoods(req.deviceId);
    res.json(moods);
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    res.status(500).json({ error: 'Failed to fetch mood logs' });
  }
});

app.post('/api/moods', (req, res) => {
  const { date, mood, energy_level, note } = req.body;
  if (!date || !mood || energy_level === undefined) {
    return res.status(400).json({ error: 'date, mood, and energy_level are required' });
  }
  try {
    const updatedMood = db.addOrUpdateMood(req.deviceId, { date, mood, energy_level, note });
    res.json(updatedMood);
  } catch (error) {
    console.error('Error saving mood log:', error);
    res.status(500).json({ error: 'Failed to save mood log' });
  }
});

// Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings(req.deviceId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  const { feb_exam_date } = req.body;
  if (!feb_exam_date) {
    return res.status(400).json({ error: 'feb_exam_date is required' });
  }
  try {
    const updatedSettings = db.updateSettings(req.deviceId, { feb_exam_date });
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Aptitude Logs API
app.get('/api/aptitude', (req, res) => {
  try {
    const logs = db.getAptitudeLogs(req.deviceId);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching aptitude logs:', error);
    res.status(500).json({ error: 'Failed to fetch aptitude logs' });
  }
});

app.post('/api/aptitude', (req, res) => {
  const { date, completed } = req.body;
  if (!date || completed === undefined) {
    return res.status(400).json({ error: 'date and completed are required' });
  }
  try {
    const log = db.upsertAptitudeLog(req.deviceId, date, completed);
    res.json(log);
  } catch (error) {
    console.error('Error saving aptitude log:', error);
    res.status(500).json({ error: 'Failed to save aptitude log' });
  }
});

// Export Data API
app.get('/api/export', (req, res) => {
  try {
    const backup = db.exportData(req.deviceId);
    res.json(backup);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Reset Data API
app.post('/api/reset', (req, res) => {
  try {
    db.resetAll(req.deviceId);
    res.json({ message: 'User data and progress reset successfully' });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`GATE Tracker API server running on port ${PORT}`);
});
