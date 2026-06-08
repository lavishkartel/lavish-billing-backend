const productGrid = document.getElementById("productGrid");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const cryptoAddress = document.getElementById("cryptoAddress");
const cryptoAmount = document.getElementById("cryptoAmount");
const cryptoToken = document.getElementById("cryptoToken");
const cryptoStatus = document.getElementById("cryptoStatus");
const statusBadge = document.getElementById("statusBadge");
const fiatCheckoutBtn = document.getElementById("fiatCheckoutBtn");
const walletCheckoutBtn = document.getElementById("walletCheckoutBtn");
const cryptoConnectBtn = document.getElementById("cryptoConnectBtn");
const cryptoPayBtn = document.getElementById("cryptoPayBtn");
const checkStatusBtn = document.getElementById("checkStatusBtn");
const walletStatus = document.getElementById("walletStatus");

let selectedProduct = null;
let walletAddress = null;
let commerceConfig = null;
let currentOrderId = null;

function decimalToHexWei(amount) {
  const [whole, fraction = ""] = amount.split(".");
  const padded = (whole || "0") + fraction.padEnd(18, "0");
  const cleaned = padded.replace(/^0+(?=\d)/, "");
  return `0x${BigInt(cleaned || "0").toString(16)}`;
}

function setSelectedProduct(product) {
  selectedProduct = product;
  productName.textContent = product.name;
  productDescription.textContent = product.description;
  productPrice.textContent = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.priceCents / 100);
  fiatCheckoutBtn.disabled = false;
  walletCheckoutBtn.disabled = false;
  cryptoPayBtn.disabled = true;
  walletStatus.textContent = "Authorize a wallet order before sending payment.";
  document.querySelectorAll(".product-card").forEach((card) => {
    card.classList.toggle("selected", card.getAttribute("data-id") === product.id);
  });
}

function createProductCard(product) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "product-card";
  card.setAttribute("data-id", product.id);
  card.innerHTML = `<h3>${product.name}</h3><p>${product.description}</p><p class="price">${new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.priceCents / 100)}</p>`;
  card.addEventListener("click", () => setSelectedProduct(product));
  return card;
}

async function fetchCommerceConfig() {
  const response = await fetch("/api/commerce/config");
  commerceConfig = await response.json();
  commerceConfig.products.forEach((product) => {
    productGrid.appendChild(createProductCard(product));
  });
  if (commerceConfig.products.length) {
    setSelectedProduct(commerceConfig.products[0]);
  }
  cryptoAddress.textContent = commerceConfig.payments.cryptoAddress;
  cryptoAmount.textContent = commerceConfig.payments.cryptoAmount;
  cryptoToken.textContent = commerceConfig.payments.cryptoToken;
}

async function createCheckout() {
  if (!selectedProduct) {
    return;
  }

  const body = {
    orderId: `lavish-${selectedProduct.id}-${Date.now()}`,
    items: [
      {
        name: selectedProduct.name,
        quantity: 1,
        priceCents: selectedProduct.priceCents
      }
    ]
  };

  const checkoutResponse = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await checkoutResponse.json();

  if (checkoutResponse.ok && data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
    return;
  }

  alert(data.error || "Unable to create checkout session.");
}

async function connectCryptoWallet() {
  if (!window.ethereum) {
    cryptoStatus.textContent = "No Ethereum wallet detected. Use MetaMask or a compatible wallet.";
    statusBadge.textContent = "error";
    return false;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    walletAddress = accounts[0];
    cryptoStatus.textContent = `Connected: ${walletAddress}`;
    statusBadge.textContent = "connected";
    return true;
  } catch (error) {
    cryptoStatus.textContent = "Wallet connection failed.";
    statusBadge.textContent = "error";
    return false;
  }
}

async function ensureWalletConnected() {
  if (walletAddress) {
    return true;
  }
  return await connectCryptoWallet();
}

async function createWalletOrder() {
  if (!selectedProduct) {
    return;
  }

  const connected = await ensureWalletConnected();
  if (!connected) {
    return;
  }

  const orderId = `lavish-${selectedProduct.id}-${Date.now()}`;
  const payload = {
    orderId,
    productId: selectedProduct.id,
    walletAddress,
    amountEther: commerceConfig.payments.cryptoAmount,
    network: "arbitrum",
    timestamp: new Date().toISOString()
  };

  const message = JSON.stringify(payload);
  let signature;
  try {
    signature = await window.ethereum.request({ method: "personal_sign", params: [message, walletAddress] });
  } catch (error) {
    walletStatus.textContent = "Signing the order failed.";
    statusBadge.textContent = "error";
    return;
  }

  const response = await fetch("/api/wallet/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, productId: selectedProduct.id, walletAddress, signature, message })
  });
  const data = await response.json();

  if (!response.ok) {
    walletStatus.textContent = data.error || "Wallet order authorization failed.";
    statusBadge.textContent = "error";
    return;
  }

  currentOrderId = data.orderId;
  walletStatus.textContent = `Order authorized. Send ${data.paymentInstructions.amount} ${data.paymentInstructions.token} to complete payment.`;
  statusBadge.textContent = "authorized";
  cryptoPayBtn.disabled = false;
}

async function sendOnChainPayment() {
  if (!window.ethereum || !walletAddress) {
    walletStatus.textContent = "Connect your wallet before sending payment.";
    statusBadge.textContent = "error";
    return;
  }

  const to = cryptoAddress.textContent;
  const value = decimalToHexWei(commerceConfig.payments.cryptoAmount);

  try {
    await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: walletAddress,
          to,
          value
        }
      ]
    });
    walletStatus.textContent = "Transaction submitted. Refresh status after confirmation.";
    statusBadge.textContent = "pending";
  } catch (error) {
    walletStatus.textContent = "Transaction failed or was rejected.";
    statusBadge.textContent = "error";
  }
}

async function refreshCryptoStatus() {
  statusBadge.textContent = "checking";
  const response = await fetch("/api/crypto/status");
  const payload = await response.json();

  if (payload.error) {
    cryptoStatus.textContent = `Error: ${payload.error}`;
    statusBadge.textContent = "error";
    return;
  }

  if (payload.lastMatchedTransaction) {
    cryptoStatus.innerHTML = `Payment confirmed in block ${payload.lastMatchedTransaction.blockNumber}. <br>Tx: <a href="https://arbiscan.io/tx/${payload.lastMatchedTransaction.hash}" target="_blank">${payload.lastMatchedTransaction.hash}</a>`;
    statusBadge.textContent = "paid";
    return;
  }

  cryptoStatus.textContent = "No matching on-chain payment detected yet. Send the exact amount to the address above.";
  statusBadge.textContent = payload.active ? "monitoring" : "offline";
}

fiatCheckoutBtn.addEventListener("click", createCheckout);
walletCheckoutBtn.addEventListener("click", createWalletOrder);
cryptoConnectBtn.addEventListener("click", connectCryptoWallet);
cryptoPayBtn.addEventListener("click", sendOnChainPayment);
checkStatusBtn.addEventListener("click", refreshCryptoStatus);

fetchCommerceConfig();
refreshCryptoStatus();
