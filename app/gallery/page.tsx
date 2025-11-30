import { getGalleryDrops } from "@/lib/kv";
import { DropCard } from "@/components/DropCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery - ZapDrop",
  description: "Browse finished Lightning drops - claimed and returned",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const drops = await getGalleryDrops(50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Gallery</h1>
        <p className="text-gray-400">
          Browse finished drops (only showing drops where senders opted-in)
        </p>
      </div>

      {drops.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">&#128064;</div>
          <p className="text-gray-500 text-lg">No drops to show yet</p>
          <p className="text-gray-600 text-sm mt-2">
            Drops appear here when senders opt-in to gallery display
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drops.map((drop) => (
            <DropCard key={drop.id} drop={drop} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-gray-600 text-sm">
          Live drops are never shown here to protect against bots
        </p>
      </div>
    </div>
  );
}
