import { ArrowDownRight, ArrowUpRight, Clock, Coins, ImageIcon, TrendingUp } from "lucide-react"
import { metrics } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const icons = [ImageIcon, TrendingUp, Coins, Clock]

export function StatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m, i) => {
        const Icon = icons[i]
        const positive = m.delta >= 0
        return (
          <Card key={m.label} className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {m.label}
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                {m.value}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                    positive
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {Math.abs(m.delta)}%
                </span>
                <span className="text-muted-foreground">{m.hint}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
