import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "not-logged-in">("loading");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`, {
        withCredentials: true,
      })
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
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;