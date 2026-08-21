"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // força troca do SW antigo que cacheava HTML das páginas
        reg.update().catch(() => undefined);
      })
      .catch(() => {
        // silencioso: PWA é opcional no desktop
      });
  }, []);

  return null;
}
