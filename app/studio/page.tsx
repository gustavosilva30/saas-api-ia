import { StudioTopbar } from "@/components/studio/layout/StudioTopbar"
import { StudioSidebar } from "@/components/studio/layout/StudioSidebar"
import { StudioCanvasArea } from "@/components/studio/layout/StudioCanvasArea"
import { StudioPropertiesPanel } from "@/components/studio/layout/StudioPropertiesPanel"

export const metadata = {
  title: "AI Studio | Editor Profissional",
}

export default function StudioPage() {
  return (
    <div className="flex flex-col w-full h-full">
      <StudioTopbar />
      
      <div className="flex flex-1 overflow-hidden">
        <StudioSidebar />
        <StudioCanvasArea />
        <StudioPropertiesPanel />
      </div>
    </div>
  )
}
