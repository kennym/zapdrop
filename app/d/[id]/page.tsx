import { notFound } from "next/navigation";
import { getDrop, incrementViewCount } from "@/lib/kv";
import { isValidDropId } from "@/lib/cryptoId";
import { DropPageClient } from "./DropPageClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const drop = await getDrop(id);

  if (!drop) {
    return {
      title: "Drop Not Found - ZapDrop",
    };
  }

  const sats = Math.floor(drop.amount / 1000);
  const title = `${sats.toLocaleString()} sats up for grabs! - ZapDrop`;
  const description = drop.message || "First one to click wins. Claim with Alby!";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ZapDrop",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DropPage({ params }: Props) {
  const { id } = await params;

  // Validate ID format
  if (!isValidDropId(id)) {
    notFound();
  }

  // Get drop from KV
  const drop = await getDrop(id);

  if (!drop) {
    notFound();
  }

  // Track views and determine if captcha should be shown
  const { showCaptcha } = await incrementViewCount(id);

  return <DropPageClient drop={drop} showCaptcha={showCaptcha} />;
}
