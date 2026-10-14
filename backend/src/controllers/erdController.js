import { query } from '../config/db.js';

// In-memory initial store for demonstration & fallback when DB tables are unseeded
let hospitalRecords = [
  {
    id: 'PAT-1001',
    name: 'Rajesh Kumar',
    age: 42,
    gender: 'Male',
    contact: '+91 98765 43210',
    visitDate: '2026-07-19',
    admissionDate: '2026-07-20',
    dischargeDate: '2026-07-28',
    diagnosisDate: '2026-07-21',
    fever: 1, cough: 0, diarrhea: 0, headache: 1, joint_pain: 1, rash: 1, fatigue: 1,
    disease: 'Leptospirosis',
    diagnosisStatus: 'Confirmed',
    ward: 'Ishwarpur Ward 3B',
    wardAreaId: 'WARD-3B-Z4',
    district: 'Ishwarpur City',
    comorbidities: ['Diabetes', 'Hypertension'],
    labTest: 'Leptospira Serology (MAT)',
    labResult: 'Positive',
    pathogen: 'Leptospira interrogans',
    visitType: 'Inpatient Admission',
    notes: 'Presents with high fever, headache, and severe joint pain following heavy rainfall',
    doctor: 'Dr. A. Sharma',
    status: 'Discharged'
  },
  {
    id: 'PAT-1002',
    name: 'Priya Sharma',
    age: 29,
    gender: 'Female',
    contact: '+91 98123 45678',
    visitDate: '2026-07-21',
    admissionDate: '2026-07-22',
    dischargeDate: 'N/A (Admitted)',
    diagnosisDate: '2026-07-22',
    fever: 1, cough: 1, diarrhea: 0, headache: 1, joint_pain: 1, rash: 0, fatigue: 1,
    disease: 'Dengue',
    diagnosisStatus: 'Confirmed',
    ward: 'Ishwarpur ICU-2',
    wardAreaId: 'ICU-WEST-02',
    district: 'Ishwarpur Central Ward',
    comorbidities: ['Asthma'],
    labTest: 'Dengue NS1 Ag & IgM',
    labResult: 'Positive',
    pathogen: 'Dengue Virus Type 2',
    visitType: 'Emergency Room',
    notes: 'Thrombocytopenia symptoms noted, severe headache and high grade fever',
    doctor: 'Dr. V. Patel',
    status: 'Admitted'
  },
  {
    id: 'PAT-1004',
    name: 'Sunita Gupta',
    age: 36,
    gender: 'Female',
    contact: '+91 96543 21098',
    visitDate: '2026-07-23',
    admissionDate: '2026-07-24',
    dischargeDate: '2026-07-27',
    diagnosisDate: '2026-07-24',
    fever: 1, cough: 0, diarrhea: 1, headache: 1, joint_pain: 0, rash: 0, fatigue: 1,
    disease: 'Gastroenteritis',
    diagnosisStatus: 'Confirmed',
    ward: 'Ishwarpur Ward 4C',
    wardAreaId: 'WARD-4C-E1',
    district: 'Ishwarpur East Ward',
    comorbidities: ['Hypertension'],
    labTest: 'Stool Pathogen Culture',
    labResult: 'Positive',
    pathogen: 'Salmonella enterica',
    visitType: 'Inpatient Admission',
    notes: 'Severe watery diarrhea, dehydration, and headache',
    doctor: 'Dr. M. Joshi',
    status: 'Discharged'
  },
  {
    id: 'PAT-1006',
    name: 'Sanjay Deshmukh',
    age: 34,
    gender: 'Male',
    contact: '+91 91122 33445',
    visitDate: '2026-07-26',
    admissionDate: '2026-07-26',
    dischargeDate: '2026-07-30',
    diagnosisDate: '2026-07-26',
    fever: 0, cough: 0, diarrhea: 0, headache: 0, joint_pain: 0, rash: 0, fatigue: 0,
    disease: 'Bone Fracture (Orthopedic)',
    diagnosisStatus: 'Confirmed',
    ward: 'Ortho Ward',
    wardAreaId: 'ORTHO-S1',
    district: 'Ishwarpur North Ward',
    comorbidities: [],
    labTest: 'Routine Pre-Op Blood Panel',
    labResult: 'Negative',
    pathogen: 'None',
    visitType: 'Inpatient Admission',
    notes: 'Right tibia fracture due to accidental fall',
    doctor: 'Dr. R. Kapoor',
    status: 'Discharged'
  },
  {
    id: 'PAT-1007',
    name: 'Kavita Menon',
    age: 50,
    gender: 'Female',
    contact: '+91 92233 44556',
    visitDate: '2026-07-26',
    admissionDate: 'N/A (OPD)',
    dischargeDate: '2026-07-26 (Same Day)',
    diagnosisDate: '2026-07-26',
    fever: 0, cough: 0, diarrhea: 0, headache: 0, joint_pain: 0, rash: 0, fatigue: 0,
    disease: 'Routine Health Checkup',
    diagnosisStatus: 'Confirmed',
    ward: 'OPD Checkup',
    wardAreaId: 'OPD-ROOM-12',
    district: 'Ishwarpur South Ward',
    comorbidities: ['Diabetes'],
    labTest: 'HbA1c & Lipids',
    labResult: 'Negative',
    pathogen: 'None',
    visitType: 'OPD Outpatient',
    notes: 'Annual executive health screening & blood work',
    doctor: 'Dr. S. Nair',
    status: 'Discharged'
  },
  {
    id: 'PAT-1008',
    name: 'Rahul Bose',
    age: 26,
    gender: 'Male',
    contact: '+91 93344 55667',
    visitDate: '2026-07-27',
    admissionDate: '2026-07-27',
    dischargeDate: 'N/A (Admitted)',
    diagnosisDate: '2026-07-27',
    fever: 1, cough: 1, diarrhea: 0, headache: 1, joint_pain: 0, rash: 0, fatigue: 1,
    disease: 'Undiagnosed / Under Investigation',
    diagnosisStatus: 'Suspected',
    ward: 'Ishwarpur Ward 1B',
    wardAreaId: 'WARD-1B-N3',
    district: 'Ishwarpur City',
    comorbidities: [],
    labTest: 'Multiplex Viral Panel',
    labResult: 'Pending',
    pathogen: 'Under Investigation',
    visitType: 'Inpatient Admission',
    notes: 'Unspecified mild fever with persistent headache, lab tests pending',
    doctor: 'Dr. A. Sharma',
    status: 'Admitted'
  }
];

