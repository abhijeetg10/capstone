import { query } from '../config/db.js';

export const getDiseaseHeatmap = async (req, res) => {
    try {
        // Returns aggregated geographic data across ALL hospitals (summed by location/ward)
        // No hospital specifics or patient info is leaked.
        const heatmapQuery = `
            SELECT ward, latitude, longitude, SUM(total_patients) as active_cases 
            FROM hospital_stats 
            WHERE date >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY ward, latitude, longitude;
        `;
        
        const result = await query(heatmapQuery);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
};

export const getDistrictAnalytics = async (req, res) => {
    try {
        const districtQuery = `
            SELECT district, disease, SUM(total_patients) as total_cases, SUM(deaths) as total_deaths
            FROM hospital_stats
            GROUP BY district, disease;
        `;
        const result = await query(districtQuery);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch district analytics' });
    }
};
