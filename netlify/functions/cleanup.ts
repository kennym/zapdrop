import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "zapdrop";

interface Drop {
  id: string;
  status: "pending" | "live" | "claimed" | "expired" | "returned";
  amount: number;
  expiry: number;
  message?: string;
  showInGallery: boolean;
  createdAt: number;
  claimedAt?: number;
  viewCount: number;
  lastViewReset: number;
}

export default async function handler(_request: Request, _context: Context) {
  console.log("Cleanup function running...");

  const store = getStore({
    name: STORE_NAME,
    consistency: "strong",
  });

  const now = Math.floor(Date.now() / 1000);
  const expiredDrops: Drop[] = [];

  try {
    // List all drops
    const { blobs } = await store.list();

    for (const blob of blobs) {
      // Skip index entries
      if (blob.key.startsWith("index:")) continue;

      try {
        const drop = await store.get(blob.key, { type: "json" }) as Drop | null;

        if (!drop) continue;

        // Mark live drops as expired if past expiry time
        // Add 5 minute grace period before marking as expired
        if (drop.status === "live" && drop.expiry + 300 < now) {
          expiredDrops.push(drop);

          // Update status to expired
          const updatedDrop: Drop = {
            ...drop,
            status: "expired",
          };

          await store.setJSON(drop.id, updatedDrop);
          console.log(`Marked drop ${drop.id} as expired`);
        }

        // Clean up very old pending drops (older than 1 hour)
        if (drop.status === "pending" && drop.createdAt + 3600 < now) {
          await store.delete(drop.id);
          console.log(`Deleted stale pending drop ${drop.id}`);
        }
      } catch (error) {
        console.error(`Error processing drop ${blob.key}:`, error);
      }
    }

    console.log(`Cleanup complete. ${expiredDrops.length} drops marked as expired.`);

    return new Response(
      JSON.stringify({
        success: true,
        expiredCount: expiredDrops.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: "Cleanup failed" }),
      { status: 500 }
    );
  }
}

// Run every 5 minutes
export const config: Config = {
  schedule: "*/5 * * * *",
};
