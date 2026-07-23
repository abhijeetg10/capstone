import { query } from '../config/db.js';

class PMSIntegrationService {
    constructor() {
        this.lastSyncTime = null;
        this.syncStatus = 'IDLE';
    }

    async syncData(pharmacyId) {
        if (this.syncStatus === 'SYNCING') {
            return { status: 'SYNCING', message: 'Sync already in progress' };
        }

        this.syncStatus = 'SYNCING';

        try {
            // Mocking a delay to simulate network call to existing PMS
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Return empty records per zero-data requirement
            const mockRecords = [];

            this.lastSyncTime = new Date();
            this.syncStatus = 'COMPLETED';
            
            return {
                status: 'COMPLETED',
                message: 'Successfully synced data from PMS (Zero Data mode)',
                recordsFetched: mockRecords.length,
                lastSyncTime: this.lastSyncTime
            };
        } catch (error) {
            console.error('PMS Sync Error:', error);
            this.syncStatus = 'FAILED';
            return { status: 'FAILED', message: error.message };
        }
    }

    getStatus() {
        return {
            status: this.syncStatus === 'COMPLETED' ? 'CONNECTED' : this.syncStatus,
            lastSyncTime: this.lastSyncTime,
            integrationType: 'REST API (Simulated)',
            systemName: 'Generic PMS Mock'
        };
    }
}

const pmsIntegrationService = new PMSIntegrationService();
export default pmsIntegrationService;
