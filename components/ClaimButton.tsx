"use client";

import { useState, useRef, useCallback } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { triggerConfetti } from "./Confetti";

interface ClaimButtonProps {
  dropId: string;
  amount: number; // in millisatoshis
  disabled?: boolean;
  showCaptcha?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ClaimButton({
  dropId,
  amount,
  disabled = false,
  showCaptcha = false,
  onSuccess,
  onError,
}: ClaimButtonProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "invoicing" | "claiming" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const sats = Math.floor(amount / 1000);

  const handleClaim = useCallback(async () => {
    // If captcha required but not completed, trigger it
    if (showCaptcha && !captchaToken) {
      captchaRef.current?.execute();
      return;
    }

    setError(null);
    setStatus("connecting");

    try {
      // Check for WebLN (Alby)
      if (!window.webln) {
        throw new Error("Please install Alby extension to claim sats");
      }

      await window.webln.enable();
      setStatus("invoicing");

      // Generate invoice from user's wallet
      const invoice = await window.webln.makeInvoice({
        amount: sats,
        defaultMemo: `ZapDrop claim: ${sats} sats`,
      });

      setStatus("claiming");

      // Send to backend to process payment
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropId,
          invoice: invoice.paymentRequest,
          captchaToken: showCaptcha ? captchaToken : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Claim failed");
      }

      setStatus("success");
      triggerConfetti();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim";
      setError(message);
      setStatus("error");
      onError?.(message);
      // Reset captcha on error
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
  }, [dropId, sats, showCaptcha, captchaToken, onSuccess, onError]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    // Auto-trigger claim after captcha
    setTimeout(() => handleClaim(), 100);
  }, [handleClaim]);

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">&#9889;</div>
        <div className="text-2xl font-bold text-green-400">
          {sats.toLocaleString()} sats claimed!
        </div>
        <p className="text-gray-400 mt-2">Check your Alby wallet</p>
      </div>
    );
  }

  const buttonText = {
    idle: `Claim ${sats.toLocaleString()} sats`,
    connecting: "Connecting to Alby...",
    invoicing: "Creating invoice...",
    claiming: "Sending sats...",
    error: "Try Again",
    success: "Claimed!",
  }[status];

  const isLoading = ["connecting", "invoicing", "claiming"].includes(status);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClaim}
        disabled={disabled || isLoading}
        className={`
          relative px-8 py-4 text-xl font-bold rounded-xl
          transition-all duration-200 transform
          ${disabled || isLoading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black hover:scale-105 active:scale-95"
          }
          ${isLoading ? "animate-pulse" : ""}
        `}
      >
        {isLoading && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {buttonText}
      </button>

      {error && (
        <div className="text-red-400 text-sm max-w-xs text-center">{error}</div>
      )}

      {showCaptcha && (
        <div className="mt-2">
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
            onVerify={handleCaptchaVerify}
            size="invisible"
            theme="dark"
          />
        </div>
      )}
    </div>
  );
}
