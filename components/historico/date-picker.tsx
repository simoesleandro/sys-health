"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { parseBrtDateString } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function HistoricoDatePicker({
  selectedDate,
}: {
  selectedDate: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)
  const selected = parseBrtDateString(selectedDate)

  function handleSelect(date: Date | undefined) {
    if (!date) return

    const nextDate = format(date, "yyyy-MM-dd")
    const params = new URLSearchParams(searchParams.toString())
    params.set("data", nextDate)

    setOpen(false)
    router.push(`?${params.toString()}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 font-normal sm:w-auto",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          locale={ptBR}
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
