import { ICommand } from './ICommand';
import { useStudioStore } from '@/store/useStudioStore';

export class SetBackgroundCommand implements ICommand {
  private prevColor: string | null;
  private prevImage: string | null;
  private newColor: string | null;
  private newImage: string | null;

  constructor(
    newColor: string | null,
    newImage: string | null,
    prevColor: string | null,
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
        engine.setBackgroundColor(this.newColor);
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
        engine.setBackgroundColor(this.prevColor);
      }
    }
  }
}
