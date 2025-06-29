import { NextResponse } from 'next/server';
import { initializeDatabase, gethousenumbers } from '../../../lib/db.js';

// Initialize database on first load
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    // Ensure database is initialized
    await ensureDbInitialized();
    
    const houseNumbers = await gethousenumbers();
    
    return NextResponse.json(
      { 
        houseNumbers: houseNumbers,
        totalHouses: houseNumbers.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching house numbers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
