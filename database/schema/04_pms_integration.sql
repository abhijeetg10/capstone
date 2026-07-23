-- 04_pms_integration.sql

-- Table to simulate/store anonymized pharmacy sales records fetched from existing PMS
CREATE TABLE IF NOT EXISTS local_pharmacy_records (
    id SERIAL PRIMARY KEY,
    pharmacy_id INT REFERENCES pharmacies(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) NOT NULL, -- Anonymized ID
    medicine_name VARCHAR(150),
    medicine_category VARCHAR(150),
    quantity_sold INT,
    prescription_required BOOLEAN DEFAULT FALSE,
    sale_date TIMESTAMP,
    district VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by_ai BOOLEAN DEFAULT FALSE
);
