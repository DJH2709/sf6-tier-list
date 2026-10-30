import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";
import { getProfileByUsername } from "@/lib/profiles";

type Params = { params: Promise<{ username: string }> };

// Built on the server so a shared link shows the player's name and list in its preview.
// The list image comes from opengraph-image.tsx next to this file.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username).catch(() => null);
  if (!profile) return { title: "SF6 Community Tier List" };
  const title = `${profile.display_name || profile.username}'s SF6 tier list`;
  const description = `See how @${profile.username} ranks the Street Fighter 6 roster, then make your own.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;
  return <ProfileView username={username} />;
}
