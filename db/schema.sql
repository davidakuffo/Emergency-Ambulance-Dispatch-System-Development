-- Enable PostGIS (run once per database)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Ambulances
CREATE TABLE IF NOT EXISTS ambulances (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  location GEOGRAPHY(POINT, 4326),
  equipment_level VARCHAR(20),
  crew_size INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Emergency Calls
CREATE TABLE IF NOT EXISTS emergency_calls (
  id SERIAL PRIMARY KEY,
  caller_phone VARCHAR(20),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  severity_level INTEGER,
  call_time TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  assigned_ambulance_id INTEGER REFERENCES ambulances(id)
);

-- Dispatch Records
CREATE TABLE IF NOT EXISTS dispatches (
  id SERIAL PRIMARY KEY,
  call_id INTEGER REFERENCES emergency_calls(id),
  ambulance_id INTEGER REFERENCES ambulances(id),
  dispatch_time TIMESTAMP DEFAULT NOW(),
  arrival_time TIMESTAMP,
  completion_time TIMESTAMP,
  distance_traveled DECIMAL(8,2),
  response_time_seconds INTEGER
);

