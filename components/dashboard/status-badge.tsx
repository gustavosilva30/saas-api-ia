import { Badge } from "@/components/ui/badge"
import type { JobStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const map: Record<JobStatus, { label: string; className: string; dot: string }> = {
  done: { label: "Concluído", className: "bg-primary/10 text-primary", dot: "bg-primary" },
  processing: { label: "Processando", className: "bg-chart-3/15 text-chart-3", dot: "bg-chart-3 animate-pulse" },
  queued: { label: "Na fila", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  canceled: { label: "Cancelado", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = map[status]
  return (
    <Badge variant="secondary" className={cn("gap-1.5 border-transparent", s.className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  )
}
