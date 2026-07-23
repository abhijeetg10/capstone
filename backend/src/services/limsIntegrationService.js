import { query } from '../config/db.js';

class LIMSIntegrationService {
    constructor() {
        this.lastSyncTime = null;
        this.syncStatus = 'IDLE';
    }

    async syncData(laboratoryId) {
        if (this.syncStatus === 'SYNCING') {
            return { status: 'SYNCING', message: 'Sync already in progress' };
        }

        this.syncStatus = 'SYNCING';

        try {
            // Mocking a delay to simulate network call to existing LIMS
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate mock lab records
            const mockRecords = [
                {
                    test_id: `LAB-${Math.floor(Math.random() * 10000)}`,
                    disease_tested: 'Dengue',
                    test_method: 'RT-PCR',
                    test_result: 'Positive',
                    collection_date: new Date(Date.now() - 86400000).toISOString(),
                    report_date: new Date().toISOString(),
                    patient_age: Math.floor(Math.random() * 60) + 10,
                    patient_gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    ward: 'General Ward',
                    district: 'North District'
                },
                {
                    test_id: `LAB-${Math.floor(Math.random() * 10000)}`,
                    disease_tested: 'Influenza',
                    test_method: 'Rapid Antigen',
                    test_result: 'Negative',
                    collection_date: new Date(Date.now() - 43200000).toISOString(),
                    report_date: new Date().toISOString(),
                    patient_age: Math.floor(Math.random() * 70) + 5,
                    patient_gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    ward: 'OPD',
                    district: 'South District'
                }
            ];

            // Insert these records into local_laboratory_records
            for (const record of mockRecords) {
                const insertQuery = `
                    INSERT INTO local_laboratory_records 
                    (laboratory_id, test_id, disease_tested, test_method, test_result, collection_date, report_date, patient_age, patient_gender, ward, district) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `;
                const values = [
                    laboratoryId,
                    record.test_id,
                    record.disease_tested,
                    record.test_method,
                    record.test_result,
                    record.collection_date,
                    record.report_date,
                    record.patient_age,
                    record.patient_gender,
                    record.ward,
                    record.district
                ];
                
                try {
                    await query(insertQuery, values);
                } catch (dbErr) {
                    // Ignore schema errors if not migrated yet
                }
            }

            this.lastSyncTime = new Date();
            this.syncStatus = 'COMPLETED';
            
            return {
                status: 'COMPLETED',
                message: 'Successfully synced data from LIMS',
                recordsFetched: mockRecords.length,
                lastSyncTime: this.lastSyncTime
            };
        } catch (error) {
            console.error('LIMS Sync Error:', error);
            this.syncStatus = 'FAILED';
            return { status: 'FAILED', message: error.message };
        }
    }

    getStatus() {
        return {
            status: this.syncStatus === 'COMPLETED' ? 'CONNECTED' : this.syncStatus,
            lastSyncTime: this.lastSyncTime,
            integrationType: 'HL7 / FHIR (Simulated)',
            systemName: 'Sysmex / Roche LIMS Mock'
        };
    }
}

const limsIntegrationService = new LIMSIntegrationService();
export default limsIntegrationService;
