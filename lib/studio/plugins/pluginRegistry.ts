import { PluginManager } from "./PluginManager"
import { AssetsPlugin } from "@/components/studio/plugins/AssetsPlugin"
import { BackgroundPlugin } from "@/components/studio/plugins/BackgroundPlugin"
import { ShadowPlugin } from "@/components/studio/plugins/ShadowPlugin"
import { RemoveBgPlugin } from "@/components/studio/plugins/RemoveBgPlugin"
import { LayersPlugin } from "@/components/studio/plugins/LayersPlugin"
import { HistoryPlugin } from "@/components/studio/plugins/HistoryPlugin"
import { AdjustmentsPlugin } from "@/components/studio/plugins/AdjustmentsPlugin"
import { SelectionPlugin } from "@/components/studio/plugins/SelectionPlugin"
import { TypographyPlugin } from "@/components/studio/plugins/TypographyPlugin/TypographyPlugin"
import { ShapePlugin } from "@/components/studio/plugins/ShapePlugin"
import { ExportPlugin } from "@/components/studio/plugins/ExportPlugin"

import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { NextApiBackgroundRemovalProvider } from "@/lib/studio/ai/providers/BackgroundRemovalProvider"

// Registra todos os plugins disponíveis no sistema
export function registerAllPlugins() {
  // Evita registrar múltiplos se a função for chamada novamente no React Strict Mode
  if (PluginManager.getAllPlugins().length === 0) {
    PluginManager.register(AssetsPlugin)
    PluginManager.register(BackgroundPlugin)
    PluginManager.register(ShadowPlugin)
    PluginManager.register(AdjustmentsPlugin)
    PluginManager.register(SelectionPlugin)
    PluginManager.register(TypographyPlugin)
    PluginManager.register(ShapePlugin)
    PluginManager.register(RemoveBgPlugin)
    PluginManager.register(LayersPlugin)
    PluginManager.register(HistoryPlugin)
    PluginManager.register(ExportPlugin)

    // Registra os provedores de IA
    AIProviderManager.registerBgRemovalProvider(new NextApiBackgroundRemovalProvider())
  }
}
