import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORBE Digital",
    short_name: "ORBE",
    description: "Sessao gravada, CRM e ciclo ORBE no celular ou desktop.",
    start_url: "/app/sessions",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#012245",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
