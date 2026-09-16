import { pool } from '../db/pool.js';

export async function searchAll(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query param q' });

    const like = `%${q}%`;

    const [tasks, decisions, conversations] = await Promise.all([
      pool.query(
        `SELECT t.id, t.title, t.status, t.deadline, p.name as owner_name, 'task' as result_type
         FROM tasks t
         LEFT JOIN people p ON t.owner_id = p.id
         WHERE t.title ILIKE $1 LIMIT 20`,
        [like]
      ),
      pool.query(
        `SELECT d.id, d.description as title, d.type, p.name as decided_by_name, 'decision' as result_type
         FROM decisions d
         LEFT JOIN people p ON d.decided_by = p.id
         WHERE d.description ILIKE $1 LIMIT 20`,
        [like]
      ),
      pool.query(
        `SELECT id, title, summary, 'conversation' as result_type
         FROM conversations WHERE title ILIKE $1 OR summary ILIKE $1 OR raw_text ILIKE $1 LIMIT 20`,
        [like]
      ),
    ]);

    res.json({ tasks: tasks.rows, decisions: decisions.rows, conversations: conversations.rows });
  } catch (err) {
    next(err);
  }
}