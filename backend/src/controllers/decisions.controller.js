import { pool } from '../db/pool.js';

export async function listDecisions(req, res, next) {
  try {
    const { type, q } = req.query;
    const conditions = [];
    const values = [];

    if (type) {
      values.push(type);
      conditions.push(`d.type = $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      conditions.push(`d.description ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT d.*, p.name as decided_by_name, c.title as conversation_title
       FROM decisions d
       LEFT JOIN people p ON d.decided_by = p.id
       LEFT JOIN conversations c ON d.conversation_id = c.id
       ${where}
       ORDER BY d.created_at DESC`,
      values
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function updateDecision(req, res, next) {
  try {
    const { id } = req.params;
    const { description, type } = req.body;

    const { rows } = await pool.query(
      `UPDATE decisions SET
        description = COALESCE($1, description),
        type = COALESCE($2, type)
       WHERE id = $3 RETURNING *`,
      [description, type, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}