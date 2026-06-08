export type WalletOrderStatus = "pending" | "paid" | "expired" | "failed";

export type WalletOrder = {
  orderId: string;
  productId: string;
  walletAddress: string;
  amountEther: string;
  signature: string;
  message: string;
  createdAt: string;
  status: WalletOrderStatus;
  matchedTxHash?: string;
  matchedBlockNumber?: number;
};

const orders = new Map<string, WalletOrder>();

export function createWalletOrder(order: Omit<WalletOrder, "createdAt" | "status">): WalletOrder {
  const newOrder: WalletOrder = {
    ...order,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  orders.set(order.orderId, newOrder);
  return newOrder;
}

export function getWalletOrder(orderId: string): WalletOrder | undefined {
  return orders.get(orderId);
}

export function findPendingOrderByAddressAndAmount(walletAddress: string, amountEther: string): WalletOrder | undefined {
  return Array.from(orders.values()).find((order) =>
    order.status === "pending" &&
    order.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
    order.amountEther === amountEther
  );
}

export function markWalletOrderPaid(orderId: string, txHash: string, blockNumber: number): WalletOrder | undefined {
  const order = orders.get(orderId);
  if (!order) {
    return undefined;
  }

  order.status = "paid";
  order.matchedTxHash = txHash;
  order.matchedBlockNumber = blockNumber;
  return order;
}
