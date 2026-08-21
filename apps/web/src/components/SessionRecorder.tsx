"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onRecordingReady: (file: File | null) => void;
  disabled?: boolean;
};

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function start() {
    setError("");
    onRecordingReady(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `sessao-orbe-${Date.now()}.${ext}`, { type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecordingReady(file);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);
    } catch {
      setError("Nao foi possivel acessar o microfone. Verifique a permissao do navegador.");
    }
  }

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function clearRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onRecordingReady(null);
    setElapsedMs(0);
  }

  if (!supported) {
    return (
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Este dispositivo/navegador nao suporta gravacao in-app. Use o upload de audio ou cole a transcricao.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-[#012245]/10 bg-[#012245]/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#012245]">Gravador da sessao</p>
          <p className="text-xs text-slate-500">Grave a conversa ao vivo (PWA/celular ou desktop).</p>
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
            className="rounded-xl bg-[#c0392b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a93226] disabled:opacity-50"
          >
            Iniciar gravacao
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#02315f]"
          >
            Parar e usar audio
          </button>
        )}
        {previewUrl ? (
          <button
            type="button"
            onClick={clearRecording}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#012245]"
          >
            Descartar gravacao
          </button>
        ) : null}
      </div>

      {recording ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
          Gravando… fale normalmente; o microfone esta ativo.
        </p>
      ) : null}

      {previewUrl ? (
        <div className="mt-4">
          <audio controls src={previewUrl} className="w-full" />
          <p className="mt-2 text-xs text-slate-500">Audio pronto. Ao criar a sessao, ele sera enviado para transcricao.</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
