import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kfbquadkplnnqovsbnji:Durga%2B123@db.kfbquadkplnnqovsbnji.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seedMaterialTemplates() {
  try {
    console.log('[seed] Connecting to database...');
    const client = await pool.connect();

    // Check if templates already exist
    const checkResult = await client.query('SELECT COUNT(*) FROM material_templates');
    const existingCount = parseInt(checkResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`[seed] Material templates already exist (${existingCount}). Skipping seed.`);
      client.release();
      pool.end();
      return;
    }

    const templates = [
      { name: 'Industrial Paint', code: 'TPL-PAINT-001', category: 'Paint' },
      { name: 'Hydraulic Cement', code: 'TPL-CEMENT-001', category: 'Concrete' },
      { name: 'Stainless Steel Bolt M10', code: 'TPL-BOLT-M10', category: 'Fasteners' },
      { name: 'Wooden Door Frame', code: 'TPL-DOOR-001', category: 'Doors' },
      { name: 'Electrical Wire 2.5mm', code: 'TPL-WIRE-2.5', category: 'Electrical' },
      { name: 'PVC Pipe 50mm', code: 'TPL-PIPE-50', category: 'Plumbing' },
    ];

    for (const template of templates) {
      const id = randomUUID();
      const result = await client.query(
        `INSERT INTO material_templates (id, name, code, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [id, template.name, template.code, template.category]
      );
      console.log(`✓ Created template: ${result.rows[0].name} (${result.rows[0].code})`);
    }

    console.log(`[seed] ✓ Successfully seeded ${templates.length} material templates`);
    client.release();
  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

seedMaterialTemplates();
