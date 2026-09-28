"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "./api-client";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
  department_id?: string;
  phone?: string;
  is_active: boolean;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (tokenData: { access_token: string; refresh_token: string; user: User }) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get("/api/v1/auth/me");
        setUser(res.data);
      } catch (err) {
        localStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (tokenData: { access_token: string; refresh_token: string; user?: User }) => {
    localStorage.setItem("access_token", tokenData.access_token);
    localStorage.setItem("refresh_token", tokenData.refresh_token);
    if (tokenData.user) {
      setUser(tokenData.user);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        router.push("/");
      }
    } else {
      try {
        const res = await apiClient.get("/api/v1/auth/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user profile on login", err);
      } finally {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        } else {
          router.push("/");
        }
      }
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.push("/login");
    }
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role_code === "SUPER_ADMIN") return true;
    return user.permissions?.includes(perm) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
