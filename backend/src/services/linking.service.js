import { pool } from '../db/pool.js';

// Very lightweight linking: naive keyword overlap between a new task/decision
// title and existing ones. Good enough for a demo; swap for embeddings later.
function keywordOverlapScore(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const shared = [...wordsA].filter((w) => wordsB.has(w));
  return shared.length / Math.max(1, Math.min(wordsA.size, wordsB.size));
}

export async function findAndCreateLinks(newItem) {
  const { id, title, type } = newItem; // type: 'task' | 'decision'
  const table = type === 'task' ? 'tasks' : 'decisions';
  const titleCol = type === 'task' ? 'title' : 'description';

  const { rows } = await pool.query(
    `SELECT id, ${titleCol} as text FROM ${table} WHERE id != $1`,
    [id]
  );

  for (const row of rows) {
    const score = keywordOverlapScore(title, row.text);
    if (score >= 0.5) {
      await pool.query(
        `INSERT INTO links (source_type, source_id, target_type, target_id, reason)
         VALUES ($1, $2, $1, $3, $4)`,
        [type, id, row.id, `keyword overlap ${score.toFixed(2)}`]
      );
    }
  }
}