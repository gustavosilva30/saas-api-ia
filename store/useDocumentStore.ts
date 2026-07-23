import { create } from 'zustand';
import { StudioDocument, StudioPage, StudioAsset, StudioStyle, StudioVariable } from '@/lib/studio/core/models/DocumentModels';

interface DocumentState {
  document: StudioDocument | null;
  activePageId: string | null;
  
  // Actions
  setDocument: (doc: StudioDocument) => void;
  setActivePage: (pageId: string) => void;
  
  // Pages
  addPage: (page: StudioPage) => void;
  updatePage: (pageId: string, updates: Partial<StudioPage>) => void;
  removePage: (pageId: string) => void;
  
  // Assets, Styles, Variables
  addAsset: (asset: StudioAsset) => void;
  addStyle: (style: StudioStyle) => void;
  addVariable: (variable: StudioVariable) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  activePageId: null,
  
  setDocument: (doc) => set({ 
    document: doc,
    activePageId: doc.pages.length > 0 ? doc.pages[0].id : null
  }),
  
  setActivePage: (pageId) => set({ activePageId: pageId }),
  
  addPage: (page) => set((state) => ({
    document: state.document ? {
      ...state.document,
      pages: [...state.document.pages, page]
    } : null
  })),
  
  updatePage: (pageId, updates) => set((state) => ({
    document: state.document ? {
      ...state.document,
      pages: state.document.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
    } : null
  })),
  
  removePage: (pageId) => set((state) => ({
    document: state.document ? {
      ...state.document,
      pages: state.document.pages.filter(p => p.id !== pageId)
    } : null
  })),
  
  addAsset: (asset) => set((state) => ({
    document: state.document ? {
      ...state.document,
      assets: [...state.document.assets, asset]
    } : null
  })),
  
  addStyle: (style) => set((state) => ({
    document: state.document ? {
      ...state.document,
      styles: [...state.document.styles, style]
    } : null
  })),
  
  addVariable: (variable) => set((state) => ({
    document: state.document ? {
      ...state.document,
      variables: [...state.document.variables, variable]
    } : null
  }))
}));
