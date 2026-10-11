import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/wish", "/pricing", "/ledger", "/login", "/terms", "/privacy", "/refunds"].map((path) => ({
    url: `${appUrl()}${path}`,
    lastModified: new Date(),
  }));
}
