import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORBE Digital",
    short_name: "ORBE",
    description: "Grave a sessao, veja a agenda e opere o ciclo ORBE no celular.",
    start_url: "/app/operate",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f4ee",
    theme_color: "#012245",
    lang: "pt-BR",
    shortcuts: [
      {
        name: "Gravar sessao",
        short_name: "Gravar",
        description: "Abrir o gravador da reuniao",
        url: "/app/sessions",
        icons: [{ src: "/icons/icon-orbe.png", sizes: "192x192" }],
      },
      {
        name: "Agenda",
        short_name: "Agenda",
        description: "Prazos e reunioes",
        url: "/app/agenda",
        icons: [{ src: "/icons/icon-orbe.png", sizes: "192x192" }],
      },
      {
        name: "Operacao",
        short_name: "Operar",
        url: "/app/operate",
        icons: [{ src: "/icons/icon-orbe.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-orbe.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-orbe.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
