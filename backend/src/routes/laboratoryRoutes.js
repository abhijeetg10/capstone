import express from 'express';
import { authenticateToken, authorizeRoles, checkOwnership } from '../middleware/auth.js';
import { uploadLaboratoryStats, getLaboratoryStats } from '../controllers/laboratoryController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('laboratory'));
router.use(checkOwnership);

router.post('/stats', uploadLaboratoryStats);
router.get('/stats', getLaboratoryStats);

export default router;
