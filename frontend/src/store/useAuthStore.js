import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, error: null });
  },

  updateUser: (updater) =>
    set((state) => {
      const nextUser =
        typeof updater === "function" ? updater(state.user) : updater;

      localStorage.setItem("user", JSON.stringify(nextUser));
      return { user: nextUser };
    }),

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { getMe } = await import("../features/auth/services/auth.service");
      const response = await getMe();
      if (response.success) {
        localStorage.setItem("user", JSON.stringify(response.data));
        set({ user: response.data, isAuthenticated: true });
      }
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setLoading: (isLoading) => set({ loading: isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
