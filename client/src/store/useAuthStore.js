import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => set({
        user: userData,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
      }),

      setUser: (userData) => set({
        user: userData,
        isAuthenticated: !!userData,
      }),
    }),
    {
      name: 'auth-storage', // clé dans localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
