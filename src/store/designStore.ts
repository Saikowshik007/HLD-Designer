import { create } from 'zustand';
import type { DesignState, Design, DesignElement } from '@/types';
import { designService } from '@/services/designService';

interface DesignStore extends DesignState {
  setCurrentDesign: (design: Design | null) => void;
  setDesigns: (designs: Design[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  saveDesign: (userId: string, elements: DesignElement[], title: string) => Promise<void>;
  loadLastDesign: (userId: string) => Promise<void>;
  loadDesign: (designId: string) => Promise<void>;
  loadUserDesigns: (userId: string) => Promise<void>;
  deleteDesign: (designId: string) => Promise<void>;
  createNewDesign: () => void;
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  currentDesign: null,
  designs: [],
  loading: false,
  error: null,

  setCurrentDesign: (design) => set({ currentDesign: design }),
  setDesigns: (designs) => set({ designs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  createNewDesign: () => {
    set({ currentDesign: null });
  },

  saveDesign: async (userId, elements, title) => {
    const currentDesign = get().currentDesign;
    set({ loading: true, error: null });

    try {
      const design = await designService.createOrUpdateDesign(
        userId,
        currentDesign?.id || null,
        elements,
        title
      );

      set({
        currentDesign: design,
        designs: currentDesign
          ? get().designs.map((d) => d.id === design.id ? design : d)
          : [design, ...get().designs],
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save design',
        loading: false,
      });
      throw error;
    }
  },

  loadLastDesign: async (userId) => {
    set({ loading: true, error: null });
    try {
      const design = await designService.getLastDesign(userId);
      set({ currentDesign: design, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load last design',
        loading: false,
      });
    }
  },

  loadDesign: async (designId) => {
    set({ loading: true, error: null });
    try {
      const design = await designService.getDesign(designId);
      if (!design) {
        throw new Error('Design not found');
      }
      set({ currentDesign: design, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load design',
        loading: false,
      });
      throw error;
    }
  },

  loadUserDesigns: async (userId) => {
    set({ loading: true, error: null });
    try {
      const designs = await designService.getUserDesigns(userId);
      set({ designs, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load designs',
        loading: false,
      });
      throw error;
    }
  },

  deleteDesign: async (designId) => {
    set({ loading: true, error: null });
    try {
      await designService.deleteDesign(designId);
      set({
        designs: get().designs.filter((d) => d.id !== designId),
        currentDesign: get().currentDesign?.id === designId ? null : get().currentDesign,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete design',
        loading: false,
      });
      throw error;
    }
  },
}));
