import type { Metadata } from "next";
import FollowingView from "@/components/FollowingView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("following.metaTitle"), description: t("site.description") };
}

export default function FollowingPage() {
  return <FollowingView />;
}
