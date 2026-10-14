-- 02_his_integration.sql

-- Table to simulate/store anonymized patient records fetched from the existing HIS/EHR system
CREATE TABLE IF NOT EXISTS local_patient_records (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
    internal_patient_id VARCHAR(100) NOT NULL, -- Anonymized ID
    age INT,
    gender VARCHAR(20),
    ward VARCHAR(100),
    ward_area_id VARCHAR(100),
    district VARCHAR(100),
    symptoms TEXT[], -- Array of symptoms e.g. Fever, Cough, Diarrhea, Headache
    comorbidities TEXT[], -- Array of comorbidities e.g. Diabetes, Hypertension
    vital_signs JSONB, -- Stored as JSON
    lab_test_name VARCHAR(150),
    lab_result VARCHAR(50), -- Positive, Negative, Pending
    pathogen_detected VARCHAR(150),
    lab_test_requests TEXT[],
    doctor_notes TEXT,
    diagnosis VARCHAR(255),
    diagnosis_status VARCHAR(50), -- Confirmed, Suspected, Presumptive
    visit_date TIMESTAMP,
    admission_date TIMESTAMP,
    discharge_date TIMESTAMP,
    diagnosis_date TIMESTAMP,
    visit_type VARCHAR(50), -- Inpatient, Outpatient OPD, Emergency
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by_ai BOOLEAN DEFAULT FALSE
);

-- Table to store AI-detected symptom clusters
CREATE TABLE IF NOT EXISTS symptom_clusters (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
    cluster_name VARCHAR(255),
    symptoms TEXT[],
    patient_count INT DEFAULT 0,
    predicted_disease VARCHAR(255),
    confidence_score DECIMAL(5, 2),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);
