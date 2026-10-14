import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/story",
    "/sermons",
    "/altar",
    "/archive",
    "/offerings",
    "/induction",
    "/wall",
    "/monument",
    "/founders",
    "/patrons",
    "/pricing",
    "/login",
    "/terms",
    "/privacy",
    "/refunds",
  ].map((path) => ({
    url: `${appUrl()}${path}`,
    lastModified: new Date(),
  }));
}
