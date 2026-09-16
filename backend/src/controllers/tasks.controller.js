import { pool } from '../db/pool.js';

export async function listTasks(req, res, next) {
  try {
    const { status, owner, q } = req.query;
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }
    if (owner) {
      values.push(`%${owner}%`);
      conditions.push(`p.name ILIKE $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      conditions.push(`t.title ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT t.*, p.name as owner_name, c.title as conversation_title
       FROM tasks t
       LEFT JOIN people p ON t.owner_id = p.id
       LEFT JOIN conversations c ON t.conversation_id = c.id
       ${where}
       ORDER BY t.created_at DESC`,
      values
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, status, deadline, owner_id } = req.body;

    const { rows } = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        status = COALESCE($2, status),
        deadline = COALESCE($3, deadline),
        owner_id = COALESCE($4, owner_id)
       WHERE id = $5 RETURNING *`,
      [title, status, deadline, owner_id, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}