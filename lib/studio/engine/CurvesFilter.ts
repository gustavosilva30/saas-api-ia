import { fabric } from "fabric";

/**
 * Filtro customizado para Curvas no Fabric.js.
 * Utiliza uma LUT (Lookup Table) pré-calculada de 256 posições.
 */
export const CurvesFilter = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
  type: 'Curves',
  
  lut: null, // Array de 256 valores [0..255]
  
  initialize: function(options: any) {
    this.callSuper('initialize', options);
    // Se nenhuma LUT for provida, usa uma identidade
    this.lut = options.lut || Array.from({ length: 256 }, (_, i) => i);
  },
  
  applyTo2d: function(options: any) {
    const imageData = options.imageData;
    const data = imageData.data;
    const lut = this.lut;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];         // R
      data[i + 1] = lut[data[i + 1]]; // G
      data[i + 2] = lut[data[i + 2]]; // B
      // data[i+3] é o Alpha (A), não alteramos nas curvas normais
    }
  },
  
  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      lut: this.lut
    });
  }
});

// Registra o filtro no namespace do Fabric para que seja serializável
fabric.Image.filters.Curves = CurvesFilter;
(fabric as any).Curves = CurvesFilter; // compatibilidade
