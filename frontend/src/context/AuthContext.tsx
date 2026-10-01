"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = async (accessToken: string) => {
    try {
      const response = await api.get<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(response.data);
    } catch (error) {
      console.error("Authentication error:", error);

      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken");

    if (!accessToken) {
      setLoading(false);
      return;
    }

    const checkAuthentication = async () => {
      await getCurrentUser(accessToken);
      setLoading(false);
    };

    checkAuthentication();
  }, []);

  const login = async (accessToken: string) => {
    localStorage.setItem(
      "accessToken",
      accessToken,
    );

    await getCurrentUser(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);

    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
