
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL,
    prediction_date TIMESTAMP NOT NULL,
    outbreak_probability FLOAT NOT NULL,
    risk_category VARCHAR(20) NOT NULL,
    hospital_cases FLOAT,
    lab_pos_rate FLOAT,
    pharm_sales_7d_mean FLOAT,
    temperature FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
