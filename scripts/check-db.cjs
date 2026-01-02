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
    const res = await pool.query('SELECT COUNT(*)::int AS count FROM shops');
    console.log('OK', res.rows[0].count);
  } catch (err) {
    console.error('ERR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
