import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { triggerSync, getSyncStatus } from '../controllers/pmsIntegrationController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('pharmacy', 'administration'));

// Trigger manual sync
router.post('/sync', triggerSync);

// Get current sync status
router.get('/status', getSyncStatus);

export default router;
