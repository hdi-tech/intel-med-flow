import { Shield, Palette, User, Briefcase, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/contexts/AuthContext";
import { rolePath } from "@/contexts/AuthContext";

export interface RoleConfig {
  /** The canonical role identifier as stored in user_roles. */
  role: UserRole;
  /** Workspace label shown to the user (super_admin and admin both surface as "Admin"). */
  workspaceLabel: string;
  /** Short description shown on the workspace selector cards. */
  description: string;
  /** Lucide icon for the role. */
  icon: LucideIcon;
  /** Tailwind classes for the navbar badge: bg + text. */
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  /** Hex color used by the 4px accent bar at the very top of the page. */
  accentHex: string;
  /** Keyboard shortcut hint (digit 1–4). */
  shortcutDigit: number;
  /** Where to navigate when this role is activated. */
  path: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  super_admin: {
    role: "super_admin",
    workspaceLabel: "Admin Dashboard",
    description: "Manage all cases, users, and platform settings",
    icon: Shield,
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
    accentHex: "#3B82F6",
    shortcutDigit: 1,
    path: "/admin",
  },
  admin: {
    role: "admin",
    workspaceLabel: "Admin Dashboard",
    description: "Manage all cases, users, and platform settings",
    icon: Shield,
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
    accentHex: "#3B82F6",
    shortcutDigit: 1,
    path: "/admin",
  },
  designer: {
    role: "designer",
    workspaceLabel: "Designer Dashboard",
    description: "View and work on cases assigned to you",
    icon: Palette,
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/30",
    accentHex: "#10B981",
    shortcutDigit: 2,
    path: "/designer",
  },
  client: {
    role: "client",
    workspaceLabel: "Client Dashboard",
    description: "Track your cases, payments, and consultations",
    icon: User,
    badgeBg: "bg-slate-500/20",
    badgeText: "text-slate-300",
    badgeBorder: "border-slate-500/30",
    accentHex: "#64748B",
    shortcutDigit: 3,
    path: "/dashboard",
  },
  account_manager: {
    role: "account_manager",
    workspaceLabel: "Manager Dashboard",
    description: "Manage your assigned client accounts",
    icon: Briefcase,
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/30",
    accentHex: "#A855F7",
    shortcutDigit: 4,
    path: "/account-manager",
  },
};

/**
 * Roles to actually surface in the workspace selector / switcher.
 * super_admin and admin collapse to a single "Admin" entry — we
 * prefer super_admin if a user happens to have both.
 */
export function getSwitchableRoles(roles: UserRole[]): UserRole[] {
  const seen = new Set<string>();
  const out: UserRole[] = [];
  // Stable display order
  const order: UserRole[] = ["super_admin", "admin", "designer", "account_manager", "client"];
  for (const r of order) {
    if (!roles.includes(r)) continue;
    const key = r === "admin" || r === "super_admin" ? "admin-bucket" : r;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export function pathForRole(role: UserRole): string {
  return rolePath(role);
}

/** Returns the active role given the current pathname and the user's roles. */
export function deriveActiveRole(pathname: string, roles: UserRole[]): UserRole | null {
  if (pathname.startsWith("/admin")) {
    if (roles.includes("super_admin")) return "super_admin";
    if (roles.includes("admin")) return "admin";
    if (roles.includes("account_manager")) return "account_manager";
    return null;
  }
  if (pathname.startsWith("/designer")) {
    return roles.includes("designer") ? "designer" : null;
  }
  if (pathname.startsWith("/account-manager")) {
    return roles.includes("account_manager") ? "account_manager" : null;
  }
  if (pathname.startsWith("/dashboard")) {
    return roles.includes("client") ? "client" : null;
  }
  return null;
}
