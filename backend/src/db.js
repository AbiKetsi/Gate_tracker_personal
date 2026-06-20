const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { seedTopics } = require('./seedData');

// Ensure database directory exists
const dbPath = process.env.DATABASE_PATH || 'data/database.sqlite';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    week TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')) DEFAULT 'NOT_STARTED',
    done_timestamp TEXT DEFAULT NULL,
    UNIQUE(device_id, phase, week, title)
  );

  CREATE TABLE IF NOT EXISTS test_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    marks_scored REAL NOT NULL,
    total_marks REAL NOT NULL,
    time_taken INTEGER,
    questions_attempted INTEGER,
    questions_correct INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood TEXT CHECK(mood IN ('energized', 'okay', 'tired', 'stressed', 'burnt out')) NOT NULL,
    energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5) NOT NULL,
    note TEXT,
    UNIQUE(device_id, date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    device_id TEXT PRIMARY KEY,
    feb_exam_date TEXT DEFAULT '2027-02-07'
  );

  CREATE TABLE IF NOT EXISTS topic_ticks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    topic_id INTEGER NOT NULL,
    tick_date TEXT NOT NULL,
    UNIQUE(device_id, topic_id, tick_date),
    FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS aptitude_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    UNIQUE(device_id, date)
  );

`);

// Function to seed topics for a device ID if none exist
function seedTopicsForDevice(deviceId) {
  const checkCount = db.prepare('SELECT COUNT(*) as count FROM topics WHERE device_id = ?').get(deviceId);
  if (checkCount.count === 0) {
    console.log(`Seeding topics for device ID: ${deviceId}`);
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO topics (device_id, phase, week, title, status)
      VALUES (?, ?, ?, ?, 'NOT_STARTED')
    `);
    
    // Perform bulk inserts inside a transaction
    const insertMany = db.transaction((topicsList) => {
      for (const topic of topicsList) {
        insertStmt.run(deviceId, topic.phase, topic.week, topic.title);
      }
    });
    
    insertMany(seedTopics);
  }
}

