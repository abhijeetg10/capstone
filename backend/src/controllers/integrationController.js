import hisIntegrationService from '../services/hisIntegrationService.js';

export const triggerSync = async (req, res) => {
    try {
        // We use req.user.institution_id from checkOwnership/authenticateToken middleware
        const hospitalId = req.user.institution_id;
        
        const result = await hisIntegrationService.syncData(hospitalId);
        
        if (result.status === 'FAILED') {
            return res.status(500).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger HIS sync' });
    }
};

export const getSyncStatus = (req, res) => {
    try {
        const status = hisIntegrationService.getStatus();
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get HIS sync status' });
    }
};
