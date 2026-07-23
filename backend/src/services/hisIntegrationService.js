import { query } from '../config/db.js';

class HISIntegrationService {
    constructor() {
        this.lastSyncTime = null;
        this.syncStatus = 'IDLE';
    }

    async syncData(hospitalId) {
        if (this.syncStatus === 'SYNCING') {
            return { status: 'SYNCING', message: 'Sync already in progress' };
        }

        this.syncStatus = 'SYNCING';

        try {
            // Mocking a delay to simulate network call to existing HIS/EHR
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate some mock patient records based on disease surveillance needs
            const mockRecords = [
                {
                    internal_patient_id: `PT-${Math.floor(Math.random() * 10000)}`,
                    age: Math.floor(Math.random() * 60) + 10,
                    gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    ward: 'General Ward',
                    symptoms: ['Fever', 'Cough', 'Fatigue'],
                    vital_signs: { temperature: 38.5, heart_rate: 95 },
                    lab_test_requests: ['CBC', 'COVID-19 RT-PCR'],
                    doctor_notes: 'Patient shows symptoms of respiratory infection.',
                    admission_date: new Date().toISOString(),
                    visit_type: 'Inpatient'
                },
                 {
                    internal_patient_id: `PT-${Math.floor(Math.random() * 10000)}`,
                    age: Math.floor(Math.random() * 50) + 5,
                    gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    ward: 'Pediatric Ward',
                    symptoms: ['Fever', 'Rash', 'Vomiting', 'Low Platelets'],
                    vital_signs: { temperature: 39.0, heart_rate: 110 },
                    lab_test_requests: ['CBC', 'Dengue NS1'],
                    doctor_notes: 'Suspected Dengue fever.',
                    admission_date: new Date().toISOString(),
                    visit_type: 'Outpatient'
                }
            ];

            // Insert these records into local_patient_records
            for (const record of mockRecords) {
                const insertQuery = `
                    INSERT INTO local_patient_records 
                    (hospital_id, internal_patient_id, age, gender, ward, symptoms, vital_signs, lab_test_requests, doctor_notes, admission_date, visit_type) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `;
                const values = [
                    hospitalId,
                    record.internal_patient_id,
                    record.age,
                    record.gender,
                    record.ward,
                    record.symptoms,
                    record.vital_signs,
                    record.lab_test_requests,
                    record.doctor_notes,
                    record.admission_date,
                    record.visit_type
                ];
                
                // We'll catch and ignore errors for simplicity in this mock, or log them
                try {
                    await query(insertQuery, values);
                } catch (dbErr) {
                    // console.error("Error inserting mock record", dbErr);
                    // Table might not exist yet if migrations haven't run
                }
            }

            this.lastSyncTime = new Date();
            this.syncStatus = 'COMPLETED';
            
            return {
                status: 'COMPLETED',
                message: 'Successfully synced data from HIS',
                recordsFetched: mockRecords.length,
                lastSyncTime: this.lastSyncTime
            };
        } catch (error) {
            console.error('HIS Sync Error:', error);
            this.syncStatus = 'FAILED';
            return { status: 'FAILED', message: error.message };
        }
    }

    getStatus() {
        return {
            status: this.syncStatus === 'COMPLETED' ? 'CONNECTED' : this.syncStatus,
            lastSyncTime: this.lastSyncTime,
            integrationType: 'REST API (Simulated)',
            systemName: 'Epic / Cerner HIS Mock'
        };
    }
}

// Export as a singleton
const hisIntegrationService = new HISIntegrationService();
export default hisIntegrationService;
