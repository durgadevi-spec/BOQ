#!/usr/bin/env node

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

// Load .env file
let dbUrl = process.env.DATABASE_URL;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (match && match[1]) {
    dbUrl = match[1];
  }
}

// Set TLS to not reject self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

const client = new Client({
  connectionString: dbUrl,
  ssl: 'require'
});

async function migrate() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Create material_templates table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS material_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created material_templates table');

    // Add template_id column to materials table if it doesn't exist
    const hasTemplateId = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'materials' AND column_name = 'template_id'
      );
    `);

    if (!hasTemplateId.rows[0].exists) {
      await client.query(`
        ALTER TABLE materials
        ADD COLUMN template_id UUID REFERENCES material_templates(id);
      `);
      console.log('✓ Added template_id column to materials table');
    } else {
      console.log('ℹ template_id column already exists');
    }

    // Create material_submissions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS material_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES material_templates(id),
        shop_id UUID NOT NULL REFERENCES shops(id),
        rate DECIMAL(12, 2),
        unit VARCHAR(50),
        brandname VARCHAR(255),
        modelnumber VARCHAR(255),
        subcategory VARCHAR(100),
        technicalspecification TEXT,
        approved BOOLEAN DEFAULT FALSE,
        approval_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created material_submissions table');

    console.log('\n✓ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
