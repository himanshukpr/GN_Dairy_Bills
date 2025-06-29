// Quick script to check database schema
import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dairy_bills',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkSchema() {
    try {
        const client = await pool.connect();
        
        // Check if house_info table exists and its structure
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'house_info'
            ORDER BY ordinal_position;
        `);
        
        console.log('house_info table structure:');
        console.table(result.rows);
        
        // Check current data
        const dataResult = await client.query('SELECT * FROM house_info LIMIT 5');
        console.log('\nCurrent data:');
        console.table(dataResult.rows);
        
        client.release();
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
