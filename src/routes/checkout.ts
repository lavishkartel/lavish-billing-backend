import express from "express";
import { createSquareCheckout } from "../lib/square.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { orderId, items } = req.body as { orderId?: string; items?: Array<{name:string;quantity:number;priceCents:number}> };

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "orderId and items are required." });
    }

    const checkoutUrl = await createSquareCheckout(orderId, items);
    return res.json({ checkoutUrl });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
