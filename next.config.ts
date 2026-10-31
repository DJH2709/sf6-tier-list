import type { NextConfig } from "next";

// Where the browser is allowed to load things from. Supabase for data and sign-in, Discord's
// CDN for avatars, and Vercel's preview toolbar only on preview deployments. Next.js needs
// inline scripts and styles for hydration and Tailwind, so those stay allowed; everything
// remote has to be on this list.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
const preview = process.env.VERCEL_ENV === "preview";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${preview ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.discordapp.com",
  "font-src 'self'",
  `connect-src 'self' ${supabase} wss://${supabase.replace(/^https?:\/\//, "")}${preview ? " https://vercel.live wss://*.pusher.com" : ""}`,
  `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Vercel sends HSTS on its own domains as well; this covers a custom domain too.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

// Preview deployments (sf6-tier-list-git-*.vercel.app) must not show up in search results.
const noindex = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
  ? [{ key: "X-Robots-Tag", value: "noindex" }]
  : [];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next.js 15 streams <title> and <meta> into the body for browsers and only puts them in
  // <head> for a short list of bots. Our metadata is instant (a cookie read), so treat every
  // visitor as that list: tags land in <head> for every crawler and link-preview fetcher.
  htmlLimitedBots: /./,
  async headers() {
    // Dev mode needs eval for hot reloading, so the policy is production only.
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/(.*)", headers: [...securityHeaders, ...noindex] }];
  },
};

export default nextConfig;
