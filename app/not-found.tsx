import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-8xl mb-8">&#128533;</div>
      <h1 className="text-4xl font-bold mb-4">Drop Not Found</h1>
      <p className="text-gray-400 mb-8">
        This drop doesn&apos;t exist or may have been claimed/expired.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 transition-colors"
      >
        Create a New Drop
      </Link>
    </div>
  );
}
