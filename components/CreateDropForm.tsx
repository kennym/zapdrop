"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXPIRY_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 60, label: "1 hour" },
  { value: 180, label: "3 hours" },
  { value: 360, label: "6 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
];

export function CreateDropForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [message, setMessage] = useState("");
  const [showInGallery, setShowInGallery] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sats = parseInt(amount);
    if (!sats || sats < 1) {
      setError("Please enter a valid amount");
      return;
    }

    if (sats > 1000000) {
      setError("Maximum amount is 1,000,000 sats");
      return;
    }

    try {
      setStatus("creating");

      // Check for WebLN
      if (!window.webln) {
        throw new Error("Please install Alby extension to create a drop");
      }

      await window.webln.enable();

      // Create the drop on server
      const response = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: sats,
          expiryMinutes,
          message: message.trim() || undefined,
          showInGallery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create drop");
      }

      setStatus("paying");

      // Pay the invoice
      await window.webln.sendPayment(data.invoice);

      // Redirect to the drop page
      router.push(`/d/${data.dropId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create drop";
      setError(errorMessage);
      setStatus("error");
    }
  };

  const isLoading = status === "creating" || status === "paying";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Amount (sats)
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            min="1"
            max="1000000"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={isLoading}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            sats
          </span>
        </div>
        {amount && parseInt(amount) > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            &#8776; ${((parseInt(amount) || 0) * 0.0004).toFixed(2)} USD
          </p>
        )}
      </div>

      {/* Expiry */}
      <div>
        <label htmlFor="expiry" className="block text-sm font-medium text-gray-300 mb-2">
          Expires in
        </label>
        <select
          id="expiry"
          value={expiryMinutes}
          onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          disabled={isLoading}
        >
          {EXPIRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Message (optional)
        </label>
        <input
          type="text"
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="First one gets it!"
          maxLength={140}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500 mt-1">{message.length}/140</p>
      </div>

      {/* Gallery opt-in */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="gallery"
          checked={showInGallery}
          onChange={(e) => setShowInGallery(e.target.checked)}
          className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-amber-500 focus:ring-amber-500"
          disabled={isLoading}
        />
        <label htmlFor="gallery" className="text-sm text-gray-300">
          Show in gallery when finished
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !amount}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-lg
          transition-all duration-200
          ${isLoading || !amount
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black"
          }
        `}
      >
        {status === "creating" && "Creating drop..."}
        {status === "paying" && "Pay with Alby..."}
        {(status === "idle" || status === "error") && (
          <>&#9889; Create Drop</>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Requires{" "}
        <a
          href="https://getalby.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-500 hover:underline"
        >
          Alby
        </a>{" "}
        browser extension
      </p>
    </form>
  );
}
