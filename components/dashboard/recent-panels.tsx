import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { apiRequests, recentImages } from "@/lib/mock-data"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/dashboard/status-badge"

export function RecentImages() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas imagens</CardTitle>
        <CardDescription>Processadas recentemente.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/history" />}>
            Ver tudo
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {recentImages.slice(0, 5).map((img) => (
          <div
            key={img.id}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-checkerboard">
              <Image src={img.originalUrl} alt={img.name} fill className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{img.name}</span>
              <span className="text-xs text-muted-foreground">
                {img.resolution} · {timeAgo(img.createdAt)}
              </span>
            </div>
            <StatusBadge status={img.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RecentRequests() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas requisições</CardTitle>
        <CardDescription>Atividade da API.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/api" />}>
            Ver API
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {apiRequests.slice(0, 5).map((req) => {
          const ok = req.status < 400
          return (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <span
                className={cn(
                  "flex w-11 shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-xs font-medium",
                  ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
                )}
              >
                {req.status}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-mono text-sm">
                  <span className="text-muted-foreground">{req.method}</span>{" "}
                  {req.endpoint}
                </span>
                <span className="text-xs text-muted-foreground">
                  {req.latencyMs}ms · {timeAgo(req.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
