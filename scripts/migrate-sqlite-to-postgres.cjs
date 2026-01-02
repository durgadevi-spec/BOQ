const Database = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const dbPath = path.resolve(__dirname, '../data/app.db');
  if (!fs.existsSync(dbPath)) {
    console.error('SQLite DB not found at', dbPath);
    process.exit(1);
  }

  const sqlite = new Database(dbPath, { readonly: true });
  const shops = sqlite.prepare('SELECT * FROM shops').all();
  const materials = sqlite.prepare('SELECT * FROM materials').all();

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL || 'postgresql://boq_admin:boq_admin_pass@localhost:5432/boq'
  });
  try {
    console.log('Connecting to Postgres...');
    await pool.connect();

    console.log(`Found ${shops.length} shops and ${materials.length} materials in SQLite.`);

    for (const s of shops) {
      const categories = s.categories ? (typeof s.categories === 'string' ? JSON.parse(s.categories) : s.categories) : null;
      const created_at = s.createdAt || s.created_at || new Date().toISOString();
      const owner_id = s.ownerId || s.owner_id || null;

      const insertShop = `INSERT INTO shops (id, name, location, city, state, country, pincode, image, rating, categories, gstno, owner_id, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO NOTHING`;

      await pool.query(insertShop, [s.id, s.name, s.location, s.city, s.state, s.country, s.pincode, s.image, s.rating, categories, s.gstNo || s.gstno || null, owner_id, created_at]);
    }

    for (const m of materials) {
      const attributes = m.attributes ? (typeof m.attributes === 'string' ? JSON.parse(m.attributes) : m.attributes) : null;
      const created_at = m.createdAt || m.created_at || new Date().toISOString();
      const shop_id = m.shopId || m.shop_id || null;

      const insertMat = `INSERT INTO materials (id, name, code, rate, shop_id, unit, category, brandname, modelnumber, subcategory, technicalspecification, image, attributes, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING`;

      await pool.query(insertMat, [m.id, m.name, m.code, m.rate || m.price || 0, shop_id, m.unit, m.category, m.brandName || m.brandname || null, m.modelNumber || m.modelnumber || null, m.subCategory || m.subcategory || null, m.technicalSpecification || m.technicalspecification || null, m.image, attributes, created_at]);
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
    sqlite.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
