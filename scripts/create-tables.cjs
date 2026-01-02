const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kfbquadkplnnqovsbnji:Durga%219Qx%407B%2325Lm@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=allow'
});

async function createTables() {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');

    // Create shops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        location TEXT,
        phonecountrycode TEXT,
        contactnumber TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        pincode TEXT,
        image TEXT,
        rating NUMERIC,
        categories JSONB,
        gstno TEXT,
        owner_id UUID,
        disabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('✓ shops table created');

    // Create materials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        rate NUMERIC DEFAULT 0,
        shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
        unit TEXT,
        category TEXT,
        brandname TEXT,
        modelnumber TEXT,
        subcategory TEXT,
        technicalspecification TEXT,
        image TEXT,
        attributes JSONB,
        master_material_id UUID,
        disabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('✓ materials table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_shops_categories_gin ON shops USING gin (categories)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_materials_code ON materials (code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_materials_attributes_gin ON materials USING gin (attributes)`);
    console.log('✓ Indexes created');

    console.log('✅ All tables created successfully');
    client.release();
  } catch (err) {
    console.error('❌ Error:', err);
    client.release();
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
