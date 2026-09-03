export const STT_PROGRESS_SPEAKER = "__stt__";

export type SttPhase = "preparando" | "transcrevendo" | "montando";

export type SttProgress = {
  v: 1;
  phase: SttPhase;
  done: number;
  total: number;
  chunked: boolean;
  partKeys: string[];
  texts: (string | null)[];
  startedAt: string;
  lastPartAt?: string;
  runId?: string;
};

export type PublicSttProgress = {
  phase: SttPhase;
  done: number;
  total: number;
  chunked: boolean;
  startedAt: string;
  lastPartAt?: string;
};

type Segment = { speaker?: string; text: string; start?: number; end?: number };

export function parseSttProgress(segments?: Segment[] | null): SttProgress | null {
  const raw = segments?.find((s) => s.speaker === STT_PROGRESS_SPEAKER)?.text;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SttProgress>;
    if (parsed?.v !== 1 || !parsed.phase || !parsed.startedAt) return null;
    const total = Math.max(1, Number(parsed.total) || 1);
    const texts = Array.isArray(parsed.texts) ? parsed.texts : Array.from({ length: total }, () => null);
    return {
      v: 1,
      phase: parsed.phase,
      done: Number(parsed.done) || 0,
      total,
      chunked: Boolean(parsed.chunked),
      partKeys: Array.isArray(parsed.partKeys) ? parsed.partKeys : [],
      texts,
      startedAt: parsed.startedAt,
      lastPartAt: parsed.lastPartAt,
      runId: parsed.runId,
    };
  } catch {
    return null;
  }
}

export function toPublicSttProgress(progress: SttProgress | null): PublicSttProgress | null {
  if (!progress) return null;
  return {
    phase: progress.phase,
    done: progress.done,
    total: progress.total,
    chunked: progress.chunked,
    startedAt: progress.startedAt,
    lastPartAt: progress.lastPartAt,
  };
}

export function segmentsWithProgress(progress: SttProgress, existing?: Segment[] | null): Segment[] {
  const rest = (existing ?? []).filter((s) => s.speaker !== STT_PROGRESS_SPEAKER);
  return [{ speaker: STT_PROGRESS_SPEAKER, text: JSON.stringify(progress) }, ...rest];
}

export function nextPendingPartIndex(progress: SttProgress): number {
  const idx = progress.texts.findIndex((text) => text == null);
  return idx >= 0 ? idx : -1;
}
