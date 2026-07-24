import { PluginManager } from "./PluginManager"
import { AssetsManagerPlugin } from "@/components/studio/plugins/AssetsManagerPlugin/AssetsManagerPlugin"
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
import { MotionPropertiesPlugin } from "@/components/studio/plugins/MotionPropertiesPlugin"
import { DrawingPlugin } from "@/components/studio/plugins/DrawingPlugin"
import { ComponentsLibraryPlugin } from "@/components/studio/plugins/ComponentsLibraryPlugin"
import { StylesLibraryPlugin } from "@/components/studio/plugins/StylesLibraryPlugin"
import { TemplatesPlugin } from "@/components/studio/plugins/TemplatesPlugin"
import { AIAssistantPlugin } from "@/components/studio/plugins/AIAssistantPlugin"

import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { NextApiBackgroundRemovalProvider } from "@/lib/studio/ai/providers/BackgroundRemovalProvider"
import { NextApiImageGenerationProvider } from "@/lib/studio/ai/providers/ImageGenerationProvider"
import { NextApiInpaintingProvider } from "@/lib/studio/ai/providers/InpaintingProvider"
import { NextApiUpscaleProvider } from "@/lib/studio/ai/providers/UpscaleProvider"
import { NextApiSmartSelectionProvider } from "@/lib/studio/ai/providers/SmartSelectionProvider"
import { BrandKitPlugin } from "@/components/studio/plugins/BrandKitPlugin"
import { BulkCreatePlugin } from "@/components/studio/plugins/BulkCreatePlugin"

// Registra todos os plugins disponíveis no sistema
export function registerAllPlugins() {
  // Evita registrar múltiplos se a função for chamada novamente no React Strict Mode
  if (PluginManager.getAllPlugins().length === 0) {
    PluginManager.register(AssetsManagerPlugin)
    PluginManager.register(TemplatesPlugin)
    PluginManager.register(ComponentsLibraryPlugin)
    PluginManager.register(StylesLibraryPlugin)
    PluginManager.register(BrandKitPlugin) // Novo plugin de Identidade de Marca
    PluginManager.register(BulkCreatePlugin) // Novo plugin de Produção em Lote (Bulk Create)
    PluginManager.register(AIAssistantPlugin)
    PluginManager.register(BackgroundPlugin)
    PluginManager.register(ShadowPlugin)
    PluginManager.register(AdjustmentsPlugin)
    PluginManager.register(SelectionPlugin)
    PluginManager.register(TypographyPlugin)
    PluginManager.register(ShapePlugin)
    PluginManager.register(LayersPlugin)
    PluginManager.register(HistoryPlugin)
    PluginManager.register(ExportPlugin)
    PluginManager.register(MotionPropertiesPlugin)
    PluginManager.register(DrawingPlugin)

    // Registra os provedores de IA
    AIProviderManager.registerBgRemovalProvider(new NextApiBackgroundRemovalProvider())
    AIProviderManager.registerImageGenerationProvider(new NextApiImageGenerationProvider())
    AIProviderManager.registerInpaintingProvider(new NextApiInpaintingProvider())
    AIProviderManager.registerUpscaleProvider(new NextApiUpscaleProvider())
    AIProviderManager.registerSmartSelectionProvider(new NextApiSmartSelectionProvider())
  }
}
