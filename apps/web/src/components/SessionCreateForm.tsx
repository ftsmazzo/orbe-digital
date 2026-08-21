"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SessionRecorder } from "@/components/SessionRecorder";

type ClientOption = { id: string; name: string };

export function SessionCreateForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    const uploaded = formData.get("audio");
    const hasUpload = uploaded instanceof File && uploaded.size > 0;
    if (!hasUpload && recordingFile) {
      formData.set("audio", recordingFile, recordingFile.name);
    }

    // checkbox: API aceita "on" | "true"
    if (formData.get("consentGiven") === "on") {
      formData.set("consentGiven", "true");
    }

    const hasAudioNow =
      (formData.get("audio") instanceof File && (formData.get("audio") as File).size > 0) || !!recordingFile;
    const transcript = String(formData.get("transcript") ?? "").trim();
    if (!hasAudioNow && !transcript) {
      setError("Grave um audio, envie um arquivo ou cole a transcricao.");
      return;
    }

    if (!formData.get("clientId")) {
      setError("Selecione um cliente.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(String(payload.error || `Falha ao criar sessao (${response.status}).`));
        return;
      }

      const sessionId = payload.id as string | undefined;
      router.push(sessionId ? `/app/sessions/${sessionId}` : "/app/sessions");
      router.refresh();
    } catch {
      setError("Falha de rede ao criar a sessao. Verifique a conexao e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Cliente</span>
        <select
          name="clientId"
          required
          className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271]"
        >
          <option value="">Selecione</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Titulo</span>
        <input
          name="title"
          placeholder="Sessao de diagnostico ORBE"
          className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271]"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="consentGiven" type="checkbox" required className="mt-1" />
        <span>Consentimento LGPD: cliente autorizou a gravacao/uso da conversa para diagnostico ORBE.</span>
      </label>

      <SessionRecorder onRecordingReady={setRecordingFile} disabled={pending} />

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Ou envie arquivo de audio</span>
        <input name="audio" type="file" accept="audio/*,video/*" className="rounded-xl border border-slate-200 px-3 py-2" />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span>Ou cole transcricao</span>
        <textarea
          name="transcript"
          rows={6}
          placeholder="Cole aqui a conversa (Zoom, Meet, WhatsApp, anotacoes)..."
          className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271]"
        />
      </label>

      <p className="text-xs text-slate-500">
        Com audio: dispara STT. Com texto colado: extrai diagnostico na hora.
        {recordingFile ? ` Gravacao anexada: ${recordingFile.name} (${Math.round(recordingFile.size / 1024)} KB).` : ""}
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#012245] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#02315f] disabled:opacity-60"
      >
        {pending ? "Criando sessao..." : "Criar e processar"}
      </button>
    </form>
  );
}
