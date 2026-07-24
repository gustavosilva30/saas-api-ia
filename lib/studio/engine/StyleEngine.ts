import { IRenderEngine } from './IRenderEngine';
import { IStylePreset } from './StyleLibrary';

export class StyleEngine {
  /**
   * Aplica um preset de estilo a um conjunto de objetos.
   */
  static applyStyleToObjects(
    engine: IRenderEngine,
    objectIds: string[],
    preset: IStylePreset
  ) {
    if (!engine || objectIds.length === 0) return;

    // TODO: if preset.motion exists, we should interact with MotionEngine
    // But for now we just handle visual properties

    objectIds.forEach(id => {
      // Aplicamos propriedades básicas (fill, stroke, strokeWidth, rx, ry, opacity)
      const propsToUpdate: any = {};
      
      if (preset.properties.fill !== undefined) propsToUpdate.fill = preset.properties.fill;
      if (preset.properties.stroke !== undefined) propsToUpdate.stroke = preset.properties.stroke;
      if (preset.properties.strokeWidth !== undefined) propsToUpdate.strokeWidth = preset.properties.strokeWidth;
      if (preset.properties.rx !== undefined) propsToUpdate.rx = preset.properties.rx;
      if (preset.properties.ry !== undefined) propsToUpdate.ry = preset.properties.ry;
      if (preset.properties.opacity !== undefined) propsToUpdate.opacity = preset.properties.opacity;

      // Blend Mode (globalCompositeOperation)
      if (preset.properties.blendMode) {
        propsToUpdate.globalCompositeOperation = preset.properties.blendMode;
      }

      if (Object.keys(propsToUpdate).length > 0) {
        engine.updateObjectProperties(id, propsToUpdate);
      }
      
      // Sombras
      if (preset.properties.shadow !== undefined) {
        engine.applyShadowToSelected(preset.properties.shadow);
      }

      // Filtros de Imagem (aplicar apenas em fabric.Image via adjustments)
      if (preset.properties.filters && preset.properties.filters.length > 0) {
        const adjustments: any = {};
        preset.properties.filters.forEach(f => {
          switch (f.type) {
            case 'brightness': adjustments.brightness = f.value ?? 0; break;
            case 'contrast': adjustments.contrast = f.value ?? 0; break;
            case 'saturation': adjustments.saturation = f.value ?? 0; break;
            case 'hue': adjustments.hue = f.value ?? 0; break;
            case 'blur': adjustments.blur = f.value ?? 0; break;
            case 'noise': adjustments.noise = f.value ?? 0; break;
            case 'pixelate': adjustments.pixelate = f.value ?? 2; break;
          }
        });
        if (Object.keys(adjustments).length > 0) {
          engine.applyAdjustments(id, adjustments);
        }
      }
    });

    engine.requestRender();
  }
}
