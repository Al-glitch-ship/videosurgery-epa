import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { queryClient } from "@/lib/query-client";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (data) {
      setUser(data as User);
    }
  }, [data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      window.location.href = "/";
    },
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
