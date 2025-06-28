export interface AuthState {
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    isVerified: boolean;
  } | null;
  isAuthenticated: boolean;
}

class AuthManager {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
  };

  constructor() {
    // Initialize from localStorage
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('skybook_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = parsed;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      this.clearAuth();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('skybook_auth', JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  setUser(user: AuthState['user']) {
    this.state = {
      user,
      isAuthenticated: !!user && user.isVerified,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAuth() {
    this.state = {
      user: null,
      isAuthenticated: false,
    };
    localStorage.removeItem('skybook_auth');
    this.notifyListeners();
  }

  updateUser(updates: Partial<NonNullable<AuthState['user']>>) {
    if (this.state.user) {
      this.state.user = { ...this.state.user, ...updates };
      this.state.isAuthenticated = this.state.user.isVerified;
      this.saveToStorage();
      this.notifyListeners();
    }
  }
}

export const authManager = new AuthManager();

// React hook for using auth state
import { useState, useEffect } from 'react';

export function useAuth(): AuthState & {
  setUser: (user: AuthState['user']) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<NonNullable<AuthState['user']>>) => void;
} {
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    setUser: authManager.setUser.bind(authManager),
    clearAuth: authManager.clearAuth.bind(authManager),
    updateUser: authManager.updateUser.bind(authManager),
  };
}
