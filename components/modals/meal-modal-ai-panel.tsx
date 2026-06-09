"use client"

import * as React from "react"
import { ImagePlus, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { MealAnalysisItem } from "@/lib/meal-analysis"
import { formatMealAnalysisError } from "@/lib/meal-analysis"

export type MealAiAnalysisMeta = {
  tipo: "texto" | "foto"
  entradaTexto: string | null
  imagemNome: string | null
  raw: unknown
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export function MealModalAiPanel({
  mode,
  onAddItems,
}: {
  mode: "text" | "photo"
  onAddItems: (payload: {
    items: MealAnalysisItem[]
    meta: MealAiAnalysisMeta
  }) => void
}) {
  const [text, setText] = React.useState("")
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [items, setItems] = React.useState<MealAnalysisItem[]>([])
  const [rawResponse, setRawResponse] = React.useState<unknown>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isAnalyzing, startAnalyze] = React.useTransition()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const selectedFileRef = React.useRef<File | null>(null)

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function resetPreview() {
    setItems([])
    setRawResponse(null)
    setError(null)
  }

  function handleAnalyzeText() {
    resetPreview()
    startAnalyze(async () => {
      try {
        const response = await fetch("/api/meals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "text", text }),
        })
        const data = (await response.json()) as {
          error?: string
          items?: MealAnalysisItem[]
          raw?: unknown
        }

        if (!response.ok) {
          setError(
            formatMealAnalysisError(
              new Error(data.error ?? "Não foi possível analisar o texto.")
            )
          )
          return
        }

        setItems(data.items ?? [])
        setRawResponse(data.raw ?? null)
      } catch (cause) {
        setError(formatMealAnalysisError(cause))
      }
    })
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    selectedFileRef.current = file ?? null
    resetPreview()

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    if (!file) {
      setFileName(null)
      setPreviewUrl(null)
      return
    }

    setFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleAnalyzePhoto() {
    const file = selectedFileRef.current
    if (!file) {
      setError("Selecione uma foto antes de analisar.")
      return
    }

    resetPreview()
    startAnalyze(async () => {
      try {
        const imageBase64 = await fileToBase64(file)
        const response = await fetch("/api/meals/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "photo",
            imageBase64,
            mimeType: file.type || "image/jpeg",
            fileName: file.name,
          }),
        })
        const data = (await response.json()) as {
          error?: string
          items?: MealAnalysisItem[]
          raw?: unknown
        }

        if (!response.ok) {
          setError(
            formatMealAnalysisError(
              new Error(data.error ?? "Não foi possível analisar a foto.")
            )
          )
          return
        }

        setItems(data.items ?? [])
        setRawResponse(data.raw ?? null)
      } catch (cause) {
        setError(formatMealAnalysisError(cause))
      }
    })
  }

  function handleAddToCart() {
    if (!items.length) return

    onAddItems({
      items,
      meta: {
        tipo: mode === "text" ? "texto" : "foto",
        entradaTexto: mode === "text" ? text : null,
        imagemNome: mode === "photo" ? fileName : null,
        raw: rawResponse,
      },
    })

    setText("")
    setFileName(null)
    selectedFileRef.current = null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setItems([])
    setRawResponse(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <section className="flex flex-col gap-3">
      {mode === "text" ? (
        <>
          <div>
            <Label htmlFor="meal-ai-text">Descreva a refeição</Label>
            <textarea
              id="meal-ai-text"
              className="mt-2 min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Ex.: 2 ovos mexidos, 1 fatia de pão integral, café sem açúcar"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isAnalyzing || text.trim().length < 3}
            onClick={handleAnalyzeText}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analisar com IA
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="meal-ai-photo">Foto da refeição</Label>
            <input
              ref={fileInputRef}
              id="meal-ai-photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={handleFileChange}
            />
          </div>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Pré-visualização da refeição"
              className="max-h-48 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={isAnalyzing || !selectedFileRef.current}
            onClick={handleAnalyzePhoto}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analisando foto...
              </>
            ) : (
              <>
                <ImagePlus className="size-4" />
                Analisar foto com IA
              </>
            )}
          </Button>
        </>
      )}

      {items.length > 0 ? (
        <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
          <p className="text-sm font-medium">Prévia da IA</p>
          <ul className="mt-2 space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item.nome}-${index}`}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">{item.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {item.qtd}
                  {item.unidade} · {Math.round(item.calorias)} kcal · P{" "}
                  {Math.round(item.proteinas)}g
                </span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={handleAddToCart}
          >
            Adicionar ao carrinho
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Revise quantidades e macros no carrinho antes de salvar.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
