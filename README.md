# Project Communication Intelligence System

Turns messy, unstructured project communication — WhatsApp exports, meeting
transcripts, notes — into structured, searchable project data: tasks with
owners and deadlines, decisions, and pending approvals.

Built for architecture, interior design, and construction projects, where
critical information (a decision, a task, a deadline) is often buried inside
a long WhatsApp thread and easy to lose track of.

## The problem

> Project teams often manually interpret conversations and convert them into
> tasks, follow-ups, meeting minutes and decisions. Important information can
> therefore be missed, forgotten, misinterpreted, assigned to the wrong
> person, or difficult to search later.

This system automates that interpretation step: upload a conversation, an
LLM extracts the structured information, a human reviews and confirms it,
and it becomes permanent, searchable project memory.

## Features

- **Upload** a WhatsApp `.txt` export or a meeting transcript (`.docx`/`.txt`)
- **AI extraction** (Google Gemini) pulls out:
  - A concise summary of the conversation
  - Tasks, with owner and deadline (relative dates like "by Thursday" are
    resolved to real calendar dates against the conversation's own date)
  - Decisions, classified as `decision`, `approval_pending`, or
    `approval_granted`
- **Review screen** — every extraction is editable before it's saved as
  confirmed project data, so AI mistakes never silently become "official"
- **Dashboard** — live task and decision tracking, with inline status/type
  editing (click a badge, pick a new value, saved instantly)
- **Search** — full-text search across tasks, decisions, and conversations
- **Person resolution** — the same person mentioned inconsistently across
  messages ("Vikram" vs. "Vikram Contractor") is matched to one person
  record instead of creating duplicates
- **Lightweight cross-conversation linking** — tasks/decisions that share
  enough keyword overlap get linked, as a lightweight stand-in for full
  dependency tracking

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express (plain JS, ES modules) |
| Frontend | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL, hosted on [Neon](https://neon.tech) |
| DB access | raw `pg` — no ORM |
| LLM extraction | Google Gemini (`gemini-2.0-flash`) |
| File parsing | `mammoth` (`.docx`), native `fs` (`.txt`) |

No TypeScript on the backend, no Prisma — kept deliberately simple to move
fast: plain SQL you can read directly in the controllers, and a cloud
Postgres instance with zero local database setup.

## Project structure

```
project-comm-intel/
├── backend/
│   ├── src/
│   │   ├── routes/          # URL → controller mapping
│   │   ├── controllers/     # request handlers, business logic
│   │   ├── services/        # extraction (Gemini), file parsing, linking
│   │   ├── db/               # connection pool, schema.sql, migration script
│   │   └── server.js         # app entry point
│   ├── uploads/               # uploaded files land here temporarily
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router routes
│   │   │   ├── page.tsx           → Dashboard
│   │   │   ├── upload/page.tsx    → Upload
│   │   │   ├── review/[conversationId]/page.tsx → Review
│   │   │   └── search/page.tsx    → Search
│   │   ├── pages/             # actual page components (rendered by app/)
│   │   ├── components/        # Sidebar, StatusBadge, PersonChip
│   │   ├── services/api.ts    # every backend call lives here
│   │   └── app/globals.css    # dark theme tokens
│   └── package.json
└── README.md
```

## Setup

### 1. Prerequisites

- Node.js 18+
- A free [Neon](https://neon.tech) Postgres database (no local Postgres
  install needed)
- A free [Gemini API key](https://aistudio.google.com/apikey)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
PORT=5000
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your_key_here
UPLOAD_DIR=./uploads
```

Create the database tables, then start the server:

```bash
npm run db:migrate
npm run dev
```

Backend runs at `http://localhost:5000`. Health check:
`GET http://localhost:5000/api/health` → `{"status":"ok"}`

### 3. Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/conversations/upload` | Upload a file (multipart: `file`, `sourceType`, `title`) → triggers extraction |
| GET | `/conversations` | List all conversations |
| GET | `/conversations/:id` | Get one conversation with its tasks + decisions |
| POST | `/conversations/:id/confirm` | Save user-edited tasks/decisions from the Review screen |
| GET | `/tasks?status=&owner=&q=` | List/filter tasks |
| PATCH | `/tasks/:id` | Update a task (title, status, deadline, owner) |
| GET | `/decisions?type=&q=` | List/filter decisions |
| PATCH | `/decisions/:id` | Update a decision (description, type) |
| GET | `/search?q=` | Search across tasks, decisions, conversations |
| GET | `/people` | List all people |

## Data model

```
people          → id, name, role, aliases[]
conversations   → id, title, source_type, raw_text, summary, uploaded_at
tasks           → id, conversation_id, title, owner_id, deadline, status,
                   confidence, confirmed
decisions       → id, conversation_id, description, type, decided_by,
                   confirmed
links           → id, source_type/id, target_type/id, reason
                  (lightweight cross-conversation linking)
```

## How it works, end to end

1. User uploads a `.txt`/`.docx` file on the **Upload** page
2. Backend parses the raw text and detects the conversation's own date
   (from the first WhatsApp timestamp, if present)
3. The raw text + that reference date are sent to Gemini, which returns
   structured JSON: summary, tasks (with resolved deadlines), decisions
   (classified by type), and people mentioned
4. Each person mentioned is resolved to a `people` record — matching on
   exact name first, falling back to first-name matching so "Vikram" and
   "Vikram Contractor" merge into one person instead of duplicating
5. Tasks and decisions are inserted, and lightweight keyword-overlap
   linking checks for related items across other conversations
6. User is redirected to **Review**, where every extracted item is editable
7. On confirm, edits are saved and `confirmed` is set to `true`
8. **Dashboard** shows all tasks/decisions, with inline status/type editing
   and a "show completed" toggle so finished tasks are hidden by default
   but never deleted — the full history stays searchable
9. **Search** queries across tasks, decisions, and conversation text

## Known limitations

- No authentication — single-user/demo scope
- No pagination on list endpoints (fine at demo scale)
- Uploaded files are stored permanently in `backend/uploads/` with no
  automatic cleanup for now

## Possible next steps

- Full dependency/impact analysis (what breaks if a decision changes)
- Voice input for hands-free task creation on-site
- Multi-user support with role-based permissions
- Live WhatsApp/Meta API integration instead of manual file export