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
    await pool.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false");
    await pool.query("ALTER TABLE materials ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false");
    console.log('Added approved columns');

    // mark existing shops and materials as approved so dashboard shows them
    const shops = await pool.query('SELECT id FROM shops');
    for (const r of shops.rows) {
      await pool.query('UPDATE shops SET approved = true WHERE id = $1', [r.id]);
    }

    await pool.query('UPDATE materials SET approved = true');
    console.log('Marked existing shops and materials approved');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
