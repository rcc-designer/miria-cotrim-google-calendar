import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/services",
  "/bridal",
  "/portfolio",
  "/book",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.miriacotrim.com";

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
