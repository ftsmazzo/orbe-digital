import { Button } from "@/components/ui";
import { attachSessionAudio, retrySessionStt } from "@/app/app/actions";

export function SessionAudioRescue({
  sessionId,
  hasAudio,
  status,
}: {
  sessionId: string;
  hasAudio: boolean;
  status: string;
}) {
  const stuck = status === "processando" || status === "erro";

  return (
    <section className="rounded-3xl border border-[#012245]/10 bg-white p-5">
      <h2 className="font-semibold text-[#012245]">Audio desta sessao</h2>
      <p className="mt-2 text-sm text-slate-600">
        {hasAudio
          ? "O arquivo ja esta no ORBE. Sessoes longas sao quebradas internamente depois da gravacao — o texto sai completo, sem cortar na mao."
          : "Nenhum audio ficou gravado. Envie o arquivo para transcrever nesta mesma sessao."}
      </p>

      <div className="mt-4 grid gap-2">
        {hasAudio ? (
          <a
            href={`/api/sessions/${sessionId}/audio`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white"
          >
            Baixar audio
          </a>
        ) : null}
        {hasAudio ? (
          <form action={retrySessionStt.bind(null, sessionId)}>
            <Button type="submit" variant="secondary" className="w-full">
              {stuck ? "Reprocessar transcricao" : "Transcrever de novo"}
            </Button>
          </form>
        ) : null}
      </div>

      <form action={attachSessionAudio.bind(null, sessionId)} className="mt-4 grid gap-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span>{hasAudio ? "Ou enviar outro arquivo" : "Enviar arquivo de audio"}</span>
          <input
            name="audio"
            type="file"
            accept="audio/*,video/*"
            required
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <Button type="submit" variant={hasAudio ? "secondary" : "primary"}>
          Enviar e transcrever
        </Button>
      </form>
    </section>
  );
}
