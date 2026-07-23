-- 02_his_integration.sql

-- Table to simulate/store anonymized patient records fetched from the existing HIS/EHR system
CREATE TABLE IF NOT EXISTS local_patient_records (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
    internal_patient_id VARCHAR(100) NOT NULL, -- Anonymized ID
    age INT,
    gender VARCHAR(20),
    ward VARCHAR(100),
    symptoms TEXT[], -- Array of symptoms
    vital_signs JSONB, -- Stored as JSON
    lab_test_requests TEXT[],
    doctor_notes TEXT,
    admission_date TIMESTAMP,
    visit_type VARCHAR(50),
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
