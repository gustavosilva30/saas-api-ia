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
      // Aplicamos propriedades básicas
      const propsToUpdate: any = {};
      
      if (preset.properties.fill !== undefined) propsToUpdate.fill = preset.properties.fill;
      if (preset.properties.stroke !== undefined) propsToUpdate.stroke = preset.properties.stroke;
      if (preset.properties.strokeWidth !== undefined) propsToUpdate.strokeWidth = preset.properties.strokeWidth;
      if (preset.properties.rx !== undefined) propsToUpdate.rx = preset.properties.rx;
      if (preset.properties.ry !== undefined) propsToUpdate.ry = preset.properties.ry;
      if (preset.properties.opacity !== undefined) propsToUpdate.opacity = preset.properties.opacity;

      if (Object.keys(propsToUpdate).length > 0) {
        engine.updateObjectProperties(id, propsToUpdate);
      }
      
      // Sombras precisam de um tratamento especial pois dependem de criar instâncias no Fabric
      // O applyShadowToSelected atua no objeto ativo. Numa implementação futura, 
      // idealmente teremos engine.applyShadowToObject(id, shadow)
      if (preset.properties.shadow !== undefined) {
        engine.applyShadowToSelected(preset.properties.shadow);
      }
    });

    engine.requestRender();
  }
}
