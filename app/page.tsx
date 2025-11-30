import { CreateDropForm } from "@/components/CreateDropForm";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Time-Limited
          </span>
          <br />
          Lightning Drops
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Create a secret link with sats up for grabs. First one to click wins.
          <br />
          If nobody claims in time, the sats return to you.
        </p>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Step
          number={1}
          title="Create a Drop"
          description="Choose amount, set timer, add optional message"
        />
        <Step
          number={2}
          title="Share the Link"
          description="Share the secret link anywhere - Nostr, Twitter, friends"
        />
        <Step
          number={3}
          title="First Wins"
          description="First to claim gets the sats. Unclaimed sats return to you."
        />
      </div>

      {/* Create form */}
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-8">Create a Drop</h2>
        <CreateDropForm />
      </div>

      {/* Features */}
      <div className="mt-20 grid md:grid-cols-2 gap-8">
        <Feature
          icon="&#128274;"
          title="Unguessable Links"
          description="128-bit random IDs make links impossible to enumerate or guess"
        />
        <Feature
          icon="&#9201;"
          title="Auto-Refund"
          description="Unclaimed sats return to your wallet - no action needed"
        />
        <Feature
          icon="&#9889;"
          title="Instant Claims"
          description="One click with Alby and the sats land in your wallet"
        />
        <Feature
          icon="&#128065;"
          title="Gallery Opt-in"
          description="Show finished drops in public gallery or keep them private"
        />
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
