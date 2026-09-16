import { pool } from '../db/pool.js';
import { parseUploadedFile, extractReferenceDateFromText } from '../services/fileParser.service.js';
import { extractFromText } from '../services/extraction.service.js';
import { findAndCreateLinks } from '../services/linking.service.js';

async function findOrCreatePerson(name) {
  if (!name) return null;
  const trimmedName = name.trim();
  const firstName = trimmedName.split(/\s+/)[0].toLowerCase();

  // 1. Exact match (case-insensitive) on name or a known alias
  const exact = await pool.query(
    'SELECT id FROM people WHERE LOWER(name) = LOWER($1) OR $1 = ANY(aliases) LIMIT 1',
    [trimmedName]
  );
  if (exact.rows.length) return exact.rows[0].id;

  // 2. Fallback: match by first name against existing people's first name or aliases.
  // Handles "Vikram" vs "Vikram Contractor" vs "Vikram Contractor 2" all referring
  // to the same person, which the LLM extracts inconsistently across messages.
  const { rows: allPeople } = await pool.query('SELECT id, name, aliases FROM people');
  const match = allPeople.find((p) => {
    const existingFirst = p.name.split(/\s+/)[0].toLowerCase();
    if (existingFirst === firstName) return true;
    return (p.aliases || []).some((a) => a.split(/\s+/)[0].toLowerCase() === firstName);
  });

  if (match) {
    // Keep the more specific (longer) name as canonical, tuck the other into aliases,
    // so future exact-match lookups on either form succeed immediately.
    const oldName = match.name;
    const canonicalName = trimmedName.length > oldName.length ? trimmedName : oldName;
    const aliasSet = new Set(match.aliases || []);
    aliasSet.add(oldName);
    aliasSet.add(trimmedName);
    aliasSet.delete(canonicalName);

    await pool.query(
      'UPDATE people SET name = $1, aliases = $2 WHERE id = $3',
      [canonicalName, Array.from(aliasSet), match.id]
    );
    return match.id;
  }

  // 3. No match at all — genuinely a new person
  const created = await pool.query(
    'INSERT INTO people (name) VALUES ($1) RETURNING id',
    [trimmedName]
  );
  return created.rows[0].id;
}

