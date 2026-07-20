import { Type } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { TypographySidebar } from "./TypographySidebar"

export const TypographyPlugin: StudioPlugin = {
  id: "typography",
  name: "Tipografia",
  icon: Type,
  SidebarComponent: TypographySidebar,
}
