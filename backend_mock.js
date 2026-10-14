import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ai/latest-predictions', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        zone_id: 'Zone_A',
        risk_category: 'HIGH',
        outbreak_probability: 0.85,
        prediction_date: new Date().toISOString(),
      },
      {
        zone_id: 'Zone_B',
        risk_category: 'CRITICAL',
        outbreak_probability: 0.92,
        prediction_date: new Date().toISOString(),
      },
      {
        zone_id: 'Zone_C',
        risk_category: 'MODERATE',
        outbreak_probability: 0.45,
        prediction_date: new Date().toISOString(),
      },
      {
        zone_id: 'Zone_D',
        risk_category: 'LOW',
        outbreak_probability: 0.12,
        prediction_date: new Date().toISOString(),
      },
      {
        zone_id: 'Zone_E',
        risk_category: 'LOW',
        outbreak_probability: 0.08,
        prediction_date: new Date().toISOString(),
      }
    ]
  });
});

app.listen(5000, () => console.log('Mock API running on port 5000'));
