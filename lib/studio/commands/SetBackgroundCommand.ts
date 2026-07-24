import { ICommand } from './ICommand';
import { useStudioStore } from '@/store/useStudioStore';

export class SetBackgroundCommand implements ICommand {
  private prevColor: any | null;
  private prevImage: string | null;
  private newColor: any | null;
  private newImage: string | null;

  constructor(
    newColor: any | null,
    newImage: string | null,
    prevColor: any | null,
    prevImage: string | null
  ) {
    this.newColor = newColor;
    this.newImage = newImage;
    this.prevColor = prevColor;
    this.prevImage = prevImage;
  }

  get id(): string {
    return `set_bg_${Date.now()}`;
  }

  get label(): string {
    return 'Alterar Fundo';
  }

  async execute(): Promise<void> {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    if (this.newImage) {
      await engine.setBackgroundImage(this.newImage);
    } else {
      engine.clearBackgroundImage();
      if (this.newColor) {
        if (typeof this.newColor === 'string') {
          engine.setBackgroundColor(this.newColor);
        } else if (typeof this.newColor === 'object' && this.newColor !== null) {
          engine.setBackgroundGradient(this.newColor);
        }
      }
    }
  }

  async undo(): Promise<void> {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    if (this.prevImage) {
      await engine.setBackgroundImage(this.prevImage);
    } else {
      engine.clearBackgroundImage();
      if (this.prevColor) {
        if (typeof this.prevColor === 'string') {
          engine.setBackgroundColor(this.prevColor);
        } else if (typeof this.prevColor === 'object' && this.prevColor !== null) {
          engine.setBackgroundGradient(this.prevColor);
        }
      }
    }
  }
}
