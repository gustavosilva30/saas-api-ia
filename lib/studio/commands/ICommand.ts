export interface ICommand {
  /**
   * Executa ou re-executa a ação.
   */
  execute(): void;

  /**
   * Desfaz a ação.
   */
  undo(): void;

  /**
   * Nome do comando para propósitos de debug ou histórico visual.
   */
  name: string;
}
