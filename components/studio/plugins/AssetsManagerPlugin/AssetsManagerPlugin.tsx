import { Package } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { AssetsManagerSidebar } from "./AssetsManagerSidebar"

export const AssetsManagerPlugin: StudioPlugin = {
  id: "assets-manager",
  name: "Assets",
  icon: Package,
  SidebarComponent: AssetsManagerSidebar,
}
