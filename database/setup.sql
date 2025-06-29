-- Dairy Bills Database Setup Script
-- Run this script in your PostgreSQL database

-- Create database (run this as superuser)
-- CREATE DATABASE dairy_bills;

-- Connect to the dairy_bills database and run the following:

-- Create the dairy_bills table
CREATE TABLE IF NOT EXISTS dairy_bills (
    id SERIAL PRIMARY KEY,
    house_number VARCHAR(255) NOT NULL,
    bill_date DATE NOT NULL,
    milk_qty DECIMAL(10,2) NOT NULL,
    milk_amount DECIMAL(10,2) NOT NULL,
    cow_milk DECIMAL(10,2) NOT NULL,
    cow_milk_amount DECIMAL(10,2) NOT NULL,
    other_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop the table if it exists
DROP TABLE IF EXISTS house_info;

-- Create the house_info table
CREATE TABLE house_info (
  id INTEGER PRIMARY KEY,                     -- Continuous ID (gapless)
  date VARCHAR(255) NOT NULL,                 -- Record date
  house_no VARCHAR(50) NOT NULL,              -- House / customer number
  milk_rate NUMERIC(6, 2),                    -- Buffalo/combined milk rate
  cow_milk_rate NUMERIC(6, 2),                -- Cow milk rate
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp
);

-- Trigger function to assign continuous IDs
CREATE OR REPLACE FUNCTION assign_continuous_house_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM house_info;
  NEW.id := next_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set the continuous ID before insert
CREATE TRIGGER set_continuous_house_id
BEFORE INSERT ON house_info
FOR EACH ROW
EXECUTE FUNCTION assign_continuous_house_id();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dairy_bills_house_number ON dairy_bills(house_number);
CREATE INDEX IF NOT EXISTS idx_dairy_bills_date ON dairy_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_dairy_bills_created_at ON dairy_bills(created_at);
CREATE INDEX IF NOT EXISTS idx_house_info_house_no ON house_info(house_no);

-- Insert sample house data
INSERT INTO house_info (date, house_no, milk_rate, cow_milk_rate) 
VALUES 
    ('2025-06-28', 'A-101', 50.00, 60.00),
    ('2025-06-28', 'A-102', 52.00, 62.00),
    ('2025-06-28', 'B-201', 48.00, 58.00),
    ('2025-06-28', 'B-202', 51.00, 61.00),
    ('2025-06-28', 'C-301', 49.00, 59.00),
    ('2025-06-28', 'C-302', 53.00, 63.00);

-- Insert some sample dairy bills data (optional)
INSERT INTO dairy_bills (house_number, bill_date, milk_qty, milk_amount, cow_milk, cow_milk_amount, other_amount) 
VALUES 
    ('A-101', '2025-06-28', 2.5, 125.00, 1.0, 60.00, 25.00),
    ('B-202', '2025-06-28', 3.0, 150.00, 1.5, 90.00, 30.00),
    ('C-301', '2025-06-28', 2.0, 100.00, 0.5, 30.00, 15.00);

-- Verify the data
SELECT * FROM house_info ORDER BY house_no;
SELECT * FROM dairy_bills ORDER BY created_at DESC;
