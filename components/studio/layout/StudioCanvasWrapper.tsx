"use client"

import dynamic from "next/dynamic"
import { SmartToolbar } from "./SmartToolbar"
import { QuickActionsMenu } from "./QuickActionsMenu"

const DynamicCanvasArea = dynamic(
  () => import("@/components/studio/layout/StudioCanvasArea").then(mod => mod.StudioCanvasArea),
  { ssr: false }
)

export function StudioCanvasArea() {
  return (
    <>
      <SmartToolbar />
      <QuickActionsMenu />
      <DynamicCanvasArea />
    </>
  )
}
