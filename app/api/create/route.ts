import { NextRequest, NextResponse } from "next/server";
import { generateSecureId } from "@/lib/cryptoId";
import { createInvoice } from "@/lib/lnbits";
import { saveDrop } from "@/lib/kv";
import type { Drop, CreateDropInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateDropInput = await request.json();

    // Validate input
    if (!body.amount || body.amount < 1) {
      return NextResponse.json(
        { error: "Amount must be at least 1 sat" },
        { status: 400 }
      );
    }

    if (body.amount > 1000000) {
      return NextResponse.json(
        { error: "Maximum amount is 1,000,000 sats" },
        { status: 400 }
      );
    }

    if (!body.expiryMinutes || body.expiryMinutes < 1) {
      return NextResponse.json(
        { error: "Invalid expiry time" },
        { status: 400 }
      );
    }

    // Generate secure ID
    const dropId = generateSecureId();

    // Convert sats to millisatoshis
    const amountMsats = body.amount * 1000;

    // Calculate expiry timestamp
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + body.expiryMinutes * 60;

    // Create the drop record (pending until payment confirmed)
    const drop: Drop = {
      id: dropId,
      status: "pending",
      amount: amountMsats,
      expiry,
      message: body.message?.slice(0, 140),
      showInGallery: body.showInGallery ?? false,
      createdAt: now,
      viewCount: 0,
      lastViewReset: now,
    };

    // Save to KV
    await saveDrop(drop);

    // Create LNBits invoice
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook`;
    const invoice = await createInvoice(
      amountMsats,
      `ZapDrop: ${body.amount} sats - ${dropId}`,
      webhookUrl
    );

    return NextResponse.json({
      dropId,
      invoice: invoice.payment_request,
      paymentHash: invoice.payment_hash,
    });
  } catch (error) {
    console.error("Create drop error:", error);
    return NextResponse.json(
      { error: "Failed to create drop" },
      { status: 500 }
    );
  }
}