let labRecords = [
  { id: 'LAB-5001', patientId: 'PAT-1001', patientName: 'Rajesh Kumar', age: 42, gender: 'Male', specimenType: 'Blood (Serology)', sampleDate: '2026-07-20', testResult: 'Positive', pathogen: 'Leptospira interrogans', pathologist: 'Dr. K. Mehta', status: 'Completed' },
  { id: 'LAB-5002', patientId: 'PAT-1002', patientName: 'Priya Sharma', age: 29, gender: 'Female', specimenType: 'NS1 Antigen (Dengue)', sampleDate: '2026-07-22', testResult: 'Positive', pathogen: 'Dengue Virus Type 2', pathologist: 'Dr. K. Mehta', status: 'Completed' },
  { id: 'LAB-5003', patientId: 'PAT-1004', patientName: 'Sunita Gupta', age: 36, gender: 'Female', specimenType: 'Stool Pathogen Culture', sampleDate: '2026-07-24', testResult: 'Positive', pathogen: 'Salmonella enterica', pathologist: 'Dr. R. Desai', status: 'Completed' },
  { id: 'LAB-5004', patientId: 'PAT-1005', patientName: 'Amit Verma', age: 31, gender: 'Male', specimenType: 'Blood Smear (Giemsa)', sampleDate: '2026-07-25', testResult: 'Positive', pathogen: 'Plasmodium falciparum', pathologist: 'Dr. N. Shah', status: 'Completed' },
  { id: 'LAB-5005', patientId: 'PAT-1009', patientName: 'Sneha Kulkarni', age: 24, gender: 'Female', specimenType: 'Nasopharyngeal Swab (RT-PCR)', sampleDate: '2026-07-26', testResult: 'Positive', pathogen: 'Influenza A (H1N1)', pathologist: 'Dr. K. Mehta', status: 'Completed' },
  { id: 'LAB-5006', patientId: 'PAT-1010', patientName: 'Vikram Patil', age: 48, gender: 'Male', specimenType: 'Widal Serology Slide', sampleDate: '2026-07-26', testResult: 'Positive', pathogen: 'Salmonella typhi', pathologist: 'Dr. R. Desai', status: 'Completed' },
  { id: 'LAB-5007', patientId: 'PAT-1006', patientName: 'Sanjay Deshmukh', age: 34, gender: 'Male', specimenType: 'Pre-Op CBC & Coagulation', sampleDate: '2026-07-26', testResult: 'Negative', pathogen: 'None (Routine)', pathologist: 'Dr. N. Shah', status: 'Completed' },
  { id: 'LAB-5008', patientId: 'PAT-1007', patientName: 'Kavita Menon', age: 50, gender: 'Female', specimenType: 'HbA1c & Fasting Glucose', sampleDate: '2026-07-26', testResult: 'Negative', pathogen: 'None (Metabolic)', pathologist: 'Dr. K. Mehta', status: 'Completed' },
  { id: 'LAB-5009', patientId: 'PAT-1008', patientName: 'Rahul Bose', age: 26, gender: 'Male', specimenType: 'Blood Culture & Sensitivity', sampleDate: '2026-07-27', testResult: 'Pending', pathogen: 'Under Analysis', pathologist: 'Dr. R. Desai', status: 'In-Progress' },
  { id: 'LAB-5010', patientId: 'PAT-1011', patientName: 'Ananya Roy', age: 33, gender: 'Female', specimenType: 'Sputum Acid-Fast Stain', sampleDate: '2026-07-27', testResult: 'Positive', pathogen: 'Mycobacterium tuberculosis', pathologist: 'Dr. N. Shah', status: 'Completed' }
];

