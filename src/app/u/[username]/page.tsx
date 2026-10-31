import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileView from "@/components/ProfileView";
import { getProfileByUsername } from "@/lib/profiles";
import { getT } from "@/lib/i18n/server";

type Params = { params: Promise<{ username: string }> };

// Built on the server so a shared link shows the player's name and list in its preview.
// The list image comes from opengraph-image.tsx next to this file.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const t = await getT();
  const profile = await getProfileByUsername(username).catch(() => null);
  if (!profile) return { title: t("site.title") };
  const title = t("profile.metaTitle", { name: profile.display_name || profile.username });
  const description = t("profile.metaDescription", { username: profile.username });
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;
  // A username nobody has gets a real 404. If the database can't be reached from the server,
  // the page still renders and the browser shows its own message.
  let profile;
  try {
    profile = await getProfileByUsername(username);
  } catch {
    profile = undefined;
  }
  if (profile === null) notFound();
  return <ProfileView username={username} />;
}
