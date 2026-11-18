import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alvora",
    short_name: "Alvora",
    description: "AI builder identity and validation",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/brand/favicon-16.svg",
        sizes: "16x16",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/favicon-32.svg",
        sizes: "32x32",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/favicon-32-tile.svg",
        sizes: "32x32",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/apple-touch.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
