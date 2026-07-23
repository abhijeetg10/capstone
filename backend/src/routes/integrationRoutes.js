import express from 'express';
import { authenticateToken, authorizeRoles, checkOwnership } from '../middleware/auth.js';
import { triggerSync, getSyncStatus } from '../controllers/integrationController.js';

const router = express.Router();

// Only hospitals can trigger their own HIS sync
router.use(authenticateToken);
router.use(authorizeRoles('hospital'));
// Assuming checkOwnership verifies the user is operating on their own institution_id
// However, integration sync might not have a specific ID in the URL, so we can just use the user's ID
// Note: We might need to adjust checkOwnership if it expects an ID param, but if it relies on req.user it's fine.
// We'll skip checkOwnership here and rely on authenticateToken since we use req.user.institution_id directly.

// Trigger manual sync
router.post('/sync', triggerSync);

// Get current sync status
router.get('/status', getSyncStatus);

export default router;
