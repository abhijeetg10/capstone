import pmsIntegrationService from '../services/pmsIntegrationService.js';

export const triggerSync = async (req, res) => {
    try {
        const pharmacyId = req.user.institution_id;
        
        const result = await pmsIntegrationService.syncData(pharmacyId);
        
        if (result.status === 'FAILED') {
            return res.status(500).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger PMS sync' });
    }
};

export const getSyncStatus = (req, res) => {
    try {
        const status = pmsIntegrationService.getStatus();
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get PMS sync status' });
    }
};
