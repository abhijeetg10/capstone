-- 03_lims_integration.sql

-- Table to simulate/store anonymized laboratory test records fetched from existing LIMS
CREATE TABLE IF NOT EXISTS local_laboratory_records (
    id SERIAL PRIMARY KEY,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    test_id VARCHAR(100) NOT NULL, -- Anonymized ID
    disease_tested VARCHAR(150),
    test_method VARCHAR(150),
    test_result VARCHAR(50),
    collection_date TIMESTAMP,
    report_date TIMESTAMP,
    patient_age INT,
    patient_gender VARCHAR(20),
    ward VARCHAR(100),
    district VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by_ai BOOLEAN DEFAULT FALSE
);
