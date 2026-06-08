import express, { Request, Response } from "express";
import { avatarStore } from "../lib/avatarStore.js";
import { workflowEngine } from "../lib/workflowEngine.js";
import type { DesignStage } from "../lib/db/avatarSchema.js";

const router = express.Router();

// Create avatar
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      name,
      designer,
      description,
      renewable_features,
    } = req.body;

    if (!name || !designer || !description) {
      return res.status(400).json({
        error: "Missing required fields: name, designer, description",
      });
    }

    const avatar = avatarStore.createAvatar(
      name,
      designer,
      description,
      renewable_features
    );

    res.status(201).json(avatar);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get avatar with workflow state
router.get("/:avatarId", (req: Request, res: Response) => {
  try {
    const avatar = avatarStore.getAvatar(req.params.avatarId);
    if (!avatar) {
      return res.status(404).json({ error: "Avatar not found" });
    }

    const progress = workflowEngine.getStageProgress(req.params.avatarId);
    const assets = avatarStore.getAssetsByAvatar(req.params.avatarId);

    res.json({
      avatar,
      workflow: {
        current_stage: avatar.current_stage,
        progress,
      },
      assets,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update avatar
router.put("/:avatarId", (req: Request, res: Response) => {
  try {
    const updated = avatarStore.updateAvatar(req.params.avatarId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// List avatars
router.get("/", (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as any,
      designer: req.query.designer as string,
      stage: req.query.stage as DesignStage,
    };

    const avatars = avatarStore.listAvatars(filters);
    res.json(avatars);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Archive avatar
router.delete("/:avatarId", (req: Request, res: Response) => {
  try {
    const archived = avatarStore.archiveAvatar(req.params.avatarId);
    res.json(archived);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get workflow history
router.get("/:avatarId/workflow", (req: Request, res: Response) => {
  try {
    const avatar = avatarStore.getAvatar(req.params.avatarId);
    if (!avatar) {
      return res.status(404).json({ error: "Avatar not found" });
    }

    const audit = workflowEngine.getAuditTrail(req.params.avatarId);
    res.json(audit);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Advance workflow stage
router.post("/:avatarId/stage", (req: Request, res: Response) => {
  try {
    const { toStage, actor, override } = req.body;

    if (!toStage || !actor) {
      return res.status(400).json({
        error: "Missing required fields: toStage, actor",
      });
    }

    workflowEngine.advanceStage(
      req.params.avatarId,
      toStage,
      actor,
      override || false
    );

    const avatar = avatarStore.getAvatar(req.params.avatarId);
    res.json({
      message: `Avatar advanced to ${toStage}`,
      avatar,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get available next stages
router.get("/:avatarId/next-stages", (req: Request, res: Response) => {
  try {
    const avatar = avatarStore.getAvatar(req.params.avatarId);
    if (!avatar) {
      return res.status(404).json({ error: "Avatar not found" });
    }

    const nextStages = workflowEngine.getNextStages(
      avatar.current_stage
    );
    res.json({ current_stage: avatar.current_stage, next_stages: nextStages });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
