import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function hostToHttpsOrigin(host: string) {
  const trimmed = host.trim().replace(/^https?:\/\//, "");
  return `https://${stripTrailingSlash(trimmed)}`;
}

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return stripTrailingSlash(configured);

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (process.env.VERCEL_ENV === "production" && productionHost) {
    return hostToHttpsOrigin(productionHost);
  }

  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (deploymentHost) return hostToHttpsOrigin(deploymentHost);

  return "http://localhost:3000";
}

export function absoluteUrl(path = ""): string {
  const base = siteOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
