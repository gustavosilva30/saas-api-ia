import { create } from 'zustand';
import { useEffect } from 'react';

type HotkeyCallback = (e: KeyboardEvent) => void;

interface HotkeyRegistration {
  id: string;
  keys: string[]; // ex: ['Control', 'z']
  callback: HotkeyCallback;
  preventDefault?: boolean;
}

interface KeyboardState {
  pressedKeys: Set<string>;
  registrations: Map<string, HotkeyRegistration>;
  
  // Actions
  setKeyPressed: (key: string, isPressed: boolean) => void;
  registerHotkey: (registration: HotkeyRegistration) => void;
  unregisterHotkey: (id: string) => void;
}

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  pressedKeys: new Set(),
  registrations: new Map(),

  setKeyPressed: (key, isPressed) => set((state) => {
    const newKeys = new Set(state.pressedKeys);
    if (isPressed) {
      newKeys.add(key.toLowerCase());
    } else {
      newKeys.delete(key.toLowerCase());
    }
    return { pressedKeys: newKeys };
  }),

  registerHotkey: (reg) => set((state) => {
    const newMap = new Map(state.registrations);
    newMap.set(reg.id, {
      ...reg,
      keys: reg.keys.map(k => k.toLowerCase())
    });
    return { registrations: newMap };
  }),

  unregisterHotkey: (id) => set((state) => {
    const newMap = new Map(state.registrations);
    newMap.delete(id);
    return { registrations: newMap };
  })
}));

/**
 * Hook global para inicializar o listener de atalhos de teclado.
 * Deve ser instanciado apenas uma vez, no Root do Studio.
 */
export function useKeyboardEngineInit() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useKeyboardStore.getState();
      state.setKeyPressed(e.key, true);

      // Avaliar se algum atalho completo foi ativado
      const pressed = state.pressedKeys;
      
      state.registrations.forEach((reg) => {
        // Verifica se todas as chaves exigidas estão pressionadas
        const allPressed = reg.keys.every(k => pressed.has(k));
        if (allPressed) {
          if (reg.preventDefault) {
            e.preventDefault();
          }
          reg.callback(e);
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      useKeyboardStore.getState().setKeyPressed(e.key, false);
    };

    const handleBlur = () => {
      useKeyboardStore.setState({ pressedKeys: new Set() });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur); // Previne stuck keys se o usuário mudar de aba

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
}
