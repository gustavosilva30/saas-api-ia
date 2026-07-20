import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TenantState {
  openaiKey: string | null
  googleKey: string | null
  bananaKey: string | null
  setOpenaiKey: (key: string | null) => void
  setGoogleKey: (key: string | null) => void
  setBananaKey: (key: string | null) => void
  clearKeys: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      openaiKey: null,
      googleKey: null,
      bananaKey: null,
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setGoogleKey: (key) => set({ googleKey: key }),
      setBananaKey: (key) => set({ bananaKey: key }),
      clearKeys: () => set({ openaiKey: null, googleKey: null, bananaKey: null }),
    }),
    {
      name: "tenant-ai-keys", // nome da chave no localStorage
    }
  )
)
