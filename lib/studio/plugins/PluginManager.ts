import { StudioPlugin } from "./BasePlugin";
import { EventBus, StudioEvent } from "../events/EventBus";

class PluginManagerCore {
  private plugins: Map<string, StudioPlugin> = new Map();

  /**
   * Registra um novo plugin no sistema.
   */
  register(plugin: StudioPlugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with ID ${plugin.id} is already registered.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Retorna um plugin pelo ID.
   */
  getPlugin(id: string): StudioPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Retorna todos os plugins registrados (útil para a Sidebar).
   */
  getAllPlugins(): StudioPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const PluginManager = new PluginManagerCore();
