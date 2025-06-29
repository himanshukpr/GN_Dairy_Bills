import { NextResponse } from 'next/server';
import { initializeDatabase, insertDairyBill, getAllDairyBills } from '../../../lib/db.js';

// Initialize database on first load
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function POST(request) {
  try {
    // Ensure database is initialized
    await ensureDbInitialized();
    
    const body = await request.json();
    
    // Validate required fields
    const { houseNumber, date, milkQty, milkAmount, cowMilk, cowMilkAmount, other } = body;
    
    if (!houseNumber || !date) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(milkQty) || isNaN(milkAmount) || isNaN(cowMilk) || isNaN(cowMilkAmount) || isNaN(other)) {
      return NextResponse.json(
        { error: 'Milk quantity, milk amount, cow milk, cow milk amount, and other must be valid numbers' },
        { status: 400 }
      );
    }

    // Create bill data object
    const billData = {
      houseNumber: houseNumber.trim(),
      date: date,
      milkQty: parseFloat(milkQty),
      milkAmount: parseFloat(milkAmount),
      cowMilk: parseFloat(cowMilk),
      cowMilkAmount: parseFloat(cowMilkAmount),
      other: parseFloat(other)
    };

    // Insert into database
    const newBill = await insertDairyBill(billData);

    console.log('New dairy bill created:', newBill);

    return NextResponse.json(
      { 
        message: 'Dairy bill submitted successfully',
        bill: newBill
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing dairy bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Ensure database is initialized
    await ensureDbInitialized();
    
    const bills = await getAllDairyBills();
    
    return NextResponse.json(
      { 
        bills: bills,
        totalBills: bills.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dairy bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
