export type DesignStage = "base_mesh" | "streetwear" | "texturing" | "rigging" | "completed";
export type AvatarStatus = "draft" | "in_production" | "available" | "archived";
export type AssetType = "mesh" | "texture" | "collision" | "rig";
export type WorkflowAction = "stage_advanced" | "asset_uploaded" | "validation_failed" | "override";

export interface Avatar {
  id: string;
  name: string;
  designer: string;
  description: string;
  baseImageUrl?: string;
  renewable_features?: string; // JSON array as string
  createdAt: string; // ISO8601
  updatedAt: string;
  status: AvatarStatus;
  current_stage: DesignStage;
}

export interface DesignStageData {
  id: string;
  avatarId: string;
  stage: DesignStage;
  createdAt: string;
  completedAt?: string;
  assignee?: string;
  notes?: string;
}

export interface ValidationResult {
  id: string;
  stageId: string;
  validator: string;
  status: "passed" | "failed";
  metrics: string; // JSON object as string
  errors?: string; // JSON array as string
}

export interface AvatarAsset {
  id: string;
  avatarId: string;
  stage: DesignStage;
  type: AssetType;
  url: string;
  fileSize: number;
  metadata: string; // JSON object as string
  uploadedAt: string;
  uploadedBy: string;
}

export interface WorkflowAuditEntry {
  id: string;
  avatarId: string;
  timestamp: string;
  actor: string;
  action: WorkflowAction;
  fromStage?: DesignStage;
  toStage?: DesignStage;
  details: string; // JSON object as string
}