let pharmacyRecords = [
  { 
    id: 'RX-9001', 
    patientId: 'PAT-1001', 
    patientName: 'Rajesh Kumar', 
    age: 42, 
    doctor: 'Dr. A. Sharma', 
    medicines: [
      { medicine: 'Doxycycline 100mg', category: 'Antibiotic', quantity: 20, dosage: '1-0-1 (10 days)' },
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 15, dosage: '1-1-1 (5 days)' }
    ],
    totalQuantity: 35,
    surgeFlag: 'High Demand', 
    transactionDate: '2026-07-21' 
  },
  { 
    id: 'RX-9002', 
    patientId: 'PAT-1002', 
    patientName: 'Priya Sharma', 
    age: 29, 
    doctor: 'Dr. V. Patel', 
    medicines: [
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 30, dosage: '1-1-1 (10 days)' },
      { medicine: 'ORS Electrolyte Packets', category: 'Electrolytes', quantity: 10, dosage: 'As needed' },
      { medicine: 'IV Normal Saline 0.9%', category: 'Fluids', quantity: 5, dosage: '500ml IV Infusion' }
    ],
    totalQuantity: 45,
    surgeFlag: 'Surging', 
    transactionDate: '2026-07-22' 
  },
  { 
    id: 'RX-9003', 
    patientId: 'PAT-1004', 
    patientName: 'Sunita Gupta', 
    age: 36, 
    doctor: 'Dr. M. Joshi', 
    medicines: [
      { medicine: 'Azithromycin 500mg', category: 'Antibiotic', quantity: 5, dosage: '1-0-0 (5 days)' },
      { medicine: 'ORS & Zinc Supplement', category: 'Electrolytes', quantity: 15, dosage: '2 times daily' },
      { medicine: 'Ciprofloxacin 500mg', category: 'Antibiotic', quantity: 10, dosage: '1-0-1 (5 days)' }
    ],
    totalQuantity: 30,
    surgeFlag: 'High Demand', 
    transactionDate: '2026-07-24' 
  },
  {
    id: 'RX-9004',
    patientId: 'PAT-1005',
    patientName: 'Amit Verma',
    age: 31,
    doctor: 'Dr. N. Shah',
    medicines: [
      { medicine: 'Artemether + Lumefantrine 80/480mg', category: 'Antimalarial', quantity: 24, dosage: '1-0-1 (3 days)' },
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 15, dosage: 'As needed' }
    ],
    totalQuantity: 39,
    surgeFlag: 'Surging',
    transactionDate: '2026-07-25'
  },
  {
    id: 'RX-9005',
    patientId: 'PAT-1009',
    patientName: 'Sneha Kulkarni',
    age: 24,
    doctor: 'Dr. A. Sharma',
    medicines: [
      { medicine: 'Oseltamivir 75mg (Tamiflu)', category: 'Antiviral', quantity: 10, dosage: '1-0-1 (5 days)' },
      { medicine: 'Vitamin C 500mg + Zinc', category: 'Supplements', quantity: 30, dosage: '1-0-0' },
      { medicine: 'Cough Syrup 100ml', category: 'Expectorant', quantity: 2, dosage: '10ml thrice daily' }
    ],
    totalQuantity: 42,
    surgeFlag: 'Surging',
    transactionDate: '2026-07-26'
  },
  {
    id: 'RX-9006',
    patientId: 'PAT-1010',
    patientName: 'Vikram Patil',
    age: 48,
    doctor: 'Dr. R. Desai',
    medicines: [
      { medicine: 'Ceftriaxone 1g Injection', category: 'Antibiotic', quantity: 7, dosage: '1 IV daily' },
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 20, dosage: '1-1-1' },
      { medicine: 'ORS Electrolyte Packets', category: 'Electrolytes', quantity: 10, dosage: 'Ad libitum' }
    ],
    totalQuantity: 37,
    surgeFlag: 'High Demand',
    transactionDate: '2026-07-26'
  },
  {
    id: 'RX-9007',
    patientId: 'PAT-1006',
    patientName: 'Sanjay Deshmukh',
    age: 34,
    doctor: 'Dr. R. Kapoor',
    medicines: [
      { medicine: 'Tramadol + Paracetamol', category: 'Analgesic', quantity: 10, dosage: '1-0-1' },
      { medicine: 'Calcium Carbonate + Vit D3', category: 'Supplements', quantity: 30, dosage: '1-0-0' },
      { medicine: 'Elastic Crepe Bandage 10cm', category: 'Surgicals', quantity: 2, dosage: 'For local application' }
    ],
    totalQuantity: 42,
    surgeFlag: 'Normal',
    transactionDate: '2026-07-26'
  },
  {
    id: 'RX-9008',
    patientId: 'PAT-1007',
    patientName: 'Kavita Menon',
    age: 50,
    doctor: 'Dr. S. Nair',
    medicines: [
      { medicine: 'Metformin 500mg SR', category: 'Antidiabetic', quantity: 60, dosage: '1-0-1' },
      { medicine: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: 30, dosage: '1-0-0' }
    ],
    totalQuantity: 90,
    surgeFlag: 'Normal',
    transactionDate: '2026-07-26'
  },
  {
    id: 'RX-9009',
    patientId: 'PAT-1008',
    patientName: 'Rahul Bose',
    age: 26,
    doctor: 'Dr. A. Sharma',
    medicines: [
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 15, dosage: '1-1-1' },
      { medicine: 'ORS Electrolyte Packets', category: 'Electrolytes', quantity: 10, dosage: 'As required' }
    ],
    totalQuantity: 25,
    surgeFlag: 'Normal',
    transactionDate: '2026-07-27'
  },
  {
    id: 'RX-9010',
    patientId: 'PAT-1011',
    patientName: 'Ananya Roy',
    age: 33,
    doctor: 'Dr. N. Shah',
    medicines: [
      { medicine: 'Rifampicin + Isoniazid 150/75mg', category: 'Antitubercular', quantity: 60, dosage: '2 tablets once daily' },
      { medicine: 'Pyridoxine Vitamin B6 40mg', category: 'Supplements', quantity: 30, dosage: '1 tablet daily' }
    ],
    totalQuantity: 90,
    surgeFlag: 'High Demand',
    transactionDate: '2026-07-27'
  }
];

