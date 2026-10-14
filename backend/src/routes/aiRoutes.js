import express from 'express';
import { runPredictionPipeline, getLatestPredictions } from '../controllers/predictionController.js';

const router = express.Router();

router.post('/trigger-pipeline', runPredictionPipeline);
router.get('/latest-predictions', getLatestPredictions);

export default router;
