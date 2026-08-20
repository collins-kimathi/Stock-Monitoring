import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import productsRouter from './routes/products.js';
import servicesRouter from './routes/services.js';
import salesRouter from './routes/sales.js';
import dashboardRouter from './routes/dashboard.js';
import movementsRouter from './routes/movements.js';
import suppliersRouter from './routes/suppliers.js';

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.get('/api/health', async (req, res) => {
  try {
    const { rowCount } = await pool.query('select 1');
    res.json({ status: 'ok', database: rowCount === 1 ? 'connected' : 'unknown' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/suppliers', suppliersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Dekar SmartPOS API listening on http://localhost:${port}`);
});