import { NextRequest, NextResponse } from "next/server";
import { getDrop, updateDropStatus } from "@/lib/kv";
import { payInvoice } from "@/lib/lnbits";
import { isValidDropId } from "@/lib/cryptoId";

export async function POST(request: NextRequest) {
  try {
    const { dropId, invoice } = await request.json();

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

    // Check status - only allow refund for expired drops
    if (drop.status === "claimed") {
      return NextResponse.json(
        { error: "Drop was already claimed" },
        { status: 400 }
      );
    }

    if (drop.status === "returned") {
      return NextResponse.json(
        { error: "Refund already processed" },
        { status: 400 }
      );
    }

    if (drop.status === "pending") {
      return NextResponse.json(
        { error: "Drop was never funded" },
        { status: 400 }
      );
    }

    // Check if actually expired
    const now = Math.floor(Date.now() / 1000);
    if (drop.status === "live" && now <= drop.expiry) {
      return NextResponse.json(
        { error: "Drop has not expired yet" },
        { status: 400 }
      );
    }

    // Pay the refund
    try {
      await payInvoice(invoice);
    } catch (payError) {
      console.error("Refund payment failed:", payError);
      return NextResponse.json(
        { error: "Refund payment failed. Please try again." },
        { status: 500 }
      );
    }

    // Update drop status
    await updateDropStatus(dropId, "returned");

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully!",
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
