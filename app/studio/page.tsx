import { StudioTopbar } from "@/components/studio/layout/StudioTopbar"
import { StudioSidebar } from "@/components/studio/layout/StudioSidebar"
import { StudioCanvasArea } from "@/components/studio/layout/StudioCanvasWrapper"
import { StudioPropertiesPanel } from "@/components/studio/layout/StudioPropertiesPanel"
import { TimelinePlugin } from "@/components/studio/plugins/TimelinePlugin"

export const metadata = {
  title: "AI Studio | Editor Profissional",
}

export default function StudioPage() {
  return (
    <div className="flex flex-col w-full h-full">
      <StudioTopbar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <StudioSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <StudioCanvasArea />
          <TimelinePlugin />
        </div>
        <StudioPropertiesPanel />
      </div>
    </div>
  )
}
