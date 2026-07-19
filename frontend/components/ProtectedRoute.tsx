import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

interface Props {
  children: React.ReactNode;
  authPath?: string;
}

const ProtectedRoute = ({ children, authPath = "/auth" }: Props) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "not-logged-in">("loading");

  useEffect(() => {
    authService
      .getCurrentUser(true)
      .then(() => {
        setStatus("authorized");
      })
      .catch(() => {
        setStatus("not-logged-in");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "not-logged-in") {
    return <Navigate to={authPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