// --- Hospital ERD Controllers ---
export const getHospitalRecords = (req, res) => {
  res.status(200).json({ success: true, data: hospitalRecords });
};

export const addHospitalRecord = (req, res) => {
  const record = req.body;
  const newId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
  const todayStr = new Date().toISOString().split('T')[0];
  
  const newRecord = { 
    id: newId, 
    visitDate: record.visitDate || todayStr,
    admissionDate: record.admissionDate || todayStr, 
    dischargeDate: record.dischargeDate || 'N/A (Admitted)',
    diagnosisDate: record.diagnosisDate || todayStr,
    diagnosisStatus: record.diagnosisStatus || 'Confirmed',
    wardAreaId: record.wardAreaId || `${record.ward || 'WARD'}-SEC1`,
    district: record.district || 'Mumbai Urban',
    comorbidities: Array.isArray(record.comorbidities) ? record.comorbidities : [],
    labTest: record.labTest || 'General Blood Panel',
    labResult: record.labResult || 'Pending',
    pathogen: record.pathogen || 'Under Investigation',
    visitType: record.visitType || 'Inpatient Admission',
    headache: Number(record.headache) || 0,
    diarrhea: Number(record.diarrhea) || 0,
    fever: Number(record.fever) || 0,
    cough: Number(record.cough) || 0,
    joint_pain: Number(record.joint_pain) || 0,
    rash: Number(record.rash) || 0,
    fatigue: Number(record.fatigue) || 0,
    status: record.status || 'Admitted', 
    ...record 
  };

  hospitalRecords.unshift(newRecord);
  res.status(201).json({ success: true, message: 'Patient EHR record added successfully', data: newRecord });
};

