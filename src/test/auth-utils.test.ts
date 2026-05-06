import { describe, it, expect, vi } from "vitest";

// Must mock supabase before AuthContext is imported (module-level createClient call)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

import { rolePath, getRoleHomePath, getLoginRedirect } from "@/contexts/AuthContext";

describe("rolePath", () => {
  it("returns /admin for admin", () => {
    expect(rolePath("admin")).toBe("/admin");
  });
  it("returns /admin for super_admin", () => {
    expect(rolePath("super_admin")).toBe("/admin");
  });
  it("returns /account-manager for account_manager", () => {
    expect(rolePath("account_manager")).toBe("/account-manager");
  });
  it("returns /designer for designer", () => {
    expect(rolePath("designer")).toBe("/designer");
  });
  it("returns /dashboard for client", () => {
    expect(rolePath("client")).toBe("/dashboard");
  });
});

describe("getRoleHomePath", () => {
  it("prioritises super_admin over all others", () => {
    expect(getRoleHomePath(["super_admin", "admin", "client"])).toBe("/admin");
  });
  it("uses admin when no super_admin", () => {
    expect(getRoleHomePath(["admin", "client"])).toBe("/admin");
  });
  it("uses account_manager when no admin", () => {
    expect(getRoleHomePath(["account_manager", "client"])).toBe("/account-manager");
  });
  it("uses designer when only role", () => {
    expect(getRoleHomePath(["designer"])).toBe("/designer");
  });
  it("falls back to /dashboard with empty roles", () => {
    expect(getRoleHomePath([])).toBe("/dashboard");
  });
  it("falls back to /dashboard for client role", () => {
    expect(getRoleHomePath(["client"])).toBe("/dashboard");
  });
});

describe("getLoginRedirect", () => {
  it("returns /no-role for 0 roles", () => {
    expect(getLoginRedirect([], null)).toBe("/no-role");
  });
  it("goes directly to /dashboard for single client role", () => {
    expect(getLoginRedirect(["client"], null)).toBe("/dashboard");
  });
  it("goes directly to /admin for single admin role", () => {
    expect(getLoginRedirect(["admin"], null)).toBe("/admin");
  });
  it("goes directly to /designer for single designer role", () => {
    expect(getLoginRedirect(["designer"], null)).toBe("/designer");
  });
  it("uses defaultRole when valid and in roles", () => {
    expect(getLoginRedirect(["client", "designer"], "designer")).toBe("/designer");
  });
  it("uses defaultRole=client when multiple roles include client", () => {
    expect(getLoginRedirect(["client", "designer"], "client")).toBe("/dashboard");
  });
  it("goes to /select-workspace with multiple roles and no defaultRole", () => {
    expect(getLoginRedirect(["client", "designer"], null)).toBe("/select-workspace");
  });
  it("ignores defaultRole if not in roles list", () => {
    expect(getLoginRedirect(["client", "designer"], "admin")).toBe("/select-workspace");
  });
});
