const { Pool } = require('pg');
const { seedTopics } = require('./seedData');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined!");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      week TEXT NOT NULL,
      title TEXT NOT NULL,
      status VARCHAR(20) CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')) DEFAULT 'NOT_STARTED',
      done_timestamp TEXT DEFAULT NULL,
      UNIQUE(device_id, phase, week, title)
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mood VARCHAR(20) CHECK(mood IN ('energized', 'okay', 'tired', 'stressed', 'burnt out')) NOT NULL,
      energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5) NOT NULL,
      note TEXT,
      UNIQUE(device_id, date)
    );

    CREATE TABLE IF NOT EXISTS settings (
      device_id TEXT PRIMARY KEY,
      feb_exam_date TEXT DEFAULT '2027-02-07'
    );

    CREATE TABLE IF NOT EXISTS topic_ticks (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      tick_date TEXT NOT NULL,
      UNIQUE(device_id, topic_id, tick_date),
      FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS aptitude_logs (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(device_id, date)
    );
  `);
  console.log("PostgreSQL database tables initialized successfully.");
}

async function seedTopicsForDevice(deviceId) {
  const checkCount = await pool.query('SELECT COUNT(*) as count FROM topics WHERE device_id = $1', [deviceId]);
  if (parseInt(checkCount.rows[0].count, 10) === 0) {
    console.log(`Seeding topics for device ID: ${deviceId}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const topic of seedTopics) {
        await client.query(`
          INSERT INTO topics (device_id, phase, week, title, status)
          VALUES ($1, $2, $3, $4, 'NOT_STARTED')
          ON CONFLICT (device_id, phase, week, title) DO NOTHING
        `, [deviceId, topic.phase, topic.week, topic.title]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

const dbHelpers = {
  // Topics API helpers
  async getTopics(deviceId) {
    await seedTopicsForDevice(deviceId);
    const topicsRes = await pool.query('SELECT * FROM topics WHERE device_id = $1', [deviceId]);
    const ticksRes = await pool.query('SELECT * FROM topic_ticks WHERE device_id = $1', [deviceId]);
    
    const ticksMap = {};
    ticksRes.rows.forEach(tick => {
      if (!ticksMap[tick.topic_id]) {
        ticksMap[tick.topic_id] = [];
      }
      ticksMap[tick.topic_id].push(tick.tick_date);
    });

    return topicsRes.rows.map(t => ({
      ...t,
      ticked_dates: ticksMap[t.id] || []
    }));
  },

  async addTopic(deviceId, phase, week, title) {
    const res = await pool.query(`
      INSERT INTO topics (device_id, phase, week, title, status)
      VALUES ($1, $2, $3, $4, 'NOT_STARTED')
      RETURNING id
    `, [deviceId, phase, week, title]);
    return { 
      id: res.rows[0].id, 
      device_id: deviceId, 
      phase, 
      week, 
      title, 
      status: 'NOT_STARTED', 
      done_timestamp: null 
    };
  },

  async updateTopic(deviceId, id, status, title, phase, week) {
    let doneTimestamp = null;
    if (status === 'DONE') {
      const existingRes = await pool.query('SELECT done_timestamp, status FROM topics WHERE id = $1 AND device_id = $2', [parseInt(id, 10), deviceId]);
      const existing = existingRes.rows[0];
      if (existing && existing.status === 'DONE') {
        doneTimestamp = existing.done_timestamp || new Date().toISOString();
      } else {
        doneTimestamp = new Date().toISOString();
      }
    }

    await pool.query(`
      UPDATE topics
      SET status = COALESCE($1, status),
          done_timestamp = CASE WHEN $2 = 'DONE' THEN COALESCE($3, done_timestamp) ELSE NULL END,
          title = COALESCE($4, title),
          phase = COALESCE($5, phase),
          week = COALESCE($6, week)
      WHERE id = $7 AND device_id = $8
    `, [status, status, doneTimestamp, title, phase, week, parseInt(id, 10), deviceId]);
    
    const res = await pool.query('SELECT * FROM topics WHERE id = $1 AND device_id = $2', [parseInt(id, 10), deviceId]);
    return res.rows[0];
  },

  async deleteTopic(deviceId, id) {
    const res = await pool.query('DELETE FROM topics WHERE id = $1 AND device_id = $2', [parseInt(id, 10), deviceId]);
    return res.rowCount > 0;
  },

  async toggleTopicTick(deviceId, id, tickDate, checked) {
    const topicId = parseInt(id, 10);
    if (checked) {
      await pool.query(`
        INSERT INTO topic_ticks (device_id, topic_id, tick_date)
        VALUES ($1, $2, $3)
        ON CONFLICT (device_id, topic_id, tick_date) DO NOTHING
      `, [deviceId, topicId, tickDate]);

      const nowStr = new Date().toISOString();
      await pool.query(`
        UPDATE topics
        SET status = 'DONE', done_timestamp = COALESCE(done_timestamp, $1)
        WHERE id = $2 AND device_id = $3
      `, [nowStr, topicId, deviceId]);
    } else {
      await pool.query(`
        DELETE FROM topic_ticks
        WHERE device_id = $1 AND topic_id = $2 AND tick_date = $3
      `, [deviceId, topicId, tickDate]);

      const remainRes = await pool.query(`
        SELECT COUNT(*) as count FROM topic_ticks
        WHERE device_id = $1 AND topic_id = $2
      `, [deviceId, topicId]);
      const count = parseInt(remainRes.rows[0].count, 10);

      if (count === 0) {
        await pool.query(`
          UPDATE topics
          SET status = 'NOT_STARTED', done_timestamp = NULL
          WHERE id = $1 AND device_id = $2
        `, [topicId, deviceId]);
      }
    }

    const topicRes = await pool.query('SELECT * FROM topics WHERE id = $1 AND device_id = $2', [topicId, deviceId]);
    const topic = topicRes.rows[0];
    if (!topic) return null;

    const ticksRes = await pool.query('SELECT tick_date FROM topic_ticks WHERE device_id = $1 AND topic_id = $2', [deviceId, topicId]);
    topic.ticked_dates = ticksRes.rows.map(tk => tk.tick_date);
    return topic;
  },

  // Test sessions API helpers
  async getTests(deviceId) {
    const res = await pool.query('SELECT * FROM test_sessions WHERE device_id = $1 ORDER BY date DESC, created_at DESC', [deviceId]);
    return res.rows;
  },

  async addTest(deviceId, { date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct }) {
    const nowStr = new Date().toISOString();
    const res = await pool.query(`
      INSERT INTO test_sessions (
        device_id, date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
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
    ]);
    return res.rows[0];
  },

  // Mood logs API helpers
  async getMoods(deviceId) {
    const res = await pool.query('SELECT * FROM mood_logs WHERE device_id = $1 ORDER BY date ASC', [deviceId]);
    return res.rows;
  },

  async addOrUpdateMood(deviceId, { date, mood, energy_level, note }) {
    await pool.query(`
      INSERT INTO mood_logs (device_id, date, mood, energy_level, note)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(device_id, date) DO UPDATE SET
        mood = EXCLUDED.mood,
        energy_level = EXCLUDED.energy_level,
        note = EXCLUDED.note
    `, [deviceId, date, mood, parseInt(energy_level, 10), note || null]);

    const res = await pool.query('SELECT * FROM mood_logs WHERE device_id = $1 AND date = $2', [deviceId, date]);
    return res.rows[0];
  },

  // Settings API helpers
  async getSettings(deviceId) {
    const res = await pool.query('SELECT * FROM settings WHERE device_id = $1', [deviceId]);
    let settings = res.rows[0];
    if (!settings) {
      await pool.query('INSERT INTO settings (device_id, feb_exam_date) VALUES ($1, $2) ON CONFLICT DO NOTHING', [deviceId, '2027-02-07']);
      settings = { device_id: deviceId, feb_exam_date: '2027-02-07' };
    }
    return settings;
  },

  async updateSettings(deviceId, { feb_exam_date }) {
    await pool.query(`
      INSERT INTO settings (device_id, feb_exam_date)
      VALUES ($1, $2)
      ON CONFLICT(device_id) DO UPDATE SET feb_exam_date = EXCLUDED.feb_exam_date
    `, [deviceId, feb_exam_date]);

    return { device_id: deviceId, feb_exam_date };
  },

  // Aptitude logs helpers
  async getAptitudeLogs(deviceId) {
    const res = await pool.query(
      'SELECT * FROM aptitude_logs WHERE device_id = $1 ORDER BY date ASC',
      [deviceId]
    );
    return res.rows;
  },

  async upsertAptitudeLog(deviceId, date, completed) {
    await pool.query(`
      INSERT INTO aptitude_logs (device_id, date, completed)
      VALUES ($1, $2, $3)
      ON CONFLICT(device_id, date) DO UPDATE SET completed = EXCLUDED.completed
    `, [deviceId, date, completed ? 1 : 0]);
    
    const res = await pool.query(
      'SELECT * FROM aptitude_logs WHERE device_id = $1 AND date = $2',
      [deviceId, date]
    );
    return res.rows[0];
  },

  // Reset database for a device ID
  async resetAll(deviceId) {
    await pool.query('DELETE FROM test_sessions WHERE device_id = $1', [deviceId]);
    await pool.query('DELETE FROM mood_logs WHERE device_id = $1', [deviceId]);
    await pool.query('DELETE FROM aptitude_logs WHERE device_id = $1', [deviceId]);
    await pool.query('DELETE FROM settings WHERE device_id = $1', [deviceId]);
    await pool.query('INSERT INTO settings (device_id, feb_exam_date) VALUES ($1, $2) ON CONFLICT DO NOTHING', [deviceId, '2027-02-07']);
    await pool.query('DELETE FROM topic_ticks WHERE device_id = $1', [deviceId]);
    await pool.query('DELETE FROM topics WHERE device_id = $1', [deviceId]);
    await seedTopicsForDevice(deviceId);
    return true;
  },

  // Export all data
  async exportData(deviceId) {
    await seedTopicsForDevice(deviceId);
    const topics = await this.getTopics(deviceId);
    const ticksRes = await pool.query('SELECT * FROM topic_ticks WHERE device_id = $1', [deviceId]);
    const testsRes = await pool.query('SELECT * FROM test_sessions WHERE device_id = $1 ORDER BY date DESC', [deviceId]);
    const moodsRes = await pool.query('SELECT * FROM mood_logs WHERE device_id = $1 ORDER BY date ASC', [deviceId]);
    const aptitude = await this.getAptitudeLogs(deviceId);
    const settings = await this.getSettings(deviceId);

    return {
      deviceId,
      topics,
      ticks: ticksRes.rows,
      tests: testsRes.rows,
      moods: moodsRes.rows,
      aptitude,
      settings
    };
  }
};

module.exports = {
  pool,
  initDb,
  ...dbHelpers
};
