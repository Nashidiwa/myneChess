import { create } from 'zustand';
import { UserProfile } from '@online-chess/shared';
import { disconnectSocket } from '../services/socket';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  logout: () => void;
}

const STORAGE_KEY_TOKEN = 'online_chess_token';
const STORAGE_KEY_USER = 'online_chess_user';

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from sessionStorage or localStorage
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TOKEN) : null;
  const savedUserJson = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER) : null;
  let savedUser: UserProfile | null = null;
  if (savedUserJson) {
    try {
      savedUser = JSON.parse(savedUserJson);
    } catch {
      savedUser = null;
    }
  }

  return {
    user: savedUser,
    token: savedToken,
    isAuthenticated: !!savedToken && !!savedUser,

    setAuth: (user, token) => {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    updateUser: (userData) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...userData };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        return { user: updated };
      });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      disconnectSocket();
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
