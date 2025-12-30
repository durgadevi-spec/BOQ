import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgres://boq_admin:boq_admin_pass@localhost:5432/boq";

export const pool = new pg.Pool({ connectionString });

export async function query<T = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}

export default { pool, query };
