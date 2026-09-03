"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onRecordingReady: (file: File | null) => void;
  disabled?: boolean;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  // iOS Safari: prefer mp4/aac
  const candidates = isIos()
    ? ["audio/mp4", "audio/aac", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function SessionRecorder({ onRecordingReady, disabled }: Props) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [readyLabel, setReadyLabel] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function start() {
    setError("");
    setReadyLabel("");
    onRecordingReady(null);
    setPreview(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      });

      recorder.addEventListener("error", () => {
        setError("Falha no gravador do navegador. Tente de novo ou envie um arquivo.");
        setRecording(false);
      });

      recorder.addEventListener("stop", () => {
        try {
          const type = (recorder.mimeType || mimeType || "audio/mp4").split(";")[0];
          const blob = new Blob(chunksRef.current, { type });
          if (!blob.size) {
            setError("A gravacao ficou vazia. Segure uns segundos falando e pare de novo.");
            onRecordingReady(null);
            setReadyLabel("");
            return;
          }

          const ext = type.includes("mp4") || type.includes("aac") || type.includes("m4a") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `sessao-orbe-${Date.now()}.${ext}`, { type: type || "audio/mp4" });
          const url = URL.createObjectURL(blob);
          setPreview(url);
          onRecordingReady(file);
          setReadyLabel(`Audio pronto (${Math.max(1, Math.round(blob.size / 1024))} KB). Ouça abaixo e depois toque em Criar.`);
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      });

      // timeslice ajuda Android/Chrome; no iOS pode falhar — tenta com, cai sem
      try {
        recorder.start(1000);
      } catch {
        recorder.start();
      }

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);
    } catch {
      setError("Sem acesso ao microfone. No iPhone: Ajustes → Safari → Microfone → permitir, e use HTTPS.");
    }
  }

  function stop() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      if (typeof recorder.requestData === "function" && recorder.state === "recording") {
        recorder.requestData();
      }
    } catch {
      // ignore
    }
    recorder.stop();
    setRecording(false);
  }

  function clearRecording() {
    setPreview(null);
    onRecordingReady(null);
    setElapsedMs(0);
    setReadyLabel("");
  }

  if (!supported) {
    return (
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Este navegador nao grava audio in-app. Use &quot;Enviar arquivo&quot; ou cole a transcricao.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-[#012245]/10 bg-[#012245]/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#012245]">Gravador da sessao</p>
          <p className="text-xs text-slate-500">1) Iniciar · 2) Parar · 3) Ouvir · 4) Criar e processar</p>
        </div>
        <p className={`font-mono text-lg font-semibold ${recording ? "text-red-600" : "text-[#012245]"}`}>
          {formatMs(elapsedMs)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!recording ? (
          <button
            type="button"
            disabled={disabled}
            onClick={start}
            className="w-full rounded-xl bg-[#c0392b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a93226] disabled:opacity-50 sm:w-auto"
          >
            Iniciar gravacao
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-xl bg-[#012245] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#02315f]"
          >
            Parar e usar audio
          </button>
        )}
        {previewUrl ? (
          <button
            type="button"
            onClick={clearRecording}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#012245]"
          >
            Descartar
          </button>
        ) : null}
      </div>

      {recording ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
          Gravando… fale por alguns segundos e toque em Parar.
        </p>
      ) : null}

      {recording && elapsedMs >= 40 * 60_000 ? (
        <p className="mt-3 rounded-xl border border-[#c8a04c]/30 bg-[#f7f4ee] px-3 py-2 text-sm text-[#012245]">
          Sessao longa: depois de parar, o ORBE quebra o audio sozinho e junta o texto. A transcricao leva um pouco
          mais — nao precisa cortar na mao.
        </p>
      ) : null}

      {readyLabel ? <p className="mt-3 text-sm font-medium text-[#2e7271]">{readyLabel}</p> : null}

      {previewUrl ? (
        <div className="mt-4">
          <audio key={previewUrl} controls playsInline preload="metadata" src={previewUrl} className="w-full" />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
