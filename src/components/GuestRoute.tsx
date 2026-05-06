import { Navigate } from "react-router-dom";
import { useAuth, getLoginRedirect } from "@/contexts/AuthContext";

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, roles, defaultRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-hdi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={getLoginRedirect(roles, defaultRole)} replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
