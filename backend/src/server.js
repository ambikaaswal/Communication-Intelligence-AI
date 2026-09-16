import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import conversationsRouter from './routes/conversations.routes.js';
import tasksRouter from './routes/tasks.routes.js';
import decisionsRouter from './routes/decisions.routes.js';
import searchRouter from './routes/search.routes.js';
import peopleRouter from './routes/people.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/conversations', conversationsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/search', searchRouter);
app.use('/api/people', peopleRouter);

// Central error handler (keep last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
