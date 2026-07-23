import limsIntegrationService from '../services/limsIntegrationService.js';

export const triggerSync = async (req, res) => {
    try {
        const laboratoryId = req.user.institution_id;
        
        const result = await limsIntegrationService.syncData(laboratoryId);
        
        if (result.status === 'FAILED') {
            return res.status(500).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger LIMS sync' });
    }
};

export const getSyncStatus = (req, res) => {
    try {
        const status = limsIntegrationService.getStatus();
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get LIMS sync status' });
    }
};
