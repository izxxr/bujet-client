import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "../types";
import { authApi } from "./api";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, { username: string; password: string }>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, { username: string; display_name?: string; password: string }>;
};

type LoginData = { username: string; password: string };
type RegisterData = { username: string; display_name?: string; password: string };

export const AuthContext = createContext<AuthContextType | null>(null);

// Get user from localStorage
const getStoredUser = (): User | null => {
  const storedUser = localStorage.getItem("bujet_user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem("bujet_user");
    }
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Use the stored user as initial state
  const initialUser = getStoredUser();
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/auth/user"],
    queryFn: () => Promise.resolve(initialUser),
    initialData: initialUser,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: LoginData) => {
      return await authApi.signIn(username, password);
    },
    onSuccess: (userData: User) => {
      localStorage.setItem("bujet_user", JSON.stringify(userData));
      queryClient.setQueryData(["/auth/user"], userData);
      navigate("/dashboard");
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.display_name || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return await authApi.signUp(data);
    },
    onSuccess: (userData: User) => {
      localStorage.setItem("bujet_user", JSON.stringify(userData));
      queryClient.setQueryData(["/auth/user"], userData);
      navigate("/dashboard");
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.display_name || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No API call needed for logout since we're using token auth
      return Promise.resolve();
    },
    onSuccess: () => {
      localStorage.removeItem("bujet_user");
      queryClient.setQueryData(["/auth/user"], null);
      queryClient.invalidateQueries();
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
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

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
        </div>
      ) : user ? (
        <Component />
      ) : null}
    </Route>
  );
}
