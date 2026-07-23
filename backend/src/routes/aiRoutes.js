import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getPredictions } from '../controllers/aiController.js';

const router = express.Router();

// All authenticated users can view AI predictions (though UI will restrict some views)
router.use(authenticateToken);

router.get('/predictions', getPredictions);

export default router;
