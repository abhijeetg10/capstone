import { query } from '../config/db.js';

export const uploadPharmacyStats = async (req, res) => {
    try {
        const { institution_id, date, district, taluka, ward, medicine_category, medicine_name, quantity_sold, latitude, longitude } = req.body;
        const insertQuery = `
            INSERT INTO pharmacy_stats 
            (pharmacy_id, date, district, taluka, ward, medicine_category, medicine_name, quantity_sold, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *;
        `;
        const values = [institution_id, date, district, taluka, ward, medicine_category, medicine_name, quantity_sold, latitude, longitude];
        const result = await query(insertQuery, values);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload pharmacy stats' });
    }
};

export const getPharmacyStats = async (req, res) => {
    try {
        const result = await query('SELECT * FROM pharmacy_stats WHERE pharmacy_id = $1 ORDER BY date DESC', [req.user.institution_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch pharmacy stats' });
    }
};
