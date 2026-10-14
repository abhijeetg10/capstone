import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getDiseaseHeatmap, getDistrictAnalytics, getIntegratedSurveillanceAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Allow public/auth route access for demo analytics
router.get('/integrated', getIntegratedSurveillanceAnalytics);

router.use(authenticateToken);
router.use(authorizeRoles('super_admin', 'municipal_auth', 'researcher'));

router.get('/heatmap', getDiseaseHeatmap);
router.get('/district', getDistrictAnalytics);

export default router;
