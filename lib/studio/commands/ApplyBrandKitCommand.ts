import { ICommand } from "./ICommand";
import { IRenderEngine } from "../adapters/IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";
import { BrandKit } from "../../../store/useBrandKitStore";

export class ApplyBrandKitCommand implements ICommand {
  private objectId: string;
  private brandKit: BrandKit;
  private targetProp: "color" | "font" | "logo";
  private colorIndex?: number;
  private fontType?: "primary" | "secondary";
  
  private oldProperties: any = null;
  private addedLogoId: string | null = null;

  constructor(
    objectId: string, 
    brandKit: BrandKit, 
    targetProp: "color" | "font" | "logo",
    options?: { colorIndex?: number; fontType?: "primary" | "secondary" }
  ) {
    this.objectId = objectId;
    this.brandKit = brandKit;
    this.targetProp = targetProp;
    this.colorIndex = options?.colorIndex;
    this.fontType = options?.fontType;
  }

  async execute(engine: IRenderEngine): Promise<void> {
    if (!engine) return;

    if (this.targetProp === "color" && this.colorIndex !== undefined) {
      const color = this.brandKit.colors[this.colorIndex];
      if (color) {
        // Salvar propriedades antigas
        this.oldProperties = engine.getObjectProperties(this.objectId);
        engine.updateObjectProperties(this.objectId, { fill: color });
        engine.requestRender();
        EventBus.emit(StudioEvent.OBJECT_MODIFIED, { id: this.objectId });
      }
    } else if (this.targetProp === "font" && this.fontType) {
      const font = this.fontType === "primary" ? this.brandKit.typography.primary : this.brandKit.typography.secondary;
      if (font) {
        this.oldProperties = engine.getObjectProperties(this.objectId);
        engine.updateObjectProperties(this.objectId, { fontFamily: font });
        engine.requestRender();
        EventBus.emit(StudioEvent.OBJECT_MODIFIED, { id: this.objectId });
      }
    } else if (this.targetProp === "logo") {
      const logoUrl = this.brandKit.logos.light || this.brandKit.logos.dark || this.brandKit.logos.icon;
      if (logoUrl) {
        // Insere a logo como uma nova imagem no centro do canvas
        const id = await engine.addImageFromUrl(logoUrl);
        this.addedLogoId = id;
      }
    }
  }

  async undo(engine: IRenderEngine): Promise<void> {
    if (!engine) return;

    if (this.targetProp === "logo" && this.addedLogoId) {
      engine.removeObject(this.addedLogoId);
      engine.requestRender();
      this.addedLogoId = null;
    } else if (this.oldProperties) {
      engine.updateObjectProperties(this.objectId, this.oldProperties);
      engine.requestRender();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, { id: this.objectId });
    }
  }
}
