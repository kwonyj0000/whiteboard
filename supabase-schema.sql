-- Whiteboard Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strokes table
CREATE TABLE IF NOT EXISTS strokes (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    points JSONB NOT NULL,
    brush_size TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sticky notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    position JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strokes_session ON strokes(session_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_session ON sticky_notes(session_id);

-- Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations (public whiteboard)
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public read strokes" ON strokes FOR SELECT USING (true);
CREATE POLICY "Allow public insert strokes" ON strokes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete strokes" ON strokes FOR DELETE USING (true);

CREATE POLICY "Allow public read notes" ON sticky_notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert notes" ON sticky_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notes" ON sticky_notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete notes" ON sticky_notes FOR DELETE USING (true);

-- Real-time subscription
ALTER PUBLICATION supabase_realtime ADD TABLE strokes;
ALTER PUBLICATION supabase_realtime ADD TABLE sticky_notes;
