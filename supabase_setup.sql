-- =====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR GATE TRACKER
-- Run these queries in your Supabase SQL Editor (https://supabase.com)
-- =====================================================================

-- 1. ENABLE ROW LEVEL SECURITY
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_logs ENABLE ROW LEVEL SECURITY;


-- 2. DEFINE POLICIES FOR topics TABLE (Global syllabus template)
-- Anyone can read the global topics, but only admin (or backend via direct connection) can modify them.
CREATE POLICY "Allow read access to topics for everyone" ON topics
  FOR SELECT
  USING (true);


-- 3. DEFINE POLICIES FOR user_topic_progress TABLE
CREATE POLICY "Users can manage their own topic progress" ON user_topic_progress
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 4. DEFINE POLICIES FOR test_sessions TABLE
CREATE POLICY "Users can manage their own test sessions" ON test_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 5. DEFINE POLICIES FOR mood_logs TABLE
CREATE POLICY "Users can manage their own mood logs" ON mood_logs
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 6. DEFINE POLICIES FOR settings TABLE
CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 7. DEFINE POLICIES FOR topic_ticks TABLE
CREATE POLICY "Users can manage their own topic ticks" ON topic_ticks
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- 8. DEFINE POLICIES FOR aptitude_logs TABLE
CREATE POLICY "Users can manage their own aptitude logs" ON aptitude_logs
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
