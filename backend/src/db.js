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
  // Check if legacy "topics" table exists and needs migration (if it has "device_id")
  try {
    const checkTable = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'topics' AND column_name = 'device_id'
    `);
    
    if (checkTable.rowCount > 0) {
      console.log("Detected legacy SQLite-style tables. Performing database migration (dropping old tables)...");
      await pool.query(`
        DROP TABLE IF EXISTS topic_ticks CASCADE;
        DROP TABLE IF EXISTS user_topic_progress CASCADE;
        DROP TABLE IF EXISTS topics CASCADE;
        DROP TABLE IF EXISTS test_sessions CASCADE;
        DROP TABLE IF EXISTS mood_logs CASCADE;
        DROP TABLE IF EXISTS settings CASCADE;
        DROP TABLE IF EXISTS aptitude_logs CASCADE;
      `);
    }
  } catch (err) {
    console.error("Migration check error (this is normal if table doesn't exist yet):", err.message);
  }

  // Create tables using postgresql schemas
  await pool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      phase TEXT NOT NULL,
      week TEXT NOT NULL,
      title TEXT NOT NULL,
      UNIQUE(phase, week, title)
    );

    CREATE TABLE IF NOT EXISTS user_topic_progress (
      user_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      status VARCHAR(20) CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')) DEFAULT 'NOT_STARTED',
      done_timestamp TEXT DEFAULT NULL,
      PRIMARY KEY(user_id, topic_id)
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
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
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mood VARCHAR(20) CHECK(mood IN ('energized', 'okay', 'tired', 'stressed', 'burnt out')) NOT NULL,
      energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5) NOT NULL,
      note TEXT,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY,
      feb_exam_date TEXT DEFAULT '2027-02-07'
    );

    CREATE TABLE IF NOT EXISTS topic_ticks (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      tick_date TEXT NOT NULL,
      UNIQUE(user_id, topic_id, tick_date)
    );

    CREATE TABLE IF NOT EXISTS aptitude_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );
  `);

  // Seed global topics if they don't exist
  const res = await pool.query('SELECT COUNT(*) as count FROM topics');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log("Seeding global topics template...");
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const topic of seedTopics) {
        await client.query(`
          INSERT INTO topics (phase, week, title)
          VALUES ($1, $2, $3)
          ON CONFLICT (phase, week, title) DO NOTHING
        `, [topic.phase, topic.week, topic.title]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  console.log("PostgreSQL database tables initialized successfully.");
}

async function ensureUserSettings(userId) {
  const check = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
  if (check.rowCount === 0) {
    await pool.query('INSERT INTO settings (user_id, feb_exam_date) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, '2027-02-07']);
  }
}

const dbHelpers = {
  // Topics API helpers
  async getTopics(userId) {
    await ensureUserSettings(userId);
    const topicsRes = await pool.query('SELECT * FROM topics ORDER BY id ASC');
    const progressRes = await pool.query('SELECT * FROM user_topic_progress WHERE user_id = $1', [userId]);
    const ticksRes = await pool.query('SELECT * FROM topic_ticks WHERE user_id = $1', [userId]);
    
    const progressMap = {};
    progressRes.rows.forEach(p => {
      progressMap[p.topic_id] = {
        status: p.status,
        done_timestamp: p.done_timestamp
      };
    });

    const ticksMap = {};
    ticksRes.rows.forEach(tick => {
      if (!ticksMap[tick.topic_id]) {
        ticksMap[tick.topic_id] = [];
      }
      ticksMap[tick.topic_id].push(tick.tick_date);
    });

    return topicsRes.rows.map(t => {
      const prog = progressMap[t.id] || { status: 'NOT_STARTED', done_timestamp: null };
      return {
        ...t,
        status: prog.status,
        done_timestamp: prog.done_timestamp,
        ticked_dates: ticksMap[t.id] || []
      };
    });
  },

  async addTopic(userId, phase, week, title) {
    const res = await pool.query(`
      INSERT INTO topics (phase, week, title)
      VALUES ($1, $2, $3)
      ON CONFLICT (phase, week, title) DO UPDATE SET phase = EXCLUDED.phase
      RETURNING id
    `, [phase, week, title]);
    
    const topicId = res.rows[0].id;
    await pool.query(`
      INSERT INTO user_topic_progress (user_id, topic_id, status)
      VALUES ($1, $2, 'NOT_STARTED')
      ON CONFLICT (user_id, topic_id) DO NOTHING
    `, [userId, topicId]);

    return { 
      id: topicId, 
      phase, 
      week, 
      title, 
      status: 'NOT_STARTED', 
      done_timestamp: null 
    };
  },

  async updateTopic(userId, id, status, title, phase, week) {
    const topicId = parseInt(id, 10);
    
    if (title || phase || week) {
      await pool.query(`
        UPDATE topics
        SET title = COALESCE($1, title),
            phase = COALESCE($2, phase),
            week = COALESCE($3, week)
        WHERE id = $4
      `, [title, phase, week, topicId]);
    }

    if (status) {
      let doneTimestamp = null;
      if (status === 'DONE') {
        const existingRes = await pool.query('SELECT done_timestamp, status FROM user_topic_progress WHERE topic_id = $1 AND user_id = $2', [topicId, userId]);
        const existing = existingRes.rows[0];
        if (existing && existing.status === 'DONE') {
          doneTimestamp = existing.done_timestamp || new Date().toISOString();
        } else {
          doneTimestamp = new Date().toISOString();
        }
      }

      await pool.query(`
        INSERT INTO user_topic_progress (user_id, topic_id, status, done_timestamp)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, topic_id) DO UPDATE SET
          status = EXCLUDED.status,
          done_timestamp = CASE WHEN EXCLUDED.status = 'DONE' THEN COALESCE(EXCLUDED.done_timestamp, user_topic_progress.done_timestamp) ELSE NULL END
      `, [userId, topicId, status, doneTimestamp]);
    }
    
    const topics = await this.getTopics(userId);
    return topics.find(t => t.id === topicId) || null;
  },

  async deleteTopic(userId, id) {
    const res = await pool.query('DELETE FROM topics WHERE id = $1', [parseInt(id, 10)]);
    return res.rowCount > 0;
  },

  async toggleTopicTick(userId, id, tickDate, checked) {
    const topicId = parseInt(id, 10);
    if (checked) {
      await pool.query(`
        INSERT INTO topic_ticks (user_id, topic_id, tick_date)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, topic_id, tick_date) DO NOTHING
      `, [userId, topicId, tickDate]);

      const nowStr = new Date().toISOString();
      await pool.query(`
        INSERT INTO user_topic_progress (user_id, topic_id, status, done_timestamp)
        VALUES ($1, $2, 'DONE', $3)
        ON CONFLICT (user_id, topic_id) DO UPDATE SET
          status = 'DONE',
          done_timestamp = COALESCE(user_topic_progress.done_timestamp, EXCLUDED.done_timestamp)
      `, [userId, topicId, nowStr]);
    } else {
      await pool.query(`
        DELETE FROM topic_ticks
        WHERE user_id = $1 AND topic_id = $2 AND tick_date = $3
      `, [userId, topicId, tickDate]);

      const remainRes = await pool.query(`
        SELECT COUNT(*) as count FROM topic_ticks
        WHERE user_id = $1 AND topic_id = $2
      `, [userId, topicId]);
      const count = parseInt(remainRes.rows[0].count, 10);

      if (count === 0) {
        await pool.query(`
          INSERT INTO user_topic_progress (user_id, topic_id, status, done_timestamp)
          VALUES ($1, $2, 'NOT_STARTED', NULL)
          ON CONFLICT (user_id, topic_id) DO UPDATE SET
            status = 'NOT_STARTED',
            done_timestamp = NULL
        `, [userId, topicId]);
      }
    }

    const topics = await this.getTopics(userId);
    return topics.find(t => t.id === topicId) || null;
  },

  // Test sessions API helpers
  async getTests(userId) {
    const res = await pool.query('SELECT * FROM test_sessions WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [userId]);
    return res.rows;
  },

  async addTest(userId, { date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct }) {
    const nowStr = new Date().toISOString();
    const res = await pool.query(`
      INSERT INTO test_sessions (
        user_id, date, subject, topic, marks_scored, total_marks, time_taken, questions_attempted, questions_correct, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      userId,
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
  async getMoods(userId) {
    const res = await pool.query('SELECT * FROM mood_logs WHERE user_id = $1 ORDER BY date ASC', [userId]);
    return res.rows;
  },

  async addOrUpdateMood(userId, { date, mood, energy_level, note }) {
    await pool.query(`
      INSERT INTO mood_logs (user_id, date, mood, energy_level, note)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(user_id, date) DO UPDATE SET
        mood = EXCLUDED.mood,
        energy_level = EXCLUDED.energy_level,
        note = EXCLUDED.note
    `, [userId, date, mood, parseInt(energy_level, 10), note || null]);

    const res = await pool.query('SELECT * FROM mood_logs WHERE user_id = $1 AND date = $2', [userId, date]);
    return res.rows[0];
  },

  // Settings API helpers
  async getSettings(userId) {
    await ensureUserSettings(userId);
    const res = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
    return res.rows[0];
  },

  async updateSettings(userId, { feb_exam_date }) {
    await pool.query(`
      INSERT INTO settings (user_id, feb_exam_date)
      VALUES ($1, $2)
      ON CONFLICT(user_id) DO UPDATE SET feb_exam_date = EXCLUDED.feb_exam_date
    `, [userId, feb_exam_date]);

    return { user_id: userId, feb_exam_date };
  },

  // Aptitude logs helpers
  async getAptitudeLogs(userId) {
    const res = await pool.query(
      'SELECT * FROM aptitude_logs WHERE user_id = $1 ORDER BY date ASC',
      [userId]
    );
    return res.rows;
  },

  async upsertAptitudeLog(userId, date, completed) {
    await pool.query(`
      INSERT INTO aptitude_logs (user_id, date, completed)
      VALUES ($1, $2, $3)
      ON CONFLICT(user_id, date) DO UPDATE SET completed = EXCLUDED.completed
    `, [userId, date, completed ? 1 : 0]);
    
    const res = await pool.query(
      'SELECT * FROM aptitude_logs WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    return res.rows[0];
  },

  // Reset database for a user ID
  async resetAll(userId) {
    await pool.query('DELETE FROM test_sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM mood_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM aptitude_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM settings WHERE user_id = $1', [userId]);
    await pool.query('INSERT INTO settings (user_id, feb_exam_date) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, '2027-02-07']);
    await pool.query('DELETE FROM topic_ticks WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_topic_progress WHERE user_id = $1', [userId]);
    return true;
  },

  // Export all data
  async exportData(userId) {
    const topics = await this.getTopics(userId);
    const ticksRes = await pool.query('SELECT * FROM topic_ticks WHERE user_id = $1', [userId]);
    const testsRes = await pool.query('SELECT * FROM test_sessions WHERE user_id = $1 ORDER BY date DESC', [userId]);
    const moodsRes = await pool.query('SELECT * FROM mood_logs WHERE user_id = $1 ORDER BY date ASC', [userId]);
    const aptitude = await this.getAptitudeLogs(userId);
    const settings = await this.getSettings(userId);

    return {
      userId,
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
