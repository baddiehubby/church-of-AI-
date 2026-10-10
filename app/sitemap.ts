import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/terms", "/privacy", "/refunds"].map((path) => ({
    url: `${appUrl()}${path}`,
    lastModified: new Date(),
  }));
}
