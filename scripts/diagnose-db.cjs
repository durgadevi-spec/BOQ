#!/usr/bin/env node

const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Manual .env load
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const connectionString = envMatch ? envMatch[1] : "postgres://boq_admin:boq_admin_pass@localhost:5432/boq";

const pool = new pg.Pool({ connectionString });

(async () => {
  try {
    console.log('Attempting to connect to:', connectionString.split('@')[1] || 'localhost');
    
    // Test connection
    const conn = await pool.connect();
    console.log('✓ Connected to database');
    conn.release();
    
    // List tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nTables:', tables.rows.map(r => r.table_name));
    
    // Check shops table schema
    const shopsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shops'
      ORDER BY ordinal_position
    `);
    console.log('\nShops table columns:');
    shopsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check row count
    const shopCount = await pool.query('SELECT COUNT(*) as count FROM shops');
    const matCount = await pool.query('SELECT COUNT(*) as count FROM materials');
    console.log(`\nRow counts: shops=${shopCount.rows[0].count}, materials=${matCount.rows[0].count}`);
    
    // Test insert
    console.log('\n--- Testing INSERT ---');
    const { randomUUID } = require('crypto');
    const testId = randomUUID();
    const result = await pool.query(
      `INSERT INTO shops (id, name, location, phoneCountryCode, contactNumber, city, state, country, pincode, image, rating, categories, gstno, owner_id, approved, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now()) RETURNING id, name, approved`,
      [testId, 'Test Shop', 'Test Loc', null, null, null, null, null, null, null, null, '[]', null, null, false]
    );
    console.log('✓ Insert successful:', result.rows[0]);
    
    // Clean up test row
    await pool.query('DELETE FROM shops WHERE id = $1', [testId]);
    console.log('✓ Cleanup successful');
    
    await pool.end();
    console.log('\n✓ All diagnostics passed');
  } catch (err) {
    console.error('✗ Diagnostic failed:', err.message);
    process.exit(1);
  }
})();
