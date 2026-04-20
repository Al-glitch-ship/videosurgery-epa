import { createContext, useContext, useMemo } from "react";
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
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      window.location.href = "/login";
    },
  });

  const value = useMemo<AuthContextType>(
    () => ({
      user: (meQuery.data as User | null | undefined) ?? null,
      isLoading: meQuery.isLoading || logoutMutation.isPending,
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [logoutMutation, meQuery.data, meQuery.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
