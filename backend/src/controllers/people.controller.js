import { pool } from '../db/pool.js';

export async function listPeople(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM people ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}