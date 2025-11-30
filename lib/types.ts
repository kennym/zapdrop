export interface Drop {
  id: string;
  status: "pending" | "live" | "claimed" | "expired" | "returned";
  amount: number; // millisatoshis
  expiry: number; // unix timestamp (seconds)
  message?: string;
  showInGallery: boolean;
  createdAt: number;
  claimedAt?: number;
  viewCount: number;
  lastViewReset: number; // for rate limiting views
}

export interface CreateDropInput {
  amount: number; // sats (will be converted to msats)
  expiryMinutes: number;
  message?: string;
  showInGallery: boolean;
}

export interface LNBitsInvoice {
  payment_hash: string;
  payment_request: string;
  checking_id: string;
  lnurl_response?: string;
}

export interface LNBitsPayment {
  payment_hash: string;
  checking_id: string;
}

export interface WebLNProvider {
  enable: () => Promise<void>;
  sendPayment: (paymentRequest: string) => Promise<{ preimage: string }>;
  makeInvoice: (args: { amount: number; defaultMemo?: string }) => Promise<{ paymentRequest: string }>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}
