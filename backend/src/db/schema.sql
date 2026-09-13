
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source_type TEXT CHECK (source_type IN ('whatsapp', 'transcript', 'notes')) NOT NULL,
  raw_text TEXT NOT NULL,
  summary TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_id UUID REFERENCES people(id),
  deadline DATE,
  status TEXT CHECK (status IN ('open', 'in_progress', 'done', 'blocked')) DEFAULT 'open',
  confidence NUMERIC DEFAULT 1.0,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('decision', 'approval_pending', 'approval_granted')) DEFAULT 'decision',
  decided_by UUID REFERENCES people(id),
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Light topic-linking between items across conversations (keyword/embedding based)
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT CHECK (source_type IN ('task', 'decision')) NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT CHECK (target_type IN ('task', 'decision')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_conversation ON tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_decisions_conversation ON decisions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin (title gin_trgm_ops);