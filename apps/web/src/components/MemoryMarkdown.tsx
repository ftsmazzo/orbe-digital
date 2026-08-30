function inlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function MemoryMarkdown({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <article className="space-y-4 text-sm leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block === "---") {
          return <hr key={index} className="border-slate-200" />;
        }
        if (block.startsWith("# ")) {
          return (
            <h1 key={index} className="text-2xl font-semibold text-[#012245]">
              {block.slice(2)}
            </h1>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="text-lg font-semibold text-[#012245]">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("- ")) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.split("\n").map((line) => (
                <li key={line}>{inlineBold(line.replace(/^- /, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inlineBold(block)}
          </p>
        );
      })}
    </article>
  );
}
