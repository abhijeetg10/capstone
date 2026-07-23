import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Placeholder Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

import hospitalRoutes from './routes/hospitalRoutes.js';
import laboratoryRoutes from './routes/laboratoryRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import flRoutes from './routes/flRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import limsIntegrationRoutes from './routes/limsIntegrationRoutes.js';
import pmsIntegrationRoutes from './routes/pmsIntegrationRoutes.js';
import authRoutes from './routes/authRoutes.js';
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fl', flRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/lims-integration', limsIntegrationRoutes);
app.use('/api/pms-integration', pmsIntegrationRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend service is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
