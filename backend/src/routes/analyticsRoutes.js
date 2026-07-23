import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getDiseaseHeatmap, getDistrictAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Municipal Authority, Super Admin, and Researchers can access analytics
router.use(authenticateToken);
router.use(authorizeRoles('super_admin', 'municipal_auth', 'researcher'));

// Aggregated Heatmap Endpoint (NO PATIENT DATA)
router.get('/heatmap', getDiseaseHeatmap);

// Aggregated District Analytics
router.get('/district', getDistrictAnalytics);

export default router;
