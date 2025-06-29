import { NextResponse } from 'next/server';
import { initializeDatabase, gethousenumbers } from '../../../lib/db.js';
import pool from '../../../lib/db.js';

// Initialize database on first load
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// GET - Get all house numbers
export async function GET() {
  try {
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

// POST - Create new house number
export async function POST(request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    
    const { house_no, milk_rate, cow_milk_rate } = body;
    
    if (!house_no || !milk_rate || !cow_milk_rate) {
      return NextResponse.json(
        { error: 'House number, milk rate, and cow milk rate are required' },
        { status: 400 }
      );
    }

    if (isNaN(milk_rate) || isNaN(cow_milk_rate)) {
      return NextResponse.json(
        { error: 'Milk rates must be valid numbers' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    const query = `
      INSERT INTO house_info (house_no, milk_rate, cow_milk_rate) 
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [house_no.trim(), parseFloat(milk_rate), parseFloat(cow_milk_rate)];
    
    const result = await client.query(query, values);
    client.release();
    
    return NextResponse.json(
      { 
        message: 'House number created successfully',
        house: result.rows[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating house number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update house number
export async function PUT(request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    
    const { id, house_no, milk_rate, cow_milk_rate } = body;
    
    if (!id || !house_no || !milk_rate || !cow_milk_rate) {
      return NextResponse.json(
        { error: 'ID, house number, milk rate, and cow milk rate are required' },
        { status: 400 }
      );
    }

    if (isNaN(milk_rate) || isNaN(cow_milk_rate)) {
      return NextResponse.json(
        { error: 'Milk rates must be valid numbers' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    const query = `
      UPDATE house_info 
      SET house_no = $1, milk_rate = $2, cow_milk_rate = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [house_no.trim(), parseFloat(milk_rate), parseFloat(cow_milk_rate), parseInt(id)];
    
    const result = await client.query(query, values);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'House number not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'House number updated successfully',
        house: result.rows[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating house number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete house number
export async function DELETE(request) {
  try {
    await ensureDbInitialized();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    const query = `
      DELETE FROM house_info 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [parseInt(id)]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'House number not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'House number deleted successfully',
        house: result.rows[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting house number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
