"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts"
import { timeSeries, usageByHour } from "@/lib/mock-data"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const processingConfig = {
  processed: { label: "Processadas", color: "var(--chart-1)" },
  credits: { label: "Créditos", color: "var(--chart-2)" },
} satisfies ChartConfig

const usageConfig = {
  requests: { label: "Requisições", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ProcessingChart() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Processamento</CardTitle>
        <CardDescription>
          Imagens processadas e créditos consumidos nos últimos 14 dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={processingConfig} className="aspect-[16/7] w-full">
          <AreaChart data={timeSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fillProcessed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-processed)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-processed)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-credits)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-credits)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="credits"
              type="monotone"
              fill="url(#fillCredits)"
              stroke="var(--color-credits)"
              strokeWidth={2}
            />
            <Area
              dataKey="processed"
              type="monotone"
              fill="url(#fillProcessed)"
              stroke="var(--color-processed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function UsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso da API</CardTitle>
        <CardDescription>Requisições por hora (hoje).</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={usageConfig} className="aspect-[4/5] w-full">
          <BarChart data={usageByHour} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="requests" fill="var(--color-requests)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
