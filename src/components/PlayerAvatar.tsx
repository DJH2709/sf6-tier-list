import type { Profile } from "@/lib/profiles";

// A player's Discord avatar, or their initials on a quiet badge. `px` is the rendered size
// so the image has width and height before it loads and nothing shifts.
export default function PlayerAvatar({ profile, className, px }: { profile: Profile; className: string; px: number }) {
  return profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN, no optimisation needed
    <img src={profile.avatar_url} alt="" width={px} height={px} className={`rounded-full object-cover ${className}`} />
  ) : (
    <span
      className={`flex items-center justify-center rounded-full bg-ink-600 font-medium leading-none text-ink-300 ${className}`}
      aria-hidden
    >
      {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
    </span>
  );
}
