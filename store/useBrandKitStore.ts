import { create } from "zustand"

export interface BrandKit {
  id?: string
  name: string
  colors: string[]
  typography: {
    primary: string
    secondary: string
  }
  logos: {
    light: string
    dark: string
    icon: string
  }
  tone_of_voice: string
}

interface BrandKitState {
  brandKit: BrandKit | null
  isLoading: boolean
  error: string | null
  fetchBrandKit: () => Promise<void>
  saveBrandKit: (data: BrandKit) => Promise<void>
}

export const useBrandKitStore = create<BrandKitState>((set) => ({
  brandKit: null,
  isLoading: false,
  error: null,

  fetchBrandKit: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch("/api/brand-kit", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Falha ao obter Brand Kit")
      const data = await res.json()
      set({ brandKit: {
        ...data,
        colors: typeof data.colors === 'string' ? JSON.parse(data.colors) : (data.colors || []),
        typography: typeof data.typography === 'string' ? JSON.parse(data.typography) : (data.typography || { primary: "Inter", secondary: "Roboto" }),
        logos: typeof data.logos === 'string' ? JSON.parse(data.logos) : (data.logos || { light: "", dark: "", icon: "" })
      }})
    } catch (err: any) {
      set({ error: err.message || "Erro desconhecido" })
    } finally {
      set({ isLoading: false })
    }
  },

  saveBrandKit: async (data: BrandKit) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Falha ao salvar Brand Kit")
      const savedData = await res.json()
      set({ brandKit: {
        ...savedData,
        colors: typeof savedData.colors === 'string' ? JSON.parse(savedData.colors) : (savedData.colors || []),
        typography: typeof savedData.typography === 'string' ? JSON.parse(savedData.typography) : (savedData.typography || { primary: "Inter", secondary: "Roboto" }),
        logos: typeof savedData.logos === 'string' ? JSON.parse(savedData.logos) : (savedData.logos || { light: "", dark: "", icon: "" })
      }})
    } catch (err: any) {
      set({ error: err.message || "Erro desconhecido" })
      throw err
    } finally {
      set({ isLoading: false })
    }
  }
}))
