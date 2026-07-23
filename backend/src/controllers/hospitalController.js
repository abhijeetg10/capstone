import { query } from '../config/db.js';

export const uploadHospitalStats = async (req, res) => {
    try {
        // req.body.institution_id is injected by checkOwnership middleware
        const { institution_id, date, district, taluka, ward, disease, total_patients, male_patients, female_patients, children, adults, senior_citizens, admissions, recoveries, deaths, latitude, longitude } = req.body;
        
        const insertQuery = `
            INSERT INTO hospital_stats 
            (hospital_id, date, district, taluka, ward, disease, total_patients, male_patients, female_patients, children, adults, senior_citizens, admissions, recoveries, deaths, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
            RETURNING *;
        `;
        
        const values = [institution_id, date, district, taluka, ward, disease, total_patients, male_patients, female_patients, children, adults, senior_citizens, admissions, recoveries, deaths, latitude, longitude];
        
        const result = await query(insertQuery, values);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload hospital stats' });
    }
};

export const getHospitalStats = async (req, res) => {
    try {
        const hospital_id = req.user.institution_id;
        const result = await query('SELECT * FROM hospital_stats WHERE hospital_id = $1 ORDER BY date DESC', [hospital_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch hospital stats' });
    }
};