export async function uploadConversation(req, res, next) {
  try {
    const { sourceType = 'whatsapp', title } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const rawText = await parseUploadedFile(file.path, file.mimetype, file.originalname);
    const referenceDate = extractReferenceDateFromText(rawText) || new Date().toISOString().slice(0, 10);
    const extraction = await extractFromText(rawText, referenceDate);

    const convResult = await pool.query(
      `INSERT INTO conversations (title, source_type, raw_text, summary)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [title || file.originalname, sourceType, rawText, extraction.summary]
    );
    const conversationId = convResult.rows[0].id;

    const createdTasks = [];
    for (const t of extraction.tasks || []) {
      const ownerId = await findOrCreatePerson(t.owner);
      const result = await pool.query(
        `INSERT INTO tasks (conversation_id, title, owner_id, deadline, confidence)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, title`,
        [conversationId, t.title, ownerId, t.deadline, t.confidence ?? 0.8]
      );
      createdTasks.push(result.rows[0]);
      await findAndCreateLinks({ id: result.rows[0].id, title: t.title, type: 'task' });
    }

    const createdDecisions = [];
    for (const d of extraction.decisions || []) {
      const decidedById = await findOrCreatePerson(d.decided_by);
      const result = await pool.query(
        `INSERT INTO decisions (conversation_id, description, type, decided_by)
         VALUES ($1, $2, $3, $4) RETURNING id, description`,
        [conversationId, d.description, d.type || 'decision', decidedById]
      );
      createdDecisions.push(result.rows[0]);
      await findAndCreateLinks({ id: result.rows[0].id, title: d.description, type: 'decision' });
    }

    res.status(201).json({
      conversationId,
      summary: extraction.summary,
      tasks: createdTasks,
      decisions: createdDecisions,
      peopleMentioned: extraction.people_mentioned || [],
    });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, source_type, summary, uploaded_at FROM conversations ORDER BY uploaded_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const conv = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
    if (!conv.rows.length) return res.status(404).json({ error: 'Not found' });

    const tasks = await pool.query('SELECT * FROM tasks WHERE conversation_id = $1', [id]);
    const decisions = await pool.query('SELECT * FROM decisions WHERE conversation_id = $1', [id]);

    res.json({ ...conv.rows[0], tasks: tasks.rows, decisions: decisions.rows });
  } catch (err) {
    next(err);
  }
}

// User reviews extracted items and confirms/edits them
export async function confirmExtraction(req, res, next) {
  try {
    const { id } = req.params;
    const { tasks = [], decisions = [] } = req.body; // arrays of { id, title/description, owner_id, deadline, ... }

    for (const t of tasks) {
      await pool.query(
        `UPDATE tasks SET title = $1, owner_id = $2, deadline = $3, confirmed = true WHERE id = $4`,
        [t.title, t.owner_id, t.deadline, t.id]
      );
    }
    for (const d of decisions) {
      await pool.query(
        `UPDATE decisions SET description = $1, type = $2, confirmed = true WHERE id = $3`,
        [d.description, d.type, d.id]
      );
    }

    res.json({ conversationId: id, status: 'confirmed' });
  } catch (err) {
    next(err);
  }
}

// import { pool } from '../db/pool.js';
// import { parseUploadedFile, extractReferenceDateFromText } from '../services/fileParser.service.js';
// import { extractFromText } from '../services/extraction.service.js';
// import { findAndCreateLinks } from '../services/linking.service.js';

// async function findOrCreatePerson(name) {
//   if (!name) return null;
//   const existing = await pool.query(
//     'SELECT id FROM people WHERE name ILIKE $1 OR $1 = ANY(aliases) LIMIT 1',
//     [name]
//   );
//   if (existing.rows.length) return existing.rows[0].id;

//   const created = await pool.query(
//     'INSERT INTO people (name) VALUES ($1) RETURNING id',
//     [name]
//   );
//   return created.rows[0].id;
// }

// export async function uploadConversation(req, res, next) {
//   try {
//     const { sourceType = 'whatsapp', title } = req.body;
//     const file = req.file;
//     if (!file) return res.status(400).json({ error: 'No file uploaded' });

//     const rawText = await parseUploadedFile(file.path, file.mimetype, file.originalname);
//     const referenceDate = extractReferenceDateFromText(rawText) || new Date().toISOString().slice(0, 10);
//     const extraction = await extractFromText(rawText, referenceDate);

//     const convResult = await pool.query(
//       `INSERT INTO conversations (title, source_type, raw_text, summary)
//        VALUES ($1, $2, $3, $4) RETURNING id`,
//       [title || file.originalname, sourceType, rawText, extraction.summary]
//     );
//     const conversationId = convResult.rows[0].id;

//     const createdTasks = [];
//     for (const t of extraction.tasks || []) {
//       const ownerId = await findOrCreatePerson(t.owner);
//       const result = await pool.query(
//         `INSERT INTO tasks (conversation_id, title, owner_id, deadline, confidence)
//          VALUES ($1, $2, $3, $4, $5) RETURNING id, title`,
//         [conversationId, t.title, ownerId, t.deadline, t.confidence ?? 0.8]
//       );
//       createdTasks.push(result.rows[0]);
//       await findAndCreateLinks({ id: result.rows[0].id, title: t.title, type: 'task' });
//     }

//     const createdDecisions = [];
//     for (const d of extraction.decisions || []) {
//       const decidedById = await findOrCreatePerson(d.decided_by);
//       const result = await pool.query(
//         `INSERT INTO decisions (conversation_id, description, type, decided_by)
//          VALUES ($1, $2, $3, $4) RETURNING id, description`,
//         [conversationId, d.description, d.type || 'decision', decidedById]
//       );
//       createdDecisions.push(result.rows[0]);
//       await findAndCreateLinks({ id: result.rows[0].id, title: d.description, type: 'decision' });
//     }

//     res.status(201).json({
//       conversationId,
//       summary: extraction.summary,
//       tasks: createdTasks,
//       decisions: createdDecisions,
//       peopleMentioned: extraction.people_mentioned || [],
//     });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function listConversations(req, res, next) {
//   try {
//     const { rows } = await pool.query(
//       'SELECT id, title, source_type, summary, uploaded_at FROM conversations ORDER BY uploaded_at DESC'
//     );
//     res.json(rows);
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getConversation(req, res, next) {
//   try {
//     const { id } = req.params;
//     const conv = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
//     if (!conv.rows.length) return res.status(404).json({ error: 'Not found' });

//     const tasks = await pool.query('SELECT * FROM tasks WHERE conversation_id = $1', [id]);
//     const decisions = await pool.query('SELECT * FROM decisions WHERE conversation_id = $1', [id]);

//     res.json({ ...conv.rows[0], tasks: tasks.rows, decisions: decisions.rows });
//   } catch (err) {
//     next(err);
//   }
// }

// // User reviews extracted items and confirms/edits them
// export async function confirmExtraction(req, res, next) {
//   try {
//     const { id } = req.params;
//     const { tasks = [], decisions = [] } = req.body; // arrays of { id, title/description, owner_id, deadline, ... }

//     for (const t of tasks) {
//       await pool.query(
//         `UPDATE tasks SET title = $1, owner_id = $2, deadline = $3, confirmed = true WHERE id = $4`,
//         [t.title, t.owner_id, t.deadline, t.id]
//       );
//     }
//     for (const d of decisions) {
//       await pool.query(
//         `UPDATE decisions SET description = $1, type = $2, confirmed = true WHERE id = $3`,
//         [d.description, d.type, d.id]
//       );
//     }

//     res.json({ conversationId: id, status: 'confirmed' });
//   } catch (err) {
//     next(err);
//   }
// }