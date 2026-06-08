import express from "express";
import { config } from "./config.js";
import checkoutRoutes from "./routes/checkout.js";
import cryptoRoutes from "./routes/crypto.js";
import commerceRoutes from "./routes/commerce.js";
import webhookRoutes from "./routes/webhook.js";
import walletRoutes from "./routes/wallet.js";
import avatarRoutes from "./routes/avatars.js";
import { cryptoListener } from "./lib/cryptoListener.js";
import { initDatabase, closeDatabase } from "./lib/db/database.js";

const app = express();

// Initialize database
await initDatabase();

app.use(express.json({
  verify(req, _res, buf) {
    (req as any).rawBody = buf;
  }
}));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});

app.use(express.static("public"));
app.use("/api/checkout", checkoutRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/commerce", commerceRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/avatars", avatarRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/api/status", (_req, res) => {
  res.json({ service: "Lavish Legacy billing backend", status: "online" });
});

app.get("/*", (_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(config.port, () => {
  console.log(`Lavish Legacy billing backend listening on port ${config.port}`);
  cryptoListener.start();
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  closeDatabase();
  process.exit(0);
});