export const updateHospitalRecord = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = hospitalRecords.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Patient record not found' });
  }

  hospitalRecords[index] = {
    ...hospitalRecords[index],
    ...updates,
    dischargeDate: updates.dischargeDate !== undefined ? updates.dischargeDate : hospitalRecords[index].dischargeDate,
    status: updates.status || hospitalRecords[index].status
  };

  res.status(200).json({
    success: true,
    message: `Patient ${id} record updated successfully`,
    data: hospitalRecords[index]
  });
};

export const bulkImportHospitalRecords = (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid or empty record set' });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const imported = records.map((r, idx) => ({
    id: r.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    name: r.name || `Patient ${idx + 1}`,
    age: Number(r.age) || 30,
    gender: r.gender || 'Male',
    contact: r.contact || '+91 99000 00000',
    visitDate: r.visitDate || todayStr,
    admissionDate: r.admissionDate || todayStr,
    dischargeDate: r.dischargeDate || '2026-07-28',
    diagnosisDate: r.diagnosisDate || todayStr,
    fever: Number(r.fever) || 0,
    cough: Number(r.cough) || 0,
    diarrhea: Number(r.diarrhea) || 0,
    headache: Number(r.headache) || 0,
    joint_pain: Number(r.joint_pain) || 0,
    rash: Number(r.rash) || 0,
    fatigue: Number(r.fatigue) || 0,
    disease: r.disease || 'Undiagnosed',
    diagnosisStatus: r.diagnosisStatus || 'Confirmed',
    ward: r.ward || 'General Ward',
    wardAreaId: r.wardAreaId || 'WARD-GEN-01',
    district: r.district || 'Mumbai Urban',
    comorbidities: Array.isArray(r.comorbidities) ? r.comorbidities : (typeof r.comorbidities === 'string' ? r.comorbidities.split(';') : []),
    labTest: r.labTest || 'Standard Panel',
    labResult: r.labResult || 'Negative',
    pathogen: r.pathogen || 'None',
    visitType: r.visitType || 'Inpatient Admission',
    doctor: r.doctor || 'Attending Physician',
    notes: r.notes || '',
    status: r.status || 'Admitted'
  }));

  hospitalRecords = [...imported, ...hospitalRecords];
  res.status(200).json({ success: true, message: `Successfully imported ${imported.length} CSV records to Hospital ERD`, count: imported.length });
};

