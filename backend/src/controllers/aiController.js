import { query } from '../config/db.js';

export const getPredictions = async (req, res) => {
    try {
        const predictionQuery = `
            SELECT * FROM ai_predictions 
            ORDER BY prediction_timestamp DESC 
            LIMIT 100;
        `;
        const result = await query(predictionQuery);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch AI predictions' });
    }
};
