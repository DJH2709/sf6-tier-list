import type { Metadata } from "next";
import FollowingView from "@/components/FollowingView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  // Personal to whoever is signed in, so it stays out of search results.
  return { title: t("following.metaTitle"), description: t("site.description"), robots: { index: false, follow: true } };
}

export default function FollowingPage() {
  return <FollowingView />;
}
