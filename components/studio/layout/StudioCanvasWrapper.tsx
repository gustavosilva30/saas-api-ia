"use client"

import dynamic from "next/dynamic"

export const StudioCanvasArea = dynamic(
  () => import("@/components/studio/layout/StudioCanvasArea").then(mod => mod.StudioCanvasArea),
  { ssr: false }
)
