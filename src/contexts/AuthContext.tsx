import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "client" | "designer" | "admin" | "super_admin" | "account_manager";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  defaultRole: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAccountManager: boolean;
  isDesigner: boolean;
  isClient: boolean;
  primaryRole: UserRole;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  defaultRole: null,
  loading: true,
  signOut: async () => {},
  refreshRoles: async () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isAccountManager: false,
  isDesigner: false,
  isClient: false,
  primaryRole: "client",
});

export const useAuth = () => useContext(AuthContext);

function getPrimaryRole(roles: UserRole[]): UserRole {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("account_manager")) return "account_manager";
  if (roles.includes("designer")) return "designer";
  return "client";
}

export function rolePath(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "account_manager":
      return "/account-manager";
    case "designer":
      return "/designer";
    default:
      return "/dashboard";
  }
}

/**
 * Old single-arg helper kept for backward compatibility.
 * For multi-role users, callers should prefer getLoginRedirect(roles, defaultRole).
 */
export function getRoleHomePath(roles: UserRole[]): string {
  return rolePath(getPrimaryRole(roles));
}

/**
 * Where to send a user after a successful sign-in.
 *  - 0 roles  → friendly "no role" page (handled at /no-role)
 *  - 1 role   → straight to that dashboard
 *  - 2+ roles → workspace selector, unless a remembered default_role is set
 */
export function getLoginRedirect(roles: UserRole[], defaultRole: UserRole | null): string {
  if (roles.length === 0) return "/no-role";
  if (roles.length === 1) return rolePath(roles[0]);
  if (defaultRole && roles.includes(defaultRole)) return rolePath(defaultRole);
  return "/select-workspace";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [defaultRole, setDefaultRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserMeta = useCallback(async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("default_role").eq("id", userId).maybeSingle(),
    ]);
    const nextRoles = (rolesRes.data || []).map((r) => r.role as UserRole);
    setRoles(nextRoles);
    const dr = (profileRes.data as { default_role?: string | null } | null)?.default_role;
    setDefaultRole(dr && nextRoles.includes(dr as UserRole) ? (dr as UserRole) : null);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) await fetchUserMeta(user.id);
  }, [user, fetchUserMeta]);

  useEffect(() => {
    let initialized = false;

    const initSession = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserMeta(session.user.id);
      } else {
        setRoles([]);
        setDefaultRole(null);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (initialized) {
          await initSession(session);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await initSession(session);
      initialized = true;
    });

    return () => subscription.unsubscribe();
  }, [fetchUserMeta]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoles([]);
    setDefaultRole(null);
    try { localStorage.removeItem("hdi.activeRole"); } catch { /* ignore */ }
  };

  const primaryRole = getPrimaryRole(roles);

  return (
    <AuthContext.Provider value={{
      session, user, roles, defaultRole, loading, signOut, refreshRoles,
      isAdmin: roles.includes("admin") || roles.includes("super_admin"),
      isSuperAdmin: roles.includes("super_admin"),
      isAccountManager: roles.includes("account_manager"),
      isDesigner: roles.includes("designer"),
      isClient: roles.includes("client"),
      primaryRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
