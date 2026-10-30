import type { Profile } from "@/lib/profiles";

// Stable colour per username, matching the character badges.
function avatarColour(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hash} 45% 35%)`;
}

export default function PlayerAvatar({ profile, className }: { profile: Profile; className: string }) {
  return profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
    <img src={profile.avatar_url} alt="" className={`rounded-full object-cover ${className}`} />
  ) : (
    <span
      className={`flex items-center justify-center rounded-full font-black text-white ${className}`}
      style={{ backgroundColor: avatarColour(profile.username) }}
      aria-hidden
    >
      {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
    </span>
  );
}
