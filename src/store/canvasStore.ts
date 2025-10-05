import { create } from 'zustand';
import type { CanvasState, DesignElement } from '@/types';

interface CanvasStore extends CanvasState {
  history: DesignElement[][];
  historyIndex: number;
  addElement: (element: DesignElement) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setTool: (tool: CanvasState['tool']) => void;
  setZoom: (zoom: number) => void;
  clearCanvas: () => void;
  loadElements: (elements: DesignElement[]) => void;
  setConnectingFrom: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedId: null,
  tool: 'select',
  zoom: 1,
  connectingFrom: null,
  history: [[]],
  historyIndex: 0,

  addElement: (element) =>
    set((state) => {
      const newElements = [...state.elements, element];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);

      return {
        elements: newElements,
        history: newHistory.slice(-MAX_HISTORY),
        historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
      };
    }),

  updateElement: (id, updates) =>
    set((state) => {
      const newElements = state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);

      return {
        elements: newElements,
        history: newHistory.slice(-MAX_HISTORY),
        historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
      };
    }),

  deleteElement: (id) =>
    set((state) => {
      // Remove the element and all connectors attached to it
      const newElements = state.elements.filter((el) => {
        // Remove the element itself
        if (el.id === id) return false;

        // Remove connectors that are connected to this element
        if (el.type === 'connector' &&
            (el.startElementId === id || el.endElementId === id)) {
          return false;
        }

        return true;
      });

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);

      return {
        elements: newElements,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: newHistory.slice(-MAX_HISTORY),
        historyIndex: Math.min(newHistory.length - 1, MAX_HISTORY - 1),
      };
    }),

  selectElement: (id) => set({ selectedId: id }),

  setTool: (tool) => set({ tool, selectedId: null, connectingFrom: null }),

  setZoom: (zoom) => set({ zoom }),

  clearCanvas: () => set({
    elements: [],
    selectedId: null,
    connectingFrom: null,
    history: [[]],
    historyIndex: 0,
  }),

  loadElements: (elements) => set((state) => {
    // Only reset history if elements are actually different (not just a save update)
    const elementsChanged = JSON.stringify(state.elements) !== JSON.stringify(elements);

    if (elementsChanged) {
      return {
        elements,
        selectedId: null,
        connectingFrom: null,
        history: [elements],
        historyIndex: 0,
      };
    }

    // If elements are the same, don't reset history
    return { elements };
  }),

  setConnectingFrom: (id) => set({ connectingFrom: id }),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;
    }),

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },
}));
