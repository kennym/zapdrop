"use client";

import { useState, useCallback } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ClaimButton } from "@/components/ClaimButton";
import type { Drop } from "@/lib/types";

interface DropPageClientProps {
  drop: Drop;
  showCaptcha: boolean;
}

export function DropPageClient({ drop, showCaptcha }: DropPageClientProps) {
  const [status, setStatus] = useState<Drop["status"]>(drop.status);
  const [claimed, setClaimed] = useState(false);

  const sats = Math.floor(drop.amount / 1000);
  const isLive = status === "live";
  const isExpired = status === "expired" || status === "returned";
  const isClaimed = status === "claimed" || claimed;

  const handleExpire = useCallback(() => {
    setStatus("expired");
  }, []);

  const handleClaimSuccess = useCallback(() => {
    setClaimed(true);
    setStatus("claimed");
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        {/* Amount */}
        <div className="mb-8">
          <div className="text-6xl mb-4">&#9889;</div>
          <div className="text-5xl font-bold mb-2">
            {sats.toLocaleString()} sats
          </div>
          <div className="text-gray-500">
            &#8776; ${(sats * 0.0004).toFixed(2)} USD
          </div>
        </div>

        {/* Message */}
        {drop.message && (
          <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <p className="text-lg italic text-gray-300">
              &ldquo;{drop.message}&rdquo;
            </p>
          </div>
        )}

        {/* Countdown or Status */}
        {isLive && !isClaimed && (
          <div className="mb-8">
            <CountdownTimer expiry={drop.expiry} onExpire={handleExpire} />
          </div>
        )}

        {/* Claim Button or Status */}
        <div className="mt-8">
          {isLive && !isClaimed && (
            <ClaimButton
              dropId={drop.id}
              amount={drop.amount}
              showCaptcha={showCaptcha}
              onSuccess={handleClaimSuccess}
            />
          )}

          {isClaimed && (
            <div className="text-center">
              <div className="text-6xl mb-4">&#127881;</div>
              <div className="text-2xl font-bold text-green-400">
                This drop has been claimed!
              </div>
            </div>
          )}

          {isExpired && !isClaimed && (
            <div className="text-center">
              <div className="text-6xl mb-4">&#8987;</div>
              <div className="text-2xl font-bold text-amber-400">
                This drop has expired
              </div>
              <p className="text-gray-500 mt-2">
                The sats are being returned to the sender
              </p>
              <RefundButton dropId={drop.id} amount={drop.amount} />
            </div>
          )}
        </div>
      </div>

      {/* Share section for live drops */}
      {isLive && !isClaimed && (
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Share this link - first one to click wins!
          </p>
          <CopyLinkButton />
        </div>
      )}
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}

function RefundButton({ dropId, amount }: { dropId: string; amount: number }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const sats = Math.floor(amount / 1000);

  const handleRefund = async () => {
    try {
      setStatus("loading");
      setError(null);

      if (!window.webln) {
        throw new Error("Please install Alby extension");
      }

      await window.webln.enable();

      // Generate invoice from user's wallet
      const invoice = await window.webln.makeInvoice({
        amount: sats,
        defaultMemo: `ZapDrop refund: ${sats} sats`,
      });

      // Send to backend to process refund
      const response = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropId,
          invoice: invoice.paymentRequest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Refund failed");
      }

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-6 text-green-400">
        Refund sent! Check your Alby wallet.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleRefund}
        disabled={status === "loading"}
        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
      >
        {status === "loading" ? "Processing..." : `Claim Refund (${sats} sats)`}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      <p className="text-gray-600 text-xs mt-2">
        Only the original sender can claim the refund
      </p>
    </div>
  );
}
