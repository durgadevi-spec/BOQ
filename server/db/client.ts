import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://boq_admin:boq_admin_pass@localhost:5432/boq";

console.log(
  "[db-client] Connecting to:",
  connectionString.includes("supabase") ? "SUPABASE ✓" : "LOCAL ✓"
);

const poolConfig: pg.PoolConfig = {
  connectionString,
};

if (connectionString.includes("supabase")) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new pg.Pool(poolConfig);

pool.on("error", (err) => {
  console.error("[db-pool] Unexpected error:", err);
});

pool
  .connect()
  .then((client) => {
    console.log("[db-pool] ✓ Database connected");
    client.release();
  })
  .catch((err) => {
    console.error("[db-pool] ✗ Database connection failed:", err.message);
  });

export async function query<T = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}

export default { pool, query };
