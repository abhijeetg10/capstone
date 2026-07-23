-- Enable PostGIS extension if available (handles spatial data)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users & Roles
CREATE TYPE user_role AS ENUM ('super_admin', 'municipal_auth', 'hospital', 'laboratory', 'pharmacy', 'researcher');

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Institutions
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS laboratories (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS pharmacies (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- 3. Data Tables (Aggregated Statistics ONLY, NO Patient Data)
CREATE TABLE IF NOT EXISTS hospital_stats (
    id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    disease VARCHAR(100) NOT NULL,
    total_patients INT DEFAULT 0,
    male_patients INT DEFAULT 0,
    female_patients INT DEFAULT 0,
    children INT DEFAULT 0,
    adults INT DEFAULT 0,
    senior_citizens INT DEFAULT 0,
    admissions INT DEFAULT 0,
    recoveries INT DEFAULT 0,
    deaths INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laboratory_stats (
    id SERIAL PRIMARY KEY,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    disease VARCHAR(100) NOT NULL,
    total_tests INT DEFAULT 0,
    positive_tests INT DEFAULT 0,
    negative_tests INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pharmacy_stats (
    id SERIAL PRIMARY KEY,
    pharmacy_id INT REFERENCES pharmacies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    district VARCHAR(100),
    taluka VARCHAR(100),
    ward VARCHAR(100),
    medicine_category VARCHAR(100) NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    quantity_sold INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Weather Data
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    district VARCHAR(100),
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    rainfall DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
    id SERIAL PRIMARY KEY,
    disease_type VARCHAR(100) NOT NULL,
    risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
    severity_level VARCHAR(50),
    confidence_score DECIMAL(5, 2),
    recommended_action TEXT,
    prediction_timestamp TIMESTAMP NOT NULL,
    district VARCHAR(100),
    ward VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom geometry(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Triggers to auto-populate geom from lat/long if PostGIS is enabled
CREATE OR REPLACE FUNCTION update_geom_from_latlon()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        BEGIN
            NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        EXCEPTION WHEN undefined_function THEN
            -- PostGIS not available, gracefully ignore
            NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hospital_geom BEFORE INSERT OR UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_hospital_stats_geom BEFORE INSERT OR UPDATE ON hospital_stats FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_lab_geom BEFORE INSERT OR UPDATE ON laboratories FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_lab_stats_geom BEFORE INSERT OR UPDATE ON laboratory_stats FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_pharm_geom BEFORE INSERT OR UPDATE ON pharmacies FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_pharm_stats_geom BEFORE INSERT OR UPDATE ON pharmacy_stats FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
CREATE TRIGGER trg_ai_geom BEFORE INSERT OR UPDATE ON ai_predictions FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon();
