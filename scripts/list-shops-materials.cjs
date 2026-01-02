const fs = require('fs');
const { Pool } = require('pg');

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const m = env.match(/DATABASE_URL="?(.*?)"?$/m);
const conn = m ? m[1] : process.env.DATABASE_URL;
if (!conn) {
  console.error('No DATABASE_URL');
  process.exit(2);
}

const pool = new Pool({ connectionString: conn });

(async () => {
  try {
    const shops = await pool.query('SELECT id, name, approved, disabled, created_at FROM shops ORDER BY created_at DESC');
    console.log('SHOPS:');
    console.log(shops.rows);

    const materials = await pool.query('SELECT id, name, code, shop_id, approved, created_at FROM materials ORDER BY created_at DESC');
    console.log('\nMATERIALS:');
    console.log(materials.rows);
  } catch (err) {
    console.error('ERR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
