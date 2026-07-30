-- ============================================================
-- Instamart Discovery Engine — Supabase Schema
-- Run this entire script in Supabase SQL Editor (one shot)
-- ============================================================

-- 1. Raw feedback from all sources
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,                    -- play_store, app_store, reddit, csv
    text TEXT NOT NULL,
    rating INTEGER,
    date TIMESTAMPTZ,
    author_hash TEXT,
    metadata JSONB DEFAULT '{}',
    sentiment TEXT,                           -- positive, negative, neutral, mixed (Phase 2)
    category TEXT,                            -- groceries, snacks, household, etc. (Phase 2)
    theme_tags TEXT[],                        -- array of theme tags (Phase 2)
    relevance TEXT,                           -- high, medium, low (Phase 2)
    processed BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extracted themes
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    description TEXT,
    review_count INTEGER DEFAULT 0,
    avg_sentiment REAL,
    source_diversity INTEGER,                -- number of unique sources
    relevance TEXT,
    evidence_ids UUID[],                     -- links to feedback.id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Generated insights
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    evidence_count INTEGER,
    impact TEXT,                              -- high, medium, low
    confidence_score REAL,                   -- 0-100
    strategic_question TEXT,                 -- maps to Q1-Q8
    recommended_action TEXT,
    user_segment TEXT,
    theme_ids UUID[],                        -- links to themes.id
    validated BOOLEAN DEFAULT FALSE,
    human_rating INTEGER,                    -- thumbs up(1) / down(-1) / null
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pipeline run log
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running',            -- running, completed, failed
    reviews_collected INTEGER DEFAULT 0,
    themes_extracted INTEGER DEFAULT 0,
    insights_generated INTEGER DEFAULT 0,
    error_log TEXT
);

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON feedback(processed);
CREATE INDEX IF NOT EXISTS idx_feedback_collected_at ON feedback(collected_at);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_themes_created_at ON themes(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_confidence ON insights(confidence_score);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started_at ON pipeline_runs(started_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Disabled for service role access
-- ============================================================
-- We use the service_role key which bypasses RLS, but we still
-- need to enable RLS and create a permissive policy so the
-- Supabase dashboard can view the data.

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (our API uses service_role key)
CREATE POLICY "Service role full access on feedback" ON feedback
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on themes" ON themes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on insights" ON insights
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on pipeline_runs" ON pipeline_runs
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! You should see 4 tables in the Table Editor.
-- ============================================================
