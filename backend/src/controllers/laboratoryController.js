import { query } from '../config/db.js';

export const uploadLaboratoryStats = async (req, res) => {
    try {
        const { institution_id, date, district, taluka, ward, disease, total_tests, positive_tests, negative_tests, latitude, longitude } = req.body;
        const insertQuery = `
            INSERT INTO laboratory_stats 
            (laboratory_id, date, district, taluka, ward, disease, total_tests, positive_tests, negative_tests, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *;
        `;
        const values = [institution_id, date, district, taluka, ward, disease, total_tests, positive_tests, negative_tests, latitude, longitude];
        const result = await query(insertQuery, values);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload laboratory stats' });
    }
};

export const getLaboratoryStats = async (req, res) => {
    try {
        const result = await query('SELECT * FROM laboratory_stats WHERE laboratory_id = $1 ORDER BY date DESC', [req.user.institution_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch laboratory stats' });
    }
};
