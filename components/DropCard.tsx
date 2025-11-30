import type { Drop } from "@/lib/types";

interface DropCardProps {
  drop: Drop;
}

export function DropCard({ drop }: DropCardProps) {
  const sats = Math.floor(drop.amount / 1000);
  const date = new Date((drop.claimedAt || drop.createdAt) * 1000);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-2xl font-bold">
            &#9889; {sats.toLocaleString()} sats
          </div>
          <div className="text-sm text-gray-500">{timeAgo}</div>
        </div>
        <StatusBadge status={drop.status} />
      </div>

      {drop.message && (
        <p className="text-gray-300 text-sm mb-4 italic">
          &ldquo;{drop.message}&rdquo;
        </p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        {drop.status === "claimed" && (
          <span className="text-green-400">Claimed</span>
        )}
        {drop.status === "returned" && (
          <span className="text-amber-400">Returned to sender</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Drop["status"] }) {
  const styles = {
    claimed: "bg-green-900/50 text-green-400 border-green-700",
    returned: "bg-amber-900/50 text-amber-400 border-amber-700",
    live: "bg-blue-900/50 text-blue-400 border-blue-700",
    pending: "bg-gray-700 text-gray-400 border-gray-600",
    expired: "bg-red-900/50 text-red-400 border-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