export const syncHospitalApi = (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const simulatedLiveRecords = [
    { 
      id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`, 
      name: 'Ananya Deshmukh', 
      age: 31, 
      gender: 'Female', 
      contact: '+91 91234 56789', 
      visitDate: todayStr,
      admissionDate: todayStr, 
      dischargeDate: 'N/A (Admitted)',
      diagnosisDate: todayStr,
      fever: 1, cough: 1, diarrhea: 0, headache: 1, joint_pain: 1, rash: 0, fatigue: 1, 
      disease: 'Malaria', 
      diagnosisStatus: 'Confirmed',
      ward: 'Ward 2A', 
      wardAreaId: 'WARD-2A-N1',
      district: 'Mumbai Suburban',
      comorbidities: ['Asthma'],
      labTest: 'Blood Smear (Plasmodium vivax)',
      labResult: 'Positive',
      pathogen: 'Plasmodium vivax',
      visitType: 'Inpatient Admission',
      doctor: 'Dr. C. Rao', 
      notes: 'High intermittent fever with chills and headache',
      status: 'Admitted' 
    },
    { 
      id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`, 
      name: 'Deepak Chawla', 
      age: 44, 
      gender: 'Male', 
      contact: '+91 92345 67890', 
      visitDate: todayStr,
      admissionDate: todayStr, 
      dischargeDate: 'N/A (Admitted)',
      diagnosisDate: todayStr,
      fever: 1, cough: 0, diarrhea: 1, headache: 1, joint_pain: 1, rash: 0, fatigue: 1, 
      disease: 'Leptospirosis', 
      diagnosisStatus: 'Confirmed',
      ward: 'ICU-1', 
      wardAreaId: 'ICU-EAST-01',
      district: 'Thane Central',
      comorbidities: ['Diabetes', 'Hypertension'],
      labTest: 'Leptospira PCR',
      labResult: 'Positive',
      pathogen: 'Leptospira interrogans',
      visitType: 'Emergency Room',
      doctor: 'Dr. A. Sharma', 
      notes: 'Waterborne infection symptoms with acute renal risk',
      status: 'Admitted' 
    }
  ];

  hospitalRecords = [...simulatedLiveRecords, ...hospitalRecords];
  res.status(200).json({
    success: true,
    message: 'Direct HIS API sync completed successfully',
    syncedRecordsCount: simulatedLiveRecords.length,
    newRecords: simulatedLiveRecords
  });
};

// --- Laboratory ERD Controllers ---
export const getLabRecords = (req, res) => {
  res.status(200).json({ success: true, data: labRecords });
};

export const addLabRecord = (req, res) => {
  const record = req.body;
  const newId = `LAB-${Math.floor(5000 + Math.random() * 4000)}`;
  const newRecord = { id: newId, sampleDate: new Date().toISOString().split('T')[0], status: 'Completed', ...record };
  labRecords.unshift(newRecord);
  res.status(201).json({ success: true, message: 'Lab Test ERD record added successfully', data: newRecord });
};

