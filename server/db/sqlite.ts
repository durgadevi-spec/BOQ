import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../data/app.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

export function initializeDatabase() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      phoneCountryCode TEXT,
      contactNumber TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      pincode TEXT,
      image TEXT,
      rating REAL,
      gstNo TEXT,
      ownerId TEXT,
      categories TEXT,
      approved BOOLEAN DEFAULT FALSE,
      approvedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      rate REAL NOT NULL,
      shopId TEXT,
      unit TEXT,
      category TEXT,
      brandName TEXT,
      modelNumber TEXT,
      subCategory TEXT,
      technicalSpecification TEXT,
      image TEXT,
      attributes TEXT,
      approved BOOLEAN DEFAULT FALSE,
      approvedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shopId) REFERENCES shops(id)
    );
  `);
}

export function query<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function execute(sql: string, params: any[] = []): void {
  const stmt = db.prepare(sql);
  stmt.run(...params);
}

export function insert(table: string, data: Record<string, any>): any {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
  execute(sql, values);
  return data;
}

export function update(table: string, data: Record<string, any>, where: Record<string, any>): void {
  const setClause = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  const whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  execute(sql, [...Object.values(data), ...Object.values(where)]);
}

export function deleteRecord(table: string, where: Record<string, any>): void {
  const whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  execute(sql, Object.values(where));
}

// Convenience functions for shops and materials
export function getAllShops() {
  return query("SELECT * FROM shops ORDER BY createdAt DESC");
}

export function getShopById(id: string) {
  return queryOne("SELECT * FROM shops WHERE id = ?", [id]);
}

export function createShop(data: Record<string, any>) {
  const { id, name, location, phoneCountryCode, contactNumber, city, state, country, pincode, image, rating, categories, gstNo, ownerId } = data;
  return insert("shops", {
    id,
    name,
    location,
    phoneCountryCode,
    contactNumber,
    city,
    state,
    country,
    pincode,
    image,
    rating,
    categories: Array.isArray(categories) ? JSON.stringify(categories) : null,
    gstNo,
    ownerId,
  });
}

export function updateShop(id: string, data: Record<string, any>) {
  return update("shops", data, { id });
}

export function deleteShop(id: string) {
  return deleteRecord("shops", { id });
}

export function getAllMaterials() {
  return query("SELECT * FROM materials ORDER BY createdAt DESC");
}

export function getMaterialById(id: string) {
  return queryOne("SELECT * FROM materials WHERE id = ?", [id]);
}

export function getMaterialsByShop(shopId: string) {
  return query("SELECT * FROM materials WHERE shopId = ? ORDER BY createdAt DESC", [shopId]);
}

export function createMaterial(data: Record<string, any>) {
  const { id, name, code, rate, shopId, unit, category, brandName, modelNumber, subCategory, technicalSpecification, image, attributes } = data;
  return insert("materials", {
    id,
    name,
    code,
    rate,
    shopId,
    unit,
    category,
    brandName,
    modelNumber,
    subCategory,
    technicalSpecification,
    image,
    attributes: typeof attributes === 'string' ? attributes : JSON.stringify(attributes),
  });
}

export function updateMaterial(id: string, data: Record<string, any>) {
  return update("materials", data, { id });
}

export function deleteMaterial(id: string) {
  return deleteRecord("materials", { id });
}
