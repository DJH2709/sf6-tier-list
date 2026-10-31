import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Preview deployments also send X-Robots-Tag: noindex (next.config.ts), so only the live
// site gets indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
