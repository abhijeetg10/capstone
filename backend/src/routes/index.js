// Placeholder for routes index
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API Routes initialized' });
});

export default router;
