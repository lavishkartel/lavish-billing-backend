import express from "express";
import { config } from "../config.js";

const router = express.Router();

router.get("/config", (_req, res) => {
  return res.json({
    products: config.products,
    payments: {
      cryptoAddress: config.cryptoPaymentAddress,
      cryptoAmount: config.cryptoPaymentAmount,
      cryptoToken: config.cryptoPaymentToken
    }
  });
});

export default router;
