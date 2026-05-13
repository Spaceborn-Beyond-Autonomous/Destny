import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

interface Props {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: Props) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "not-admin" | "not-logged-in">("loading");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`, {
        withCredentials: true,
      })
      .then((res) => {
        const user = res.data?.data;
        if (user?.admin === true) {
          setStatus("authorized");
        } else {
          setStatus("not-admin");
        }
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

  if (status === "not-admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground text-lg mb-6">Only admin accounts can access the dashboard.</p>
        <a href="/" className="text-primary hover:underline font-medium">← Back to Home</a>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
