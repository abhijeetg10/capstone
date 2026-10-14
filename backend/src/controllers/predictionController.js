import { query } from '../config/db.js';
import axios from 'axios';

const ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E'];

// For the demo/proof-of-concept, we pull the exact final simulated observable row for day 1094 of Seed 1010
// In production, this would aggregate from ERD databases in real time.
const MOCK_CURRENT_OBSERVABLES = {
    'Zone_A': { hospital_cases: 4, hosp_cases_7d_mean: 3.5, lab_total: 10, lab_positive: 2, lab_pos_rate: 0.2, lab_pos_rate_7d_mean: 0.15, pharmacy_sales: 120, pharm_sales_7d_mean: 110, pharm_sales_7d_growth: 1.09, temperature: 32, humidity: 80, rainfall: 50 },
    'Zone_B': { hospital_cases: 12, hosp_cases_7d_mean: 15, lab_total: 40, lab_positive: 15, lab_pos_rate: 0.375, lab_pos_rate_7d_mean: 0.4, pharmacy_sales: 300, pharm_sales_7d_mean: 280, pharm_sales_7d_growth: 1.07, temperature: 33, humidity: 85, rainfall: 120 },
    'Zone_C': { hospital_cases: 2, hosp_cases_7d_mean: 2.1, lab_total: 5, lab_positive: 0, lab_pos_rate: 0.0, lab_pos_rate_7d_mean: 0.0, pharmacy_sales: 50, pharm_sales_7d_mean: 50, pharm_sales_7d_growth: 1.0, temperature: 31, humidity: 70, rainfall: 10 },
    'Zone_D': { hospital_cases: 7, hosp_cases_7d_mean: 6.8, lab_total: 20, lab_positive: 5, lab_pos_rate: 0.25, lab_pos_rate_7d_mean: 0.2, pharmacy_sales: 180, pharm_sales_7d_mean: 150, pharm_sales_7d_growth: 1.2, temperature: 34, humidity: 75, rainfall: 30 },
    'Zone_E': { hospital_cases: 1, hosp_cases_7d_mean: 1.0, lab_total: 2, lab_positive: 0, lab_pos_rate: 0.0, lab_pos_rate_7d_mean: 0.05, pharmacy_sales: 30, pharm_sales_7d_mean: 35, pharm_sales_7d_growth: 0.85, temperature: 30, humidity: 65, rainfall: 0 }
};

export const runPredictionPipeline = async (req, res) => {
    try {
        const predictions = [];
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        
        for (const zone of ZONES) {
            const observables = MOCK_CURRENT_OBSERVABLES[zone];
            const payload = {
                zone_id: zone,
                ...observables
            };
            
            // Hit FastAPI prediction endpoint
            const response = await axios.post(`${aiUrl}/predict-outbreak`, payload);
            const data = response.data;
            
            // Store in Postgres
            await query(`
                INSERT INTO predictions 
                (zone_id, prediction_date, outbreak_probability, risk_category, hospital_cases, lab_pos_rate, pharm_sales_7d_mean, temperature)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                zone, 
                data.prediction_timestamp, 
                data.outbreak_probability, 
                data.risk_category,
                observables.hospital_cases,
                observables.lab_pos_rate,
                observables.pharm_sales_7d_mean,
                observables.temperature
            ]);
            
            predictions.push({
                zone,
                ...data,
                observables
            });
        }
        
        res.status(200).json({ success: true, predictions });
    } catch (error) {
        console.error('Pipeline error:', error);
        res.status(500).json({ success: false, error: 'Failed to run prediction pipeline' });
    }
};

export const getLatestPredictions = async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT ON (zone_id) *
            FROM predictions
            ORDER BY zone_id, prediction_date DESC
        `);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        // Fallback for development without DB
        const fallback = ZONES.map(z => ({
            zone_id: z,
            outbreak_probability: 0.05,
            risk_category: 'LOW',
            prediction_date: new Date().toISOString()
        }));
        res.status(200).json({ success: true, data: fallback, fallback: true });
    }
};
