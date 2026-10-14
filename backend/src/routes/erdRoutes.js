import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  getHospitalRecords, addHospitalRecord, updateHospitalRecord, bulkImportHospitalRecords, syncHospitalApi,
  getHospitalBeds, updateHospitalBeds,
  getLabRecords, addLabRecord, bulkImportLabRecords, syncLabApi,
  getPharmacyRecords, addPharmacyRecord, bulkImportPharmacyRecords, syncPharmacyApi
} from '../controllers/erdController.js';

const router = express.Router();

// Middleware: Authenticate token for all ERD routes
router.use(authenticateToken);

// --- Hospital ERD Routes (Restricted strictly to 'hospital' role) ---
router.get('/hospital/records', authorizeRoles('hospital'), getHospitalRecords);
router.post('/hospital/records', authorizeRoles('hospital'), addHospitalRecord);
router.put('/hospital/records/:id', authorizeRoles('hospital'), updateHospitalRecord);
router.post('/hospital/import-csv', authorizeRoles('hospital'), bulkImportHospitalRecords);
router.post('/hospital/sync', authorizeRoles('hospital'), syncHospitalApi);
router.get('/hospital/beds', authorizeRoles('hospital', 'super_admin', 'municipal_auth'), getHospitalBeds);
router.post('/hospital/beds', authorizeRoles('hospital'), updateHospitalBeds);

// --- Laboratory ERD Routes (Restricted strictly to 'laboratory' role) ---
router.get('/laboratory/records', authorizeRoles('laboratory'), getLabRecords);
router.post('/laboratory/records', authorizeRoles('laboratory'), addLabRecord);
router.post('/laboratory/import-csv', authorizeRoles('laboratory'), bulkImportLabRecords);
router.post('/laboratory/sync', authorizeRoles('laboratory'), syncLabApi);

// --- Pharmacy ERD Routes (Restricted strictly to 'pharmacy' role) ---
router.get('/pharmacy/records', authorizeRoles('pharmacy'), getPharmacyRecords);
router.post('/pharmacy/records', authorizeRoles('pharmacy'), addPharmacyRecord);
router.post('/pharmacy/import-csv', authorizeRoles('pharmacy'), bulkImportPharmacyRecords);
router.post('/pharmacy/sync', authorizeRoles('pharmacy'), syncPharmacyApi);

export default router;
