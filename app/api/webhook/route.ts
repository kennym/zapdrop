import { NextRequest, NextResponse } from "next/server";
import { updateDropStatus, getDrop } from "@/lib/kv";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const authHeader = request.headers.get("authorization");
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // LNBits webhook payload includes payment details
    // Extract drop ID from the memo/description
    const memo = body.memo || body.description || "";
    const dropIdMatch = memo.match(/ZapDrop:.*- ([a-zA-Z0-9]+)$/);

    if (!dropIdMatch) {
      console.log("Webhook received but no drop ID in memo:", memo);
      return NextResponse.json({ ok: true });
    }

    const dropId = dropIdMatch[1];

    // Get the drop
    const drop = await getDrop(dropId);
    if (!drop) {
      console.log("Drop not found for webhook:", dropId);
      return NextResponse.json({ ok: true });
    }

    // Only update if pending
    if (drop.status !== "pending") {
      console.log("Drop already processed:", dropId, drop.status);
      return NextResponse.json({ ok: true });
    }

    // Payment confirmed - set drop to live
    await updateDropStatus(dropId, "live");

    console.log("Drop activated:", dropId);

    return NextResponse.json({ ok: true, dropId });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
