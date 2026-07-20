import { Type } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { TypographySidebar } from "./TypographySidebar"
import { TypographyContextPanel } from "./TypographyContextPanel"

export const TypographyPlugin: StudioPlugin = {
  id: "typography",
  name: "Tipografia",
  icon: Type,
  SidebarComponent: TypographySidebar,
  ContextComponent: TypographyContextPanel,
}