export const bulkImportLabRecords = (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Invalid CSV format' });
  }

  const imported = records.map((r, idx) => ({
    id: r.id || `LAB-${Math.floor(5000 + Math.random() * 4000)}`,
    patientId: r.patientId || `PAT-${1000 + idx}`,
    patientName: r.patientName || `Patient ${idx + 1}`,
    age: Number(r.age) || 35,
    gender: r.gender || 'Male',
    specimenType: r.specimenType || 'Blood Sample',
    sampleDate: r.sampleDate || new Date().toISOString().split('T')[0],
    testResult: r.testResult || 'Positive',
    pathogen: r.pathogen || 'Pathogen Positive',
    pathologist: r.pathologist || 'Duty Pathologist',
    status: r.status || 'Completed'
  }));

  labRecords = [...imported, ...labRecords];
  res.status(200).json({ success: true, message: `Successfully imported ${imported.length} CSV records to Lab ERD`, count: imported.length });
};

export const syncLabApi = (req, res) => {
  const simulatedSync = [
    { id: `LAB-${Math.floor(5000 + Math.random() * 4000)}`, patientId: 'PAT-1088', patientName: 'Rohan Joshi', age: 27, gender: 'Male', specimenType: 'Blood Smear', sampleDate: new Date().toISOString().split('T')[0], testResult: 'Positive', pathogen: 'Plasmodium vivax (Malaria)', pathologist: 'Dr. K. Mehta', status: 'Completed' }
  ];
  labRecords = [...simulatedSync, ...labRecords];
  res.status(200).json({ success: true, message: 'Direct LIMS API sync completed successfully', syncedRecordsCount: simulatedSync.length, newRecords: simulatedSync });
};

// --- Pharmacy ERD Controllers ---
export const getPharmacyRecords = (req, res) => {
  res.status(200).json({ success: true, data: pharmacyRecords });
};

export const addPharmacyRecord = (req, res) => {
  const record = req.body;
  const newId = `RX-${Math.floor(9000 + Math.random() * 900)}`;

  const medicines = Array.isArray(record.medicines) && record.medicines.length > 0
    ? record.medicines.map(m => ({
        medicine: m.medicine || 'Doxycycline 100mg',
        category: m.category || 'General',
        quantity: Number(m.quantity) || 1,
        dosage: m.dosage || '1-0-1'
      }))
    : [{ medicine: record.medicine || 'Doxycycline 100mg', category: record.category || 'Antibiotic', quantity: Number(record.quantity) || 10, dosage: '1-0-1' }];

  const totalQuantity = medicines.reduce((sum, item) => sum + item.quantity, 0);

  const newRecord = { 
    id: newId, 
    patientId: record.patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: record.patientName || 'Anonymous Patient',
    age: Number(record.age) || 35,
    doctor: record.doctor || 'Attending Physician',
    medicines,
    totalQuantity,
    surgeFlag: record.surgeFlag || 'Normal',
    transactionDate: new Date().toISOString().split('T')[0] 
  };

  pharmacyRecords.unshift(newRecord);
  res.status(201).json({ success: true, message: 'Pharmacy Prescription ERD record added successfully', data: newRecord });
};

export const bulkImportPharmacyRecords = (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Invalid CSV format' });
  }

  const imported = records.map((r, idx) => {
    const medList = Array.isArray(r.medicines) && r.medicines.length > 0 
      ? r.medicines 
      : [{ medicine: r.medicine || 'Doxycycline 100mg', category: r.category || 'Antibiotic', quantity: Number(r.quantity) || 10, dosage: 'As prescribed' }];

    const totalQty = medList.reduce((s, m) => s + (Number(m.quantity) || 1), 0);

    return {
      id: r.id || `RX-${Math.floor(9000 + Math.random() * 900)}`,
      patientId: r.patientId || `PAT-${1000 + idx}`,
      patientName: r.patientName || `Patient ${idx + 1}`,
      age: Number(r.age) || 30,
      doctor: r.doctor || 'Dr. Physician',
      medicines: medList,
      totalQuantity: totalQty,
      surgeFlag: r.surgeFlag || 'Normal',
      transactionDate: r.transactionDate || new Date().toISOString().split('T')[0]
    };
  });

  pharmacyRecords = [...imported, ...pharmacyRecords];
  res.status(200).json({ success: true, message: `Successfully imported ${imported.length} CSV records to Pharmacy ERD`, count: imported.length });
};

