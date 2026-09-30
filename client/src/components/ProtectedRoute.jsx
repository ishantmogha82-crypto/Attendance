import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AppShell from "./AppShell";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}
