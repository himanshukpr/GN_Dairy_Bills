import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dairy_bills',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

// Function to create the dairy_bills table if it doesn't exist
export async function initializeDatabase() {
    try {
        const client = await pool.connect();

        // Create the dairy_bills table
        await client.query(`
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
      )
    `);
        await client.query(`
        -- Drop the table if it exists
        DROP TABLE IF EXISTS house_info;

        -- Create the house_info table
        CREATE TABLE house_info (
        id INTEGER PRIMARY KEY,                     
        date VARCHAR(255) NOT NULL,                 
        house_no VARCHAR(50) NOT NULL,              
        milk_rate NUMERIC(6, 2),                    
        cow_milk_rate NUMERIC(6, 2),                
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
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

        -- Insert sample house data
        INSERT INTO house_info (date, house_no, milk_rate, cow_milk_rate) VALUES 
        ('2025-06-28', 'A-101', 50.00, 60.00),
        ('2025-06-28', 'A-102', 52.00, 62.00),
        ('2025-06-28', 'B-201', 48.00, 58.00),
        ('2025-06-28', 'B-202', 51.00, 61.00),
        ('2025-06-28', 'C-301', 49.00, 59.00),
        ('2025-06-28', 'C-302', 53.00, 63.00);

    `);

        console.log('Database table initialized successfully');
        client.release();
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Function to insert a new dairy bill
export async function insertDairyBill(billData) {
    try {
        const client = await pool.connect();

        const query = `
      INSERT INTO dairy_bills (
        house_number, bill_date, milk_qty, milk_amount, 
        cow_milk, cow_milk_amount, other_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const values = [
            billData.houseNumber,
            billData.date,
            billData.milkQty,
            billData.milkAmount,
            billData.cowMilk,
            billData.cowMilkAmount,
            billData.other
        ];

        const result = await client.query(query, values);
        client.release();

        return result.rows[0];
    } catch (error) {
        console.error('Error inserting dairy bill:', error);
        throw error;
    }
}

// Function to get all dairy bills
export async function getAllDairyBills() {
    try {
        const client = await pool.connect();

        const query = `
      SELECT 
        id,
        house_number,
        bill_date,
        milk_qty,
        milk_amount,
        cow_milk,
        cow_milk_amount,
        other_amount,
        created_at
      FROM dairy_bills 
      ORDER BY created_at DESC
    `;

        const result = await client.query(query);
        client.release();

        return result.rows;
    } catch (error) {
        console.error('Error fetching dairy bills:', error);
        throw error;
    }
}

// Function to get dairy bills by house number
export async function getDairyBillsByHouse(houseNumber) {
    try {
        const client = await pool.connect();

        const query = `
      SELECT 
        id,
        house_number,
        bill_date,
        milk_qty,
        milk_amount,
        cow_milk,
        cow_milk_amount,
        other_amount,
        created_at
      FROM dairy_bills 
      WHERE house_number = $1
      ORDER BY created_at DESC
    `;

        const result = await client.query(query, [houseNumber]);
        client.release();

        return result.rows;
    } catch (error) {
        console.error('Error fetching dairy bills by house:', error);
        throw error;
    }
}


export async function gethousenumbers() {
    try {
        const client = await pool.connect();

        const query = `
            SELECT 
                id,
                date,
                house_no,
                milk_rate,
                cow_milk_rate,
                created_at
            FROM house_info 
            ORDER BY house_no ASC
        `;

        const result = await client.query(query);
        client.release();

        return result.rows;
    } catch (error) {
        console.error('Error fetching house numbers:', error);
        throw error;
    }
}

export default pool;
