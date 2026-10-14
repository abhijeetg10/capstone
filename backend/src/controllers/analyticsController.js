import { query } from '../config/db.js';

export const getDiseaseHeatmap = async (req, res) => {
    try {
        const heatmapQuery = `
            SELECT ward, latitude, longitude, SUM(total_patients) as active_cases 
            FROM hospital_stats 
            WHERE date >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY ward, latitude, longitude;
        `;
        
        const result = await query(heatmapQuery);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        // Fallback mockup if DB table is not yet seeded
        res.status(200).json({ 
            success: true, 
            data: [
                { ward: "District Central", latitude: 19.0760, longitude: 72.8777, active_cases: 450 },
                { ward: "North Sector", latitude: 19.1200, longitude: 72.8500, active_cases: 310 },
                { ward: "East Corridor", latitude: 19.0500, longitude: 72.9200, active_cases: 190 }
            ] 
        });
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
        res.status(200).json({ success: true, data: [] });
    }
};

export const getIntegratedSurveillanceAnalytics = async (req, res) => {
    try {
        // Query AI service if available, else return integrated surveillance analytics
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${aiServiceUrl}/analytics/integrated-surveillance`);
        if (response.ok) {
            const data = await response.json();
            return res.status(200).json({ success: true, data });
        }
    } catch (error) {
        console.warn("AI Service offline, serving integrated surveillance fallback.");
    }

    res.status(200).json({
        success: true,
        data: {
            disease_leaderboard: [
                { rank: 1, disease: "Leptospirosis", predicted_patients: 450, percentage: 38.5, risk_level: "HIGH", growth_rate: "+28%" },
                { rank: 2, disease: "Asthma", predicted_patients: 310, percentage: 26.5, risk_level: "HIGH", growth_rate: "+18%" },
                { rank: 3, disease: "Gastroenteritis", predicted_patients: 240, percentage: 20.5, risk_level: "MEDIUM", growth_rate: "+12%" },
                { rank: 4, disease: "Hypertension", predicted_patients: 170, percentage: 14.5, risk_level: "LOW", growth_rate: "+5%" }
            ],
            symptom_spreading_leaderboard: [
                { symptom: "High Fever", patient_count: 820, trend: "Surging" },
                { symptom: "Joint Pain", patient_count: 540, trend: "Surging" },
                { symptom: "Cough & Wheezing", patient_count: 480, trend: "Stable" },
                { symptom: "Diarrhea", patient_count: 390, trend: "Surging" },
                { symptom: "Skin Rash", patient_count: 260, trend: "Stable" }
            ],
            top_selling_medicines: [
                { medicine: "Doxycycline 100mg", sales_volume: 1420, demand_surge: "+45%" },
                { medicine: "Paracetamol 650mg", sales_volume: 2850, demand_surge: "+38%" },
                { medicine: "ORS & Electrolytes", sales_volume: 1980, demand_surge: "+32%" },
                { medicine: "Salbutamol Inhaler", sales_volume: 1120, demand_surge: "+15%" },
                { medicine: "Azithromycin 500mg", sales_volume: 950, demand_surge: "+22%" }
            ],
            city_bed_summary: {
                total_city_beds: 2450,
                occupied_city_beds: 1820,
                available_city_beds: 630,
                city_occupancy_rate: 74.3,
                total_icu_beds: 380,
                occupied_icu_beds: 315,
                available_icu_beds: 65,
                icu_occupancy_rate: 82.9,
                total_oxygen_beds: 520,
                available_oxygen_beds: 110,
                strain_status: "ICU SURGE WARNING"
            },
            hospital_bed_breakdown: [
                { hospital: "City General Hospital", ward: "Mumbai Urban", totalBeds: 250, genAvailable: 65, totalIcu: 40, icuAvailable: 6, oxygenAvailable: 12, status: "Near Capacity (ICU Alert)", alertColor: "amber" },
                { hospital: "KEM Municipal Hospital", ward: "Mumbai Central", totalBeds: 600, genAvailable: 120, totalIcu: 80, icuAvailable: 14, oxygenAvailable: 35, status: "Active Strain", alertColor: "indigo" },
                { hospital: "Cooper Hospital", ward: "Mumbai Suburban", totalBeds: 350, genAvailable: 95, totalIcu: 50, icuAvailable: 18, oxygenAvailable: 20, status: "Normal Operating", alertColor: "emerald" },
                { hospital: "Lilavati Medical Center", ward: "Bandra West", totalBeds: 280, genAvailable: 45, totalIcu: 45, icuAvailable: 4, oxygenAvailable: 8, status: "Critical ICU Surge", alertColor: "rose" },
                { hospital: "Sion Municipal Hospital", ward: "Sion East", totalBeds: 520, genAvailable: 180, totalIcu: 90, icuAvailable: 22, oxygenAvailable: 25, status: "Normal Operating", alertColor: "emerald" },
                { hospital: "SevenHills Hospital", ward: "Andheri East", totalBeds: 450, genAvailable: 125, totalIcu: 75, icuAvailable: 10, oxygenAvailable: 10, status: "Active Strain", alertColor: "indigo" }
            ]
        }
    });
};
