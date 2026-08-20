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

// Permissive CORS for development so any localhost / 127.0.0.1 port connects without 'Failed to fetch'
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl/postman/same-origin) or any localhost/127.0.0.1
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Friendly root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dekar SmartPOS API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      services: '/api/services',
      sales: '/api/sales',
      suppliers: '/api/suppliers',
      movements: '/api/movements',
      dashboard: '/api/dashboard'
    }
  });
});

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