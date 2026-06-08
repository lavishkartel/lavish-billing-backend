import express from "express";
import { cryptoListener } from "../lib/cryptoListener.js";

const router = express.Router();

router.get("/status", (_req, res) => {
  res.json(cryptoListener.status);
});

export default router;
