import express from 'express';
import { authenticateToken, authorizeRoles, checkOwnership } from '../middleware/auth.js';
import { uploadPharmacyStats, getPharmacyStats } from '../controllers/pharmacyController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('pharmacy'));
router.use(checkOwnership);

router.post('/stats', uploadPharmacyStats);
router.get('/stats', getPharmacyStats);

export default router;
