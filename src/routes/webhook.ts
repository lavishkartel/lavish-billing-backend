import express from "express";
import { verifySquareSignature } from "../lib/squareWebhook.js";
import { config } from "../config.js";

const router = express.Router();

router.post("/square", (req, res) => {
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const signature = req.header("x-square-signature") ?? req.header("x-square-hmacsha256-signature");

  if (!verifySquareSignature(rawBody ?? Buffer.from(""), signature, config.squareWebhookSignatureKey)) {
    return res.status(403).json({ error: "Invalid Square webhook signature." });
  }

  console.log("Verified Square webhook event:", JSON.stringify(req.body));
  return res.status(200).json({ received: true });
});

router.post("/crypto", (req, res) => {
  console.log("Received external crypto webhook:", JSON.stringify(req.body));
  return res.status(200).json({ received: true });
});

export default router;
