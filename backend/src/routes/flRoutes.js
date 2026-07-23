import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getFLMetrics } from '../controllers/flController.js';

const router = express.Router();

router.use(authenticateToken);
// Super Admin and Municipal Auth can monitor global FL stats
router.use(authorizeRoles('super_admin', 'municipal_auth'));

router.get('/metrics', getFLMetrics);

export default router;
