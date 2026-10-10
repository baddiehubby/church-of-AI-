// Assumptions: free verdicts and certificates are shareable; private visa links, the API, and checkout are not indexed.

import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/visa/vw_", "/journal", "/daily", "/auth/"] },
    sitemap: `${appUrl()}/sitemap.xml`,
    host: appUrl(),
  };
}
