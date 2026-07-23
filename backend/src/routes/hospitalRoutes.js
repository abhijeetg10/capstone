import express from 'express';
import { authenticateToken, authorizeRoles, checkOwnership } from '../middleware/auth.js';
import { uploadHospitalStats, getHospitalStats } from '../controllers/hospitalController.js';

const router = express.Router();

// Only hospitals can access their own stats
router.use(authenticateToken);
router.use(authorizeRoles('hospital'));
router.use(checkOwnership);

// Upload daily aggregated statistics
router.post('/stats', uploadHospitalStats);

// Get own statistics
router.get('/stats', getHospitalStats);

export default router;
