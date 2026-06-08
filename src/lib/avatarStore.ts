import { v4 as uuidv4 } from "uuid";
import { getDatabase, saveDatabase } from "./db/database.js";
import type {
  Avatar,
  DesignStage,
  AvatarStatus,
  DesignStageData,
  AvatarAsset,
  AssetType,
} from "./db/avatarSchema.js";

function rowToObject(columns: string[], values: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

export class AvatarStore {
  private db = getDatabase();

  createAvatar(
    name: string,
    designer: string,
    description: string,
    renewable_features?: string[]
  ): Avatar {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO avatars (id, name, designer, description, renewable_features, createdAt, updatedAt, status, current_stage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        designer,
        description,
        renewable_features ? JSON.stringify(renewable_features) : null,
        now,
        now,
        "draft",
        "base_mesh",
      ]
    );

    saveDatabase();
    return this.getAvatar(id)!;
  }

  getAvatar(avatarId: string): Avatar | null {
    const stmt = this.db.prepare("SELECT * FROM avatars WHERE id = ?");
    stmt.bind([avatarId]);
    if (stmt.step()) {
      const row = rowToObject(stmt.getColumnNames(), stmt.get());
      stmt.free();
      return row as Avatar;
    }
    stmt.free();
    return null;
  }

  listAvatars(
    filters?: {
      status?: AvatarStatus;
      designer?: string;
      stage?: DesignStage;
    }
  ): Avatar[] {
    let query = "SELECT * FROM avatars WHERE 1=1";
    const params: (string | undefined)[] = [];

    if (filters?.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters?.designer) {
      query += " AND designer = ?";
      params.push(filters.designer);
    }
    if (filters?.stage) {
      query += " AND current_stage = ?";
      params.push(filters.stage);
    }

    query += " ORDER BY createdAt DESC";

    const stmt = this.db.prepare(query);
    stmt.bind(params);

    const result: Avatar[] = [];
    while (stmt.step()) {
      result.push(rowToObject(stmt.getColumnNames(), stmt.get()) as Avatar);
    }
    stmt.free();
    return result;
  }

  updateAvatar(avatarId: string, updates: Partial<Avatar>): Avatar {
    const avatar = this.getAvatar(avatarId);
    if (!avatar) throw new Error(`Avatar ${avatarId} not found`);

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.baseImageUrl !== undefined) {
      fields.push("baseImageUrl = ?");
      values.push(updates.baseImageUrl);
    }

    fields.push("updatedAt = ?");
    values.push(now);
    values.push(avatarId);

    this.db.run(`UPDATE avatars SET ${fields.join(", ")} WHERE id = ?`, values);
    saveDatabase();

    return this.getAvatar(avatarId)!;
  }

  archiveAvatar(avatarId: string): Avatar {
    return this.updateAvatar(avatarId, { status: "archived" });
  }

  createDesignStage(
    avatarId: string,
    stage: DesignStage,
    assignee?: string
  ): DesignStageData {
    const avatar = this.getAvatar(avatarId);
    if (!avatar) throw new Error(`Avatar ${avatarId} not found`);

    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO design_stages (id, avatarId, stage, createdAt, assignee)
       VALUES (?, ?, ?, ?, ?)`,
      [id, avatarId, stage, now, assignee || null]
    );

    saveDatabase();
    return this.getDesignStage(id)!;
  }

  getDesignStage(stageId: string): DesignStageData | null {
    const stmt = this.db.prepare("SELECT * FROM design_stages WHERE id = ?");
    stmt.bind([stageId]);
    if (stmt.step()) {
      const row = rowToObject(stmt.getColumnNames(), stmt.get());
      stmt.free();
      return row as DesignStageData;
    }
    stmt.free();
    return null;
  }

  completeDesignStage(stageId: string): DesignStageData {
    const stage = this.getDesignStage(stageId);
    if (!stage) throw new Error(`Stage ${stageId} not found`);

    const now = new Date().toISOString();
    this.db.run(
      `UPDATE design_stages SET completedAt = ? WHERE id = ?`,
      [now, stageId]
    );
    saveDatabase();

    return this.getDesignStage(stageId)!;
  }

  getStagesByAvatar(avatarId: string): DesignStageData[] {
    const stmt = this.db.prepare(
      "SELECT * FROM design_stages WHERE avatarId = ? ORDER BY createdAt DESC"
    );
    stmt.bind([avatarId]);

    const result: DesignStageData[] = [];
    while (stmt.step()) {
      result.push(
        rowToObject(stmt.getColumnNames(), stmt.get()) as DesignStageData
      );
    }
    stmt.free();
    return result;
  }

  addAsset(
    avatarId: string,
    stage: DesignStage,
    type: AssetType,
    url: string,
    fileSize: number,
    uploadedBy: string,
    metadata?: Record<string, unknown>
  ): AvatarAsset {
    const avatar = this.getAvatar(avatarId);
    if (!avatar) throw new Error(`Avatar ${avatarId} not found`);

    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO avatar_assets (id, avatarId, stage, type, url, fileSize, metadata, uploadedAt, uploadedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        avatarId,
        stage,
        type,
        url,
        fileSize,
        metadata ? JSON.stringify(metadata) : null,
        now,
        uploadedBy,
      ]
    );

    saveDatabase();
    return this.getAsset(id)!;
  }

  getAsset(assetId: string): AvatarAsset | null {
    const stmt = this.db.prepare("SELECT * FROM avatar_assets WHERE id = ?");
    stmt.bind([assetId]);
    if (stmt.step()) {
      const row = rowToObject(stmt.getColumnNames(), stmt.get());
      stmt.free();
      return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      } as AvatarAsset;
    }
    stmt.free();
    return null;
  }

  getAssetsByAvatar(avatarId: string, stage?: DesignStage): AvatarAsset[] {
    let query = "SELECT * FROM avatar_assets WHERE avatarId = ?";
    const params: (string | undefined)[] = [avatarId];

    if (stage) {
      query += " AND stage = ?";
      params.push(stage);
    }

    query += " ORDER BY uploadedAt DESC";

    const stmt = this.db.prepare(query);
    stmt.bind(params);

    const result: AvatarAsset[] = [];
    while (stmt.step()) {
      const row = rowToObject(stmt.getColumnNames(), stmt.get());
      result.push({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      } as AvatarAsset);
    }
    stmt.free();
    return result;
  }
}

export const avatarStore = new AvatarStore();
