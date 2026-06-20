require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client for token verification
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("WARNING: SUPABASE_URL and/or SUPABASE_ANON_KEY environment variables are missing!");
}
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Enable CORS for all routes (allows standard development hosts like localhost:5173 or cloud deployment endpoints)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
}));

app.use(express.json());

// Middleware to require and extract User ID from Supabase Authorization Token
const requireUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization bearer token is required to scope user data' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid, expired, or revoked authentication session' });
    }
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(500).json({ error: 'Failed to verify session token' });
  }
};

// Apply user scoping middleware to all /api routes
app.use('/api', requireUser);

// Topics API
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await db.getTopics(req.userId);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

app.post('/api/topics', async (req, res) => {
  const { phase, week, title } = req.body;
  if (!phase || !week || !title) {
    return res.status(400).json({ error: 'phase, week, and title are required' });
  }
  try {
    const newTopic = await db.addTopic(req.userId, phase, week, title);
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Error adding topic:', error);
    res.status(500).json({ error: 'Failed to add topic' });
  }
});

app.put('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  const { status, title, phase, week, tick_date, checked } = req.body;
  try {
    let updated;
    if (tick_date !== undefined && checked !== undefined) {
      updated = await db.toggleTopicTick(req.userId, id, tick_date, checked);
    } else {
      updated = await db.updateTopic(req.userId, id, status, title, phase, week);
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

app.delete('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteTopic(req.userId, id);
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
app.get('/api/tests', async (req, res) => {
  try {
    const tests = await db.getTests(req.userId);
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

app.post('/api/tests', async (req, res) => {
  const { date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct } = req.body;
  if (!date || !subject || !topic || marks_scored === undefined || !total_marks) {
    return res.status(400).json({ error: 'date, subject, topic, marks_scored, and total_marks are required' });
  }
  try {
    const newTest = await db.addTest(req.userId, {
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
app.get('/api/moods', async (req, res) => {
  try {
    const moods = await db.getMoods(req.userId);
    res.json(moods);
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    res.status(500).json({ error: 'Failed to fetch mood logs' });
  }
});

app.post('/api/moods', async (req, res) => {
  const { date, mood, energy_level, note } = req.body;
  if (!date || !mood || energy_level === undefined) {
    return res.status(400).json({ error: 'date, mood, and energy_level are required' });
  }
  try {
    const updatedMood = await db.addOrUpdateMood(req.userId, { date, mood, energy_level, note });
    res.json(updatedMood);
  } catch (error) {
    console.error('Error saving mood log:', error);
    res.status(500).json({ error: 'Failed to save mood log' });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings(req.userId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  const { feb_exam_date } = req.body;
  if (!feb_exam_date) {
    return res.status(400).json({ error: 'feb_exam_date is required' });
  }
  try {
    const updatedSettings = await db.updateSettings(req.userId, { feb_exam_date });
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Aptitude Logs API
app.get('/api/aptitude', async (req, res) => {
  try {
    const logs = await db.getAptitudeLogs(req.userId);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching aptitude logs:', error);
    res.status(500).json({ error: 'Failed to fetch aptitude logs' });
  }
});

app.post('/api/aptitude', async (req, res) => {
  const { date, completed } = req.body;
  if (!date || completed === undefined) {
    return res.status(400).json({ error: 'date and completed are required' });
  }
  try {
    const log = await db.upsertAptitudeLog(req.userId, date, completed);
    res.json(log);
  } catch (error) {
    console.error('Error saving aptitude log:', error);
    res.status(500).json({ error: 'Failed to save aptitude log' });
  }
});

// Export Data API
app.get('/api/export', async (req, res) => {
  try {
    const backup = await db.exportData(req.userId);
    res.json(backup);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Reset Data API
app.post('/api/reset', async (req, res) => {
  try {
    await db.resetAll(req.userId);
    res.json({ message: 'User data and progress reset successfully' });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// Initialize database schema and listen
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`GATE Tracker API server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
