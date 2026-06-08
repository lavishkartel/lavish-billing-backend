import express from "express";
import { verifyMessage } from "ethers";
import { config } from "../config.js";
import { createWalletOrder, getWalletOrder } from "../lib/orderStore.js";

const router = express.Router();

router.post("/authorize", (req, res) => {
  const { orderId, productId, walletAddress, signature, message } = req.body as {
    orderId?: string;
    productId?: string;
    walletAddress?: string;
    signature?: string;
    message?: string;
  };

  if (!orderId || !productId || !walletAddress || !signature || !message) {
    return res.status(400).json({ error: "orderId, productId, walletAddress, signature, and message are required." });
  }

  if (!config.products.some((product) => product.id === productId)) {
    return res.status(400).json({ error: "Invalid productId." });
  }

  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch (error) {
    return res.status(400).json({ error: "Invalid signature." });
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    return res.status(400).json({ error: "Signature does not match wallet address." });
  }

  const order = createWalletOrder({
    orderId,
    productId,
    walletAddress,
    amountEther: config.cryptoPaymentAmount,
    signature,
    message
  });

  return res.json({
    orderId: order.orderId,
    status: order.status,
    paymentInstructions: {
      recipient: config.cryptoPaymentAddress,
      amount: config.cryptoPaymentAmount,
      token: config.cryptoPaymentToken,
      network: "Arbitrum"
    }
  });
});

router.get("/orders/:orderId", (req, res) => {
  const order = getWalletOrder(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  return res.json(order);
});

export default router;
