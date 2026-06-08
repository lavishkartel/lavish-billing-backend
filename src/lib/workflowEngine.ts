import { v4 as uuidv4 } from "uuid";
import { getDatabase, saveDatabase } from "./db/database.js";
import { avatarStore } from "./avatarStore.js";
import type {
  DesignStage,
  WorkflowAuditEntry,
  WorkflowAction,
} from "./db/avatarSchema.js";

function rowToObject(columns: string[], values: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

export class WorkflowEngine {
  private db = getDatabase();

  private readonly validTransitions: Record<DesignStage, DesignStage[]> = {
    base_mesh: ["streetwear"],
    streetwear: ["texturing"],
    texturing: ["rigging"],
    rigging: ["completed"],
    completed: [],
  };

  canTransition(
    currentStage: DesignStage,
    nextStage: DesignStage
  ): boolean {
    return this.validTransitions[currentStage]?.includes(nextStage) ?? false;
  }

  getNextStages(currentStage: DesignStage): DesignStage[] {
    return this.validTransitions[currentStage] || [];
  }

  advanceStage(
    avatarId: string,
    toStage: DesignStage,
    actor: string,
    override: boolean = false
  ): void {
    const avatar = avatarStore.getAvatar(avatarId);
    if (!avatar) throw new Error(`Avatar ${avatarId} not found`);

    const currentStage = avatar.current_stage;

    // Check if transition is allowed
    if (!override && !this.canTransition(currentStage, toStage)) {
      throw new Error(
        `Cannot transition from ${currentStage} to ${toStage}`
      );
    }

    // Update avatar current stage
    const status = toStage === "completed" ? "available" : "in_production";
    this.db.run(
      "UPDATE avatars SET current_stage = ?, status = ? WHERE id = ?",
      [toStage, status, avatarId]
    );
    saveDatabase();

    // Create design stage record
    avatarStore.createDesignStage(avatarId, toStage, actor);

    // Log to audit trail
    this.logAction(
      avatarId,
      "stage_advanced",
      actor,
      currentStage,
      toStage,
      { override }
    );
  }

  recordValidationResult(
    avatarId: string,
    stage: DesignStage,
    validator: string,
    passed: boolean,
    metrics: Record<string, unknown>,
    errors?: string[]
  ): void {
    const actor = "system";

    if (!passed) {
      this.logAction(
        avatarId,
        "validation_failed",
        actor,
        stage,
        stage,
        {
          validator,
          metrics,
          errors,
        }
      );
    }
  }

  recordAssetUpload(
    avatarId: string,
    stage: DesignStage,
    uploadedBy: string
  ): void {
    this.logAction(
      avatarId,
      "asset_uploaded",
      uploadedBy,
      stage,
      stage,
      {}
    );
  }

  private logAction(
    avatarId: string,
    action: WorkflowAction,
    actor: string,
    fromStage?: DesignStage,
    toStage?: DesignStage,
    details?: Record<string, unknown>
  ): void {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO workflow_audit (id, avatarId, timestamp, actor, action, fromStage, toStage, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        avatarId,
        now,
        actor,
        action,
        fromStage || null,
        toStage || null,
        details ? JSON.stringify(details) : null,
      ]
    );
    saveDatabase();
  }

  getAuditTrail(avatarId: string): WorkflowAuditEntry[] {
    const stmt = this.db.prepare(
      `SELECT * FROM workflow_audit WHERE avatarId = ? ORDER BY timestamp DESC`
    );
    stmt.bind([avatarId]);

    const result: WorkflowAuditEntry[] = [];
    while (stmt.step()) {
      const row = rowToObject(stmt.getColumnNames(), stmt.get());
      result.push({
        ...row,
        details: row.details ? JSON.parse(row.details) : {},
      } as WorkflowAuditEntry);
    }
    stmt.free();
    return result;
  }

  getStageProgress(avatarId: string): {
    stage: DesignStage;
    completedAt?: string;
    assignee?: string;
  }[] {
    const stages = avatarStore.getStagesByAvatar(avatarId);
    return stages.map((s) => ({
      stage: s.stage,
      completedAt: s.completedAt,
      assignee: s.assignee,
    }));
  }
}

export const workflowEngine = new WorkflowEngine();
