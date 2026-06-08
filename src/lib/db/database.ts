import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../..", "data", "avatars.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: SqlJsDatabase | null = null;
let SQL: any = null;

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db && SQL) return db;

  // Initialize sql.js
  SQL = await initSqlJs();

  // Try to load existing database file
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS avatars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      designer TEXT NOT NULL,
      description TEXT NOT NULL,
      baseImageUrl TEXT,
      renewable_features TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      current_stage TEXT NOT NULL DEFAULT 'base_mesh'
    );

    CREATE TABLE IF NOT EXISTS design_stages (
      id TEXT PRIMARY KEY,
      avatarId TEXT NOT NULL,
      stage TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      assignee TEXT,
      notes TEXT,
      FOREIGN KEY (avatarId) REFERENCES avatars(id)
    );

    CREATE TABLE IF NOT EXISTS validation_results (
      id TEXT PRIMARY KEY,
      stageId TEXT NOT NULL,
      validator TEXT NOT NULL,
      status TEXT NOT NULL,
      metrics TEXT,
      errors TEXT,
      FOREIGN KEY (stageId) REFERENCES design_stages(id)
    );

    CREATE TABLE IF NOT EXISTS avatar_assets (
      id TEXT PRIMARY KEY,
      avatarId TEXT NOT NULL,
      stage TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      metadata TEXT,
      uploadedAt TEXT NOT NULL,
      uploadedBy TEXT NOT NULL,
      FOREIGN KEY (avatarId) REFERENCES avatars(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_audit (
      id TEXT PRIMARY KEY,
      avatarId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      fromStage TEXT,
      toStage TEXT,
      details TEXT,
      FOREIGN KEY (avatarId) REFERENCES avatars(id)
    );

    CREATE INDEX IF NOT EXISTS idx_avatars_designer ON avatars(designer);
    CREATE INDEX IF NOT EXISTS idx_avatars_status ON avatars(status);
    CREATE INDEX IF NOT EXISTS idx_avatars_stage ON avatars(current_stage);
    CREATE INDEX IF NOT EXISTS idx_design_stages_avatar ON design_stages(avatarId);
    CREATE INDEX IF NOT EXISTS idx_avatar_assets_avatar ON avatar_assets(avatarId);
    CREATE INDEX IF NOT EXISTS idx_workflow_audit_avatar ON workflow_audit(avatarId);
  `;

  // Split and execute each statement
  createTablesSql.split(";").forEach((sql) => {
    if (sql.trim()) {
      db.run(sql);
    }
  });

  // Save database to file
  saveDatabase();

  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!db || !SQL) {
    throw new Error("Database not initialized. Call await initDatabase() first.");
  }
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

