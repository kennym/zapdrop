import { NextRequest, NextResponse } from "next/server";
import { getDrop, updateDropStatus } from "@/lib/kv";
import { payInvoice } from "@/lib/lnbits";
import { isValidDropId } from "@/lib/cryptoId";

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3; // requests
const RATE_WINDOW = 1000; // 1 second

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function verifyCaptcha(token: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) return true; // Skip if not configured

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `response=${token}&secret=${HCAPTCHA_SECRET}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    console.error("Captcha verification failed");
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { dropId, invoice, captchaToken } = await request.json();

    // Validate drop ID
    if (!dropId || !isValidDropId(dropId)) {
      return NextResponse.json(
        { error: "Invalid drop ID" },
        { status: 400 }
      );
    }

    // Validate invoice
    if (!invoice || typeof invoice !== "string") {
      return NextResponse.json(
        { error: "Invalid invoice" },
        { status: 400 }
      );
    }

    // Get the drop
    const drop = await getDrop(dropId);

    if (!drop) {
      return NextResponse.json(
        { error: "Drop not found" },
        { status: 404 }
      );
    }

    // Check status
    if (drop.status !== "live") {
      return NextResponse.json(
        { error: `Drop is ${drop.status}, not claimable` },
        { status: 400 }
      );
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > drop.expiry) {
      await updateDropStatus(dropId, "expired");
      return NextResponse.json(
        { error: "Drop has expired" },
        { status: 400 }
      );
    }

    // Verify captcha if provided (required when high traffic)
    if (captchaToken) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return NextResponse.json(
          { error: "Captcha verification failed" },
          { status: 400 }
        );
      }
    }

    // Pay the claimer
    try {
      await payInvoice(invoice);
    } catch (payError) {
      console.error("Payment failed:", payError);
      return NextResponse.json(
        { error: "Payment failed. Please try again." },
        { status: 500 }
      );
    }

    // Update drop status
    await updateDropStatus(dropId, "claimed", { claimedAt: now });

    return NextResponse.json({
      success: true,
      message: "Sats claimed successfully!",
    });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      { error: "Failed to process claim" },
      { status: 500 }
    );
  }
}
