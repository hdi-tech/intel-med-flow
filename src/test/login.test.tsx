import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks (hoisted) ---

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signInWithPassword: vi.fn() },
    from: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/components/HdiLogo", () => ({
  default: () => React.createElement("div", { "data-testid": "hdi-logo" }),
}));

// --- Imports after mocks ---
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Login from "@/pages/Login";

// Chainable supabase query mock that can also be awaited
function makeChain(data: unknown[] = [], error: unknown = null) {
  const result = { data, error };
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(r, j),
    catch: (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn),
    finally: (fn: () => void) => Promise.resolve(result).finally(fn),
  };
  return chain;
}

function renderLogin(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/login${search}`]}>
      <Login />
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(makeChain([]));
  });

  // --- Rendering ---

  it("renders email input", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("jane@clinic.com")).toBeInTheDocument();
  });

  it("renders password input as type=password by default", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Your password")).toHaveAttribute("type", "password");
  });

  it("renders the Sign in submit button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders Forgot password link", () => {
    renderLogin();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("renders Create one (register) link", () => {
    renderLogin();
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  // --- Password visibility toggle ---

  it("shows password in plain text after clicking the eye button", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText("Your password");
    // The eye button is the only type="button" in the form
    const eyeBtn = screen.getAllByRole("button").find(
      (btn) => !btn.textContent?.toLowerCase().includes("sign")
    )!;
    fireEvent.click(eyeBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("hides password again after second eye button click", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText("Your password");
    const eyeBtn = screen.getAllByRole("button").find(
      (btn) => !btn.textContent?.toLowerCase().includes("sign")
    )!;
    fireEvent.click(eyeBtn);
    fireEvent.click(eyeBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // --- Submit button state ---

  it("submit button is enabled by default (no required HTML validation)", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
  });

  it("shows 'Signing in...' and disables button while loading", async () => {
    let resolveAuth!: (v: unknown) => void;
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((r) => { resolveAuth = r; })
    );
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled()
    );
    // Resolve to avoid act() warning
    resolveAuth({ data: null, error: { message: "err" } });
  });

  // --- Error handling ---

  it("calls toast.error with the error message on failed sign-in", async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "bad@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid login credentials")
    );
  });

  // --- Successful login ---

  it("navigates after a successful sign-in", async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it("navigates to /no-role when user has no roles", async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    // Both from() calls return empty data (no roles, no profile)
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(makeChain([]));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/no-role"));
  });

  it("navigates to /dashboard when user has only client role", async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "user_roles") return makeChain([{ role: "client" }]);
      return makeChain([]);
    });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("respects ?redirect= param after successful login", async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "user_roles") return makeChain([{ role: "client" }]);
      return makeChain([]);
    });
    renderLogin("?redirect=/dashboard/cases/submit");
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByPlaceholderText("jane@clinic.com").closest("form")!);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/cases/submit")
    );
  });
});
