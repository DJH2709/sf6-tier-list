// Search-engine basics shared by every public page.
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

// One official address per page (canonical), plus the link-preview fields Next.js doesn't add
// by itself. Paths are relative; metadataBase in the layout makes them absolute.
// Language lives in a cookie, not the address, so every language shares the same canonical.
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { url: path, siteName: SITE_NAME, type: "website", title, description },
  };
}

// schema.org data for the home page: names the site so Google can show "LobbyTier" as the site name.
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
};

// Breadcrumb trail for a game page: All games > <game>.
export function breadcrumbSchema(gameName: string, path: string, gamesLabel: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: gamesLabel, item: `${SITE_URL}/games` },
      { "@type": "ListItem", position: 2, name: gameName, item: `${SITE_URL}${path}` },
    ],
  };
}

// JSON-LD has to be inline. "<" is escaped so a name can never close the script tag.
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