export const syncPharmacyApi = (req, res) => {
  const simulatedSync = [
    { 
      id: `RX-${Math.floor(9000 + Math.random() * 900)}`, 
      patientId: 'PAT-1099', 
      patientName: 'Kavita Roy', 
      age: 38, 
      doctor: 'Dr. S. Nair',
      medicines: [
        { medicine: 'Salbutamol Inhaler 100mcg', category: 'Bronchodilator', quantity: 2, dosage: '2 puffs as needed' },
        { medicine: 'Montelukast 10mg', category: 'Antiasthmatic', quantity: 30, dosage: '0-0-1 (30 days)' }
      ],
      totalQuantity: 32,
      surgeFlag: 'High Demand', 
      transactionDate: new Date().toISOString().split('T')[0] 
    }
  ];
  pharmacyRecords = [...simulatedSync, ...pharmacyRecords];
  res.status(200).json({ success: true, message: 'Direct PMS API sync completed successfully', syncedRecordsCount: simulatedSync.length, newRecords: simulatedSync });
};

// --- Hospital Bed Management Controllers ---
let hospitalBedStats = {
  hospitalName: 'City General Hospital',
  district: 'Mumbai Urban',
  totalBeds: 250,
  occupiedBeds: 185,
  availableBeds: 65,
  totalIcuBeds: 40,
  occupiedIcuBeds: 34,
  availableIcuBeds: 6,
  totalOxygenBeds: 60,
  occupiedOxygenBeds: 48,
  availableOxygenBeds: 12,
  ventilatorBeds: 20,
  availableVentilators: 4,
  lastUpdated: new Date().toISOString()
};

export const getHospitalBeds = (req, res) => {
  res.status(200).json({ success: true, data: hospitalBedStats });
};

export const updateHospitalBeds = (req, res) => {
  const updates = req.body;
  const newTotal = updates.totalBeds !== undefined ? Number(updates.totalBeds) : hospitalBedStats.totalBeds;
  const newOccupied = updates.occupiedBeds !== undefined ? Number(updates.occupiedBeds) : hospitalBedStats.occupiedBeds;
  const newIcuTotal = updates.totalIcuBeds !== undefined ? Number(updates.totalIcuBeds) : hospitalBedStats.totalIcuBeds;
  const newIcuOccupied = updates.occupiedIcuBeds !== undefined ? Number(updates.occupiedIcuBeds) : hospitalBedStats.occupiedIcuBeds;
  const newOxygenTotal = updates.totalOxygenBeds !== undefined ? Number(updates.totalOxygenBeds) : hospitalBedStats.totalOxygenBeds;
  const newOxygenOccupied = updates.occupiedOxygenBeds !== undefined ? Number(updates.occupiedOxygenBeds) : hospitalBedStats.occupiedOxygenBeds;

  hospitalBedStats = {
    ...hospitalBedStats,
    ...updates,
    totalBeds: newTotal,
    occupiedBeds: newOccupied,
    availableBeds: Math.max(0, newTotal - newOccupied),
    totalIcuBeds: newIcuTotal,
    occupiedIcuBeds: newIcuOccupied,
    availableIcuBeds: Math.max(0, newIcuTotal - newIcuOccupied),
    totalOxygenBeds: newOxygenTotal,
    occupiedOxygenBeds: newOxygenOccupied,
    availableOxygenBeds: Math.max(0, newOxygenTotal - newOxygenOccupied),
    lastUpdated: new Date().toISOString()
  };

  res.status(200).json({ success: true, message: 'Hospital bed capacity updated successfully', data: hospitalBedStats });
};
