import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  permissions: string[] | null; // null = all access (administrator)
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  hasAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "clinic_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasAccess = (page: string): boolean => {
    if (!user) return false;
    // Administrator and manager always have full access
    if (user.role === "administrator" || user.role === "manager") return true;
    // null permissions = full access
    if (!user.permissions) return true;
    return user.permissions.includes(page);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
