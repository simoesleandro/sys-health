function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1 py-0.5 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return <span key={index}>{part}</span>
  })
}

export function ChatMessageContent({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n")
        const isList = lines.every(
          (line) => line.trim() === "" || line.trim().startsWith("- ")
        )

        if (isList && lines.some((line) => line.trim().startsWith("- "))) {
          return (
            <ul
              key={blockIndex}
              className="list-disc space-y-1 pl-5 text-foreground/90"
            >
              {lines
                .filter((line) => line.trim().startsWith("- "))
                .map((line, lineIndex) => (
                  <li key={lineIndex}>
                    {formatInlineMarkdown(line.replace(/^\-\s*/, ""))}
                  </li>
                ))}
            </ul>
          )
        }

        const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)/)
        if (headingMatch) {
          return (
            <div key={blockIndex} className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">
                {headingMatch[1]}
              </h3>
              {lines.slice(1).map((line, lineIndex) => (
                <p key={lineIndex} className="text-foreground/90">
                  {formatInlineMarkdown(line)}
                </p>
              ))}
            </div>
          )
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap text-foreground/90">
            {formatInlineMarkdown(block)}
          </p>
        )
      })}
    </div>
  )
}
