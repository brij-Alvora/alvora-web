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
        src: "/alvora-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
