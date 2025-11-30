import { getStore } from "@netlify/blobs";
import type { Drop } from "./types";

const STORE_NAME = "zapdrop";
const IS_DEV = process.env.NODE_ENV === "development" || process.env.MOCK_LNBITS === "true";

// In-memory store for development
const memoryStore = new Map<string, Drop>();

function getDropStore() {
  if (IS_DEV) {
    return null; // Use memory store in dev
  }
  return getStore({
    name: STORE_NAME,
    consistency: "strong",
  });
}

/**
 * Save a drop to the KV store
 */
export async function saveDrop(drop: Drop): Promise<void> {
  if (IS_DEV) {
    memoryStore.set(drop.id, drop);
    return;
  }

  const store = getDropStore();
  if (!store) return;

  await store.setJSON(drop.id, drop);
  await updateDropIndex(drop);
}

/**
 * Get a drop by ID
 */
export async function getDrop(id: string): Promise<Drop | null> {
  if (IS_DEV) {
    return memoryStore.get(id) || null;
  }

  const store = getDropStore();
  if (!store) return null;

  try {
    const drop = await store.get(id, { type: "json" });
    return drop as Drop | null;
  } catch {
    return null;
  }
}

/**
 * Update a drop's status
 */
export async function updateDropStatus(
  id: string,
  status: Drop["status"],
  additionalFields?: Partial<Drop>
): Promise<Drop | null> {
  const drop = await getDrop(id);
  if (!drop) return null;

  const updatedDrop: Drop = {
    ...drop,
    ...additionalFields,
    status,
  };

  await saveDrop(updatedDrop);
  return updatedDrop;
}

/**
 * Increment view count and check if captcha should be shown
 */
export async function incrementViewCount(id: string): Promise<{ showCaptcha: boolean; viewCount: number }> {
  const drop = await getDrop(id);
  if (!drop) return { showCaptcha: false, viewCount: 0 };

  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = 60;

  let newViewCount = drop.viewCount;
  let newLastReset = drop.lastViewReset;

  if (now - drop.lastViewReset > windowSeconds) {
    newViewCount = 1;
    newLastReset = now;
  } else {
    newViewCount += 1;
  }

  const updatedDrop: Drop = {
    ...drop,
    viewCount: newViewCount,
    lastViewReset: newLastReset,
  };

  await saveDrop(updatedDrop);

  return {
    showCaptcha: newViewCount > 10,
    viewCount: newViewCount,
  };
}

/**
 * Get all live drops that have expired (for cleanup)
 */
export async function getExpiredLiveDrops(): Promise<Drop[]> {
  const now = Math.floor(Date.now() / 1000);
  const expired: Drop[] = [];

  if (IS_DEV) {
    for (const drop of memoryStore.values()) {
      if (drop.status === "live" && drop.expiry < now) {
        expired.push(drop);
      }
    }
    return expired;
  }

  const store = getDropStore();
  if (!store) return [];

  try {
    const { blobs } = await store.list();

    for (const blob of blobs) {
      if (blob.key.startsWith("index:")) continue;

      const drop = await getDrop(blob.key);
      if (drop && drop.status === "live" && drop.expiry < now) {
        expired.push(drop);
      }
    }
  } catch (error) {
    console.error("Error getting expired drops:", error);
  }

  return expired;
}

/**
 * Get finished drops for gallery (claimed or returned, opt-in only)
 */
export async function getGalleryDrops(limit = 50): Promise<Drop[]> {
  const gallery: Drop[] = [];

  if (IS_DEV) {
    for (const drop of memoryStore.values()) {
      if (
        drop.showInGallery &&
        (drop.status === "claimed" || drop.status === "returned")
      ) {
        gallery.push(drop);
      }
      if (gallery.length >= limit) break;
    }
    return gallery.sort((a, b) => (b.claimedAt || b.createdAt) - (a.claimedAt || a.createdAt));
  }

  const store = getDropStore();
  if (!store) return [];

  try {
    const { blobs } = await store.list();

    for (const blob of blobs) {
      if (blob.key.startsWith("index:")) continue;

      const drop = await getDrop(blob.key);
      if (
        drop &&
        drop.showInGallery &&
        (drop.status === "claimed" || drop.status === "returned")
      ) {
        gallery.push(drop);
      }

      if (gallery.length >= limit) break;
    }
  } catch (error) {
    console.error("Error getting gallery drops:", error);
  }

  return gallery.sort((a, b) => (b.claimedAt || b.createdAt) - (a.claimedAt || a.createdAt));
}

/**
 * Update index entries for efficient querying
 */
async function updateDropIndex(drop: Drop): Promise<void> {
  if (IS_DEV) return;

  const store = getDropStore();
  if (!store) return;

  const indexKey = `index:${drop.status}:${drop.id}`;
  await store.set(indexKey, drop.id);
}
