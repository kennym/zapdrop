import type { LNBitsInvoice, LNBitsPayment } from "./types";

const LNBITS_URL = process.env.LNBITS_URL || "";
const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY || "";
const MOCK_LNBITS = process.env.MOCK_LNBITS === "true";

/**
 * Create an invoice for receiving payment
 */
export async function createInvoice(
  amountMsats: number,
  memo: string,
  webhookUrl?: string
): Promise<LNBitsInvoice> {
  if (MOCK_LNBITS) {
    return mockCreateInvoice(amountMsats, memo);
  }

  const response = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": LNBITS_ADMIN_KEY,
    },
    body: JSON.stringify({
      out: false,
      amount: Math.floor(amountMsats / 1000), // LNBits expects sats
      memo,
      webhook: webhookUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LNBits invoice creation failed: ${error}`);
  }

  return response.json();
}

/**
 * Pay an invoice (for claims and refunds)
 */
export async function payInvoice(bolt11: string): Promise<LNBitsPayment> {
  if (MOCK_LNBITS) {
    return mockPayInvoice(bolt11);
  }

  const response = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": LNBITS_ADMIN_KEY,
    },
    body: JSON.stringify({
      out: true,
      bolt11,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LNBits payment failed: ${error}`);
  }

  return response.json();
}

/**
 * Check if a payment has been received
 */
export async function checkPayment(paymentHash: string): Promise<boolean> {
  if (MOCK_LNBITS) {
    return true; // Mock always returns paid
  }

  const response = await fetch(`${LNBITS_URL}/api/v1/payments/${paymentHash}`, {
    headers: {
      "X-Api-Key": LNBITS_ADMIN_KEY,
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.paid === true;
}

/**
 * Get wallet balance in msats
 */
export async function getWalletBalance(): Promise<number> {
  if (MOCK_LNBITS) {
    return 10000000; // 10,000 sats in mock mode
  }

  const response = await fetch(`${LNBITS_URL}/api/v1/wallet`, {
    headers: {
      "X-Api-Key": LNBITS_ADMIN_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get wallet balance");
  }

  const data = await response.json();
  return data.balance; // Already in msats
}

// Mock implementations for local development
function mockCreateInvoice(amountMsats: number, memo: string): LNBitsInvoice {
  const hash = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  console.log(`[MOCK] Created invoice for ${amountMsats} msats: ${memo}`);
  return {
    payment_hash: hash,
    payment_request: `lnbc${Math.floor(amountMsats / 1000)}mock1${hash}`,
    checking_id: hash,
  };
}

function mockPayInvoice(bolt11: string): LNBitsPayment {
  const hash = `mock_paid_${Date.now()}`;
  console.log(`[MOCK] Paid invoice: ${bolt11.slice(0, 30)}...`);
  return {
    payment_hash: hash,
    checking_id: hash,
  };
}
