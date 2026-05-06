import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, getRoleHomePath } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  requiredRole?: "admin" | "super_admin" | "designer" | "account_manager";
  children?: React.ReactNode;
}

const ProtectedRoute = ({ requiredRole, children }: ProtectedRouteProps) => {
  const { user, roles, loading, isAdmin, isSuperAdmin, isAccountManager, isDesigner } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-hdi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    let hasAccess = false;

    switch (requiredRole) {
      case "admin":
        // admin routes: super_admin, admin, and account_manager can access
        hasAccess = isAdmin || isSuperAdmin || isAccountManager;
        break;
      case "super_admin":
        hasAccess = isSuperAdmin;
        break;
      case "designer":
        hasAccess = isDesigner;
        break;
      case "account_manager":
        hasAccess = isAccountManager;
        break;
    }

    if (!hasAccess) {
      return <Navigate to={getRoleHomePath(roles)} replace />;
    }
  }

  // Prevent cross-role access at route level
  const path = location.pathname;
  if (path.startsWith("/admin") && !isAdmin && !isSuperAdmin && !isAccountManager) {
    return <Navigate to={getRoleHomePath(roles)} replace />;
  }
  if (path.startsWith("/designer") && !isDesigner) {
    return <Navigate to={getRoleHomePath(roles)} replace />;
  }
  if (path.startsWith("/account-manager") && !isAccountManager && !isAdmin && !isSuperAdmin) {
    return <Navigate to={getRoleHomePath(roles)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
