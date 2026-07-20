import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TenantState {
  openaiKey: string | null
  googleKey: string | null
  setOpenaiKey: (key: string | null) => void
  setGoogleKey: (key: string | null) => void
  clearKeys: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      openaiKey: null,
      googleKey: null,
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setGoogleKey: (key) => set({ googleKey: key }),
      clearKeys: () => set({ openaiKey: null, googleKey: null }),
    }),
    {
      name: "tenant-ai-keys", // nome da chave no localStorage
    }
  )
)
