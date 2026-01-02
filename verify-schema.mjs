#!/usr/bin/env node

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

// Load .env file
let dbUrl = 'postgresql://postgres.kfbquadkplnnqovsbnji:Durga%219Qx%407B%2325Lm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=allow';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (match && match[1]) {
    dbUrl = match[1];
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check material_templates table
    console.log('Material Templates Table:');
    let result = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'material_templates'
      ORDER BY ordinal_position
    `);
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check material_submissions table
    console.log('\nMaterial Submissions Table:');
    result = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'material_submissions'
      ORDER BY ordinal_position
    `);
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check if materials table has template_id
    console.log('\nMaterials Table (checking for template_id):');
    result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'materials' AND column_name = 'template_id'
      ) as has_template_id
    `);
    console.log(`  ✓ template_id column exists: ${result.rows[0].has_template_id}`);

    console.log('\n✓ Database schema verified!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

test();
