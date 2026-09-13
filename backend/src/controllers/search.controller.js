import { pool } from '../db/pool.js';

export async function searchAll(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query param q' });

    const like = `%${q}%`;

    const [tasks, decisions, conversations] = await Promise.all([
      pool.query(
        `SELECT id, title, status, deadline, 'task' as result_type
         FROM tasks WHERE title ILIKE $1 LIMIT 20`,
        [like]
      ),
      pool.query(
        `SELECT id, description as title, type, 'decision' as result_type
         FROM decisions WHERE description ILIKE $1 LIMIT 20`,
        [like]
      ),
      pool.query(
        `SELECT id, title, summary, 'conversation' as result_type
         FROM conversations WHERE title ILIKE $1 OR summary ILIKE $1 OR raw_text ILIKE $1 LIMIT 20`,
        [like]
      ),
    ]);

    res.json({
      tasks: tasks.rows,
      decisions: decisions.rows,
      conversations: conversations.rows,
    });
  } catch (err) {
    next(err);
  }
}