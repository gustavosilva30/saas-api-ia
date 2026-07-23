import { create } from 'zustand';
import { EventBus, StudioEvent } from '@/lib/studio/events/EventBus';

export type SelectionType = 'none' | 'single' | 'multiple' | 'lasso';

interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  selectionType: SelectionType;
  
  // Ações
  setSelection: (ids: string[]) => void;
  addSelection: (id: string) => void;
  removeSelection: (id: string) => void;
  clearSelection: () => void;
  
  setHover: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  hoveredId: null,
  selectionType: 'none',

  setSelection: (ids) => {
    const type = ids.length === 0 ? 'none' : ids.length === 1 ? 'single' : 'multiple';
    set({ selectedIds: ids, selectionType: type });
    EventBus.emit(StudioEvent.SELECTION_CHANGED, { selectedIds: ids });
  },

  addSelection: (id) => {
    const current = get().selectedIds;
    if (!current.includes(id)) {
      const newIds = [...current, id];
      const type = newIds.length === 0 ? 'none' : newIds.length === 1 ? 'single' : 'multiple';
      set({ selectedIds: newIds, selectionType: type });
      EventBus.emit(StudioEvent.SELECTION_CHANGED, { selectedIds: newIds });
    }
  },

  removeSelection: (id) => {
    const current = get().selectedIds;
    const newIds = current.filter(existingId => existingId !== id);
    const type = newIds.length === 0 ? 'none' : newIds.length === 1 ? 'single' : 'multiple';
    set({ selectedIds: newIds, selectionType: type });
    EventBus.emit(StudioEvent.SELECTION_CHANGED, { selectedIds: newIds });
  },

  clearSelection: () => {
    if (get().selectedIds.length > 0) {
      set({ selectedIds: [], selectionType: 'none' });
      EventBus.emit(StudioEvent.SELECTION_CHANGED, { selectedIds: [] });
    }
  },

  setHover: (id) => {
    if (get().hoveredId !== id) {
      set({ hoveredId: id });
      EventBus.emit(StudioEvent.HOVER_CHANGED, { objectId: id });
    }
  }
}));
