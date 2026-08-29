"use client";

import { useState } from "react";
import { uploadClientDocument } from "@/app/app/operate-actions";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function CockpitDocumentForm({ clientId }: { clientId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    try {
      await uploadClientDocument(clientId, new FormData(form));
      form.reset();
      setMessage("Documento na inbox. A IA classifica e extrai o texto.");
    } catch {
      setMessage("Falha ao enviar. Tente de novo ou cole o texto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <Field label="PDF, imagem ou texto">
        <Input name="document" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,image/*,text/*" />
      </Field>
      <Field label="Ou cole o texto">
        <Textarea name="pastedText" rows={4} placeholder="DRE, clausulas, ata, organograma..." />
      </Field>
      {message ? <p className="text-sm text-[#2e7271]">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Lendo documento..." : "Enviar documento"}
      </Button>
    </form>
  );
}
