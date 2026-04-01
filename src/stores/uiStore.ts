import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  /** Mobile overlay nav (sidebar drawer) */
  mobileNavOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebar: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  openModal: (modalId: string) => void;
  closeActiveModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  mobileNavOpen: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebar: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeActiveModal: () => set({ activeModal: null }),
}));
