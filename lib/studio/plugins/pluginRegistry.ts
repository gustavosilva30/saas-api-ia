import { PluginManager } from "./PluginManager"
import { AssetsPlugin } from "@/components/studio/plugins/AssetsPlugin"
import { BackgroundPlugin } from "@/components/studio/plugins/BackgroundPlugin"
import { ShadowPlugin } from "@/components/studio/plugins/ShadowPlugin"
import { RemoveBgPlugin } from "@/components/studio/plugins/RemoveBgPlugin"
import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { NextApiBackgroundRemovalProvider } from "@/lib/studio/ai/providers/BackgroundRemovalProvider"

// Registra todos os plugins disponíveis no sistema
export function registerAllPlugins() {
  // Evita registrar múltiplos se a função for chamada novamente no React Strict Mode
  if (PluginManager.getAllPlugins().length === 0) {
    PluginManager.register(AssetsPlugin)
    PluginManager.register(BackgroundPlugin)
    PluginManager.register(ShadowPlugin)
    PluginManager.register(RemoveBgPlugin)

    // Registra os provedores de IA
    AIProviderManager.registerBgRemovalProvider(new NextApiBackgroundRemovalProvider())
  }
}
