# Dairy Bills App - PostgreSQL Setup

## Prerequisites

1. **Install PostgreSQL**
   - Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - Make sure to remember your password for the `postgres` user

## Database Setup

### Step 1: Create Database
1. Open PostgreSQL command line (psql) or pgAdmin
2. Connect as the `postgres` user
3. Create the database:
   ```sql
   CREATE DATABASE dairy_bills;
   ```

### Step 2: Run Setup Script
1. Connect to the `dairy_bills` database
2. Run the SQL script located at `database/setup.sql`
   ```bash
   psql -U postgres -d dairy_bills -f database/setup.sql
   ```

### Step 3: Configure Environment Variables
1. Update the `.env.local` file with your PostgreSQL credentials:
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=dairy_bills
   DB_PASSWORD=your_actual_password
   DB_PORT=5432
   ```

## Database Schema

### Table: dairy_bills
- `id` - Primary key (auto-increment)
- `house_number` - House/customer identifier
- `bill_date` - Date of the bill
- `milk_qty` - Quantity of regular milk (liters)
- `milk_amount` - Amount for regular milk (currency)
- `cow_milk` - Quantity of cow milk (liters)
- `cow_milk_amount` - Amount for cow milk (currency)
- `other_amount` - Other charges
- `created_at` - Timestamp when record was created

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

- `POST /api/dairy-bills` - Create a new dairy bill
- `GET /api/dairy-bills` - Get all dairy bills

## Troubleshooting

### Connection Issues
1. Ensure PostgreSQL service is running
2. Check if your credentials in `.env.local` are correct
3. Verify the database name exists
4. Check if the port (default 5432) is correct

### Permission Issues
1. Make sure your PostgreSQL user has the necessary permissions
2. If using a different user than `postgres`, ensure they have access to the `dairy_bills` database

## Features

- ✅ PostgreSQL integration
- ✅ Automatic table creation
- ✅ Data validation
- ✅ Error handling
- ✅ Environment-based configuration