// Helper methods
const dbHelpers = {
  // Topics API helpers
  getTopics(deviceId) {
    seedTopicsForDevice(deviceId);
    const topics = db.prepare('SELECT * FROM topics WHERE device_id = ?').all(deviceId);
    const ticks = db.prepare('SELECT * FROM topic_ticks WHERE device_id = ?').all(deviceId);
    
    const ticksMap = {};
    ticks.forEach(tick => {
      if (!ticksMap[tick.topic_id]) {
        ticksMap[tick.topic_id] = [];
      }
      ticksMap[tick.topic_id].push(tick.tick_date);
    });

    return topics.map(t => ({
      ...t,
      ticked_dates: ticksMap[t.id] || []
    }));
  },

  addTopic(deviceId, phase, week, title) {
    const info = db.prepare(`
      INSERT INTO topics (device_id, phase, week, title, status)
      VALUES (?, ?, ?, ?, 'NOT_STARTED')
    `).run(deviceId, phase, week, title);
    return { id: info.lastInsertRowid, device_id: deviceId, phase, week, title, status: 'NOT_STARTED', done_timestamp: null };
  },

  updateTopic(deviceId, id, status, title, phase, week) {
    // If status is transitioning to DONE, set the timestamp if it wasn't already set
    let doneTimestamp = null;
    if (status === 'DONE') {
      const existing = db.prepare('SELECT done_timestamp, status FROM topics WHERE id = ? AND device_id = ?').get(id, deviceId);
      if (existing && existing.status === 'DONE') {
        doneTimestamp = existing.done_timestamp || new Date().toISOString();
      } else {
        doneTimestamp = new Date().toISOString();
      }
    }

    // We allow updating status, title, phase, week (useful for syllabus editor)
    const updateStmt = db.prepare(`
      UPDATE topics
      SET status = COALESCE(?, status),
          done_timestamp = CASE WHEN ? = 'DONE' THEN COALESCE(?, done_timestamp) ELSE NULL END,
          title = COALESCE(?, title),
          phase = COALESCE(?, phase),
          week = COALESCE(?, week)
      WHERE id = ? AND device_id = ?
    `);
    updateStmt.run(status, status, doneTimestamp, title, phase, week, id, deviceId);
    
    return db.prepare('SELECT * FROM topics WHERE id = ? AND device_id = ?').get(id, deviceId);
  },

  deleteTopic(deviceId, id) {
    const info = db.prepare('DELETE FROM topics WHERE id = ? AND device_id = ?').run(id, deviceId);
    return info.changes > 0;
  },

  toggleTopicTick(deviceId, id, tickDate, checked) {
    if (checked) {
      db.prepare(`
        INSERT OR IGNORE INTO topic_ticks (device_id, topic_id, tick_date)
        VALUES (?, ?, ?)
      `).run(deviceId, id, tickDate);

      const nowStr = new Date().toISOString();
      db.prepare(`
        UPDATE topics
        SET status = 'DONE', done_timestamp = COALESCE(done_timestamp, ?)
        WHERE id = ? AND device_id = ?
      `).run(nowStr, id, deviceId);
    } else {
      db.prepare(`
        DELETE FROM topic_ticks
        WHERE device_id = ? AND topic_id = ? AND tick_date = ?
      `).run(deviceId, id, tickDate);

      const remain = db.prepare(`
        SELECT COUNT(*) as count FROM topic_ticks
        WHERE device_id = ? AND topic_id = ?
      `).get(deviceId, id);

      if (remain.count === 0) {
        db.prepare(`
          UPDATE topics
          SET status = 'NOT_STARTED', done_timestamp = NULL
          WHERE id = ? AND device_id = ?
        `).run(id, deviceId);
      }
    }

    const topic = db.prepare('SELECT * FROM topics WHERE id = ? AND device_id = ?').get(id, deviceId);
    if (!topic) return null;

    const ticks = db.prepare('SELECT tick_date FROM topic_ticks WHERE device_id = ? AND topic_id = ?').all(deviceId, id);
    topic.ticked_dates = ticks.map(tk => tk.tick_date);
    return topic;
  },

  // Test sessions API helpers
  getTests(deviceId) {
    return db.prepare('SELECT * FROM test_sessions WHERE device_id = ? ORDER BY date DESC, created_at DESC').all(deviceId);
  },

  addTest(deviceId, { date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct }) {
    const nowStr = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO test_sessions (
        device_id, date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      deviceId,
      date,
      subject,
      topic,
      parseFloat(marks_scored),
      parseFloat(total_marks),
      time_taken ? parseInt(time_taken, 10) : null,
      questions_attempted ? parseInt(questions_attempted, 10) : null,
      questions_correct ? parseInt(questions_correct, 10) : null,
      nowStr
    );

    return db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(info.lastInsertRowid);
  },

  // Mood logs API helpers
  getMoods(deviceId) {
    return db.prepare('SELECT * FROM mood_logs WHERE device_id = ? ORDER BY date ASC').all(deviceId);
  },

  addOrUpdateMood(deviceId, { date, mood, energy_level, note }) {
    db.prepare(`
      INSERT INTO mood_logs (device_id, date, mood, energy_level, note)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(device_id, date) DO UPDATE SET
        mood = excluded.mood,
        energy_level = excluded.energy_level,
        note = excluded.note
    `).run(deviceId, date, mood, parseInt(energy_level, 10), note || null);

    return db.prepare('SELECT * FROM mood_logs WHERE device_id = ? AND date = ?').get(deviceId, date);
  },

  // Settings API helpers
  getSettings(deviceId) {
    let settings = db.prepare('SELECT * FROM settings WHERE device_id = ?').get(deviceId);
    if (!settings) {
      db.prepare('INSERT INTO settings (device_id, feb_exam_date) VALUES (?, ?)').run(deviceId, '2027-02-07');
      settings = { device_id: deviceId, feb_exam_date: '2027-02-07' };
    }
    return settings;
  },

  updateSettings(deviceId, { feb_exam_date }) {
    db.prepare(`
      INSERT INTO settings (device_id, feb_exam_date)
      VALUES (?, ?)
      ON CONFLICT(device_id) DO UPDATE SET feb_exam_date = excluded.feb_exam_date
    `).run(deviceId, feb_exam_date);

    return { device_id: deviceId, feb_exam_date };
  },

  // Aptitude logs helpers
  getAptitudeLogs(deviceId) {
    return db.prepare(
      'SELECT * FROM aptitude_logs WHERE device_id = ? ORDER BY date ASC'
    ).all(deviceId);
  },

  upsertAptitudeLog(deviceId, date, completed) {
    db.prepare(`
      INSERT INTO aptitude_logs (device_id, date, completed)
      VALUES (?, ?, ?)
      ON CONFLICT(device_id, date) DO UPDATE SET completed = excluded.completed
    `).run(deviceId, date, completed ? 1 : 0);
    return db.prepare(
      'SELECT * FROM aptitude_logs WHERE device_id = ? AND date = ?'
    ).get(deviceId, date);
  },

  // Reset database for a device ID
  resetAll(deviceId) {
    // Delete test sessions
    db.prepare('DELETE FROM test_sessions WHERE device_id = ?').run(deviceId);
    // Delete mood logs
    db.prepare('DELETE FROM mood_logs WHERE device_id = ?').run(deviceId);
    // Delete aptitude logs
    db.prepare('DELETE FROM aptitude_logs WHERE device_id = ?').run(deviceId);
    // Reset settings to default
    db.prepare('DELETE FROM settings WHERE device_id = ?').run(deviceId);
    db.prepare('INSERT INTO settings (device_id, feb_exam_date) VALUES (?, ?)').run(deviceId, '2027-02-07');
    // Wipe and re-seed default topics list
    db.prepare('DELETE FROM topic_ticks WHERE device_id = ?').run(deviceId);
    db.prepare('DELETE FROM topics WHERE device_id = ?').run(deviceId);
    seedTopicsForDevice(deviceId);
    return true;
  },

  // Export all data
  exportData(deviceId) {
    seedTopicsForDevice(deviceId);
    const topics = this.getTopics(deviceId);
    const ticks = db.prepare('SELECT * FROM topic_ticks WHERE device_id = ?').all(deviceId);
    const tests = db.prepare('SELECT * FROM test_sessions WHERE device_id = ? ORDER BY date DESC').all(deviceId);
    const moods = db.prepare('SELECT * FROM mood_logs WHERE device_id = ? ORDER BY date ASC').all(deviceId);
    const aptitude = this.getAptitudeLogs(deviceId);
    const settings = this.getSettings(deviceId);

    return {
      deviceId,
      topics,
      ticks,
      tests,
      moods,
      aptitude,
      settings
    };
  }
};

module.exports = dbHelpers;
