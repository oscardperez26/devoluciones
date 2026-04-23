import { create } from 'zustand';

export interface AdminFilters {
  status: string;
  search: string;
  page: number;
  limit: number;
  dateFrom: string;
  dateTo: string;
}

interface AdminState {
  filters: AdminFilters;
  setFilter: <K extends keyof AdminFilters>(key: K, value: AdminFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: AdminFilters = {
  status: '',
  search: '',
  page: 1,
  limit: 20,
  dateFrom: '',
  dateTo: '',
};

export const useAdminStore = create<AdminState>((set) => ({
  filters: { ...defaultFilters },

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        ...(key !== 'page' ? { page: 1 } : {}),
      },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
