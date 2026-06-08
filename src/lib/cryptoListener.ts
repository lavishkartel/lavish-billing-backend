import { EventEmitter } from "events";
import { ethers } from "ethers";
import { config } from "../config.js";
import { notifyWebhook } from "./webhook.js";
import { findPendingOrderByAddressAndAmount, markWalletOrderPaid } from "./orderStore.js";

export type CryptoStatus = {
  active: boolean;
  lastChecked: string;
  lastMatchedTransaction?: {
    hash: string;
    from: string;
    amount: string;
    blockNumber: number;
    matchedOrderId?: string;
  };
  error?: string;
};

class CryptoPaymentListener extends EventEmitter {
  private provider: ethers.JsonRpcProvider;
  public status: CryptoStatus = {
    active: false,
    lastChecked: new Date(0).toISOString()
  };
  private intervalHandle?: NodeJS.Timeout;
  private polling = false;

  constructor() {
    super();
    this.provider = new ethers.JsonRpcProvider(config.cryptoRpcUrl);
  }

  public start() {
    if (this.intervalHandle) {
      return;
    }

    if (!config.cryptoRpcUrl || !config.cryptoPaymentAddress) {
      this.status = {
        active: false,
        lastChecked: new Date().toISOString(),
        error: "Crypto RPC URL or payment address is not configured."
      };
      return;
    }

    this.status.active = true;
    this.status.error = undefined;
    this.intervalHandle = setInterval(() => this.poll(), config.cryptoPollIntervalMs);
    this.poll().catch((error) => {
      this.status.error = (error as Error).message;
    });
  }

  public stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
    this.status.active = false;
  }

  private async poll() {
    if (this.polling) {
      return;
    }

    this.polling = true;
    const now = new Date();
    this.status.lastChecked = now.toISOString();

    try {
      const blockNumber = await this.provider.getBlockNumber();
      const minBlock = Math.max(blockNumber - 20, 0);
      const expectedValue = ethers.parseEther(config.cryptoPaymentAmount);
      const targetAddress = config.cryptoPaymentAddress.toLowerCase();

      for (let current = blockNumber; current >= minBlock; current -= 1) {
        const blockNumberHex = `0x${current.toString(16)}`;
        const block = await this.provider.send("eth_getBlockByNumber", [blockNumberHex, true]) as {
          number: number;
          transactions: Array<{ hash: string; from: string; to?: string; value: string }>;
        };

        if (!block?.transactions) {
          continue;
        }

        for (const tx of block.transactions) {
          if (!tx.to || !tx.from) {
            continue;
          }

          const txValue = ethers.toBigInt(tx.value);
          if (tx.to.toLowerCase() !== targetAddress || txValue !== expectedValue) {
            continue;
          }

          const matchedOrder = findPendingOrderByAddressAndAmount(tx.from, ethers.formatEther(txValue));
          const matchedOrderId = matchedOrder?.orderId;

          this.status.lastMatchedTransaction = {
            hash: tx.hash,
            from: tx.from,
            amount: ethers.formatEther(txValue),
            blockNumber: current,
            matchedOrderId
          };

          if (matchedOrderId) {
            markWalletOrderPaid(matchedOrderId, tx.hash, current);
          }

          this.emit("payment", this.status.lastMatchedTransaction);
          await notifyWebhook("crypto.payment", {
            hash: tx.hash,
            from: tx.from,
            amount: ethers.formatEther(txValue),
            blockNumber: current,
            matchedOrderId
          });
          return;
        }
      }
    } catch (error) {
      this.status.error = (error as Error).message;
      this.emit("error", error);
    } finally {
      this.polling = false;
    }
  }
}

export const cryptoListener = new CryptoPaymentListener();
