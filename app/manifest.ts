import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WellFit — AI 웰니스",
    short_name: "WellFit",
    description: "회사 복지로 시작하고, AI 코치와 함께 지속하는 운동 습관",
    start_url: "/employee",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#f6f7f9",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
