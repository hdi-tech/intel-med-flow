import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks (hoisted) ---

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { resetPasswordForEmail: vi.fn() },
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
import ForgotPassword from "@/pages/ForgotPassword";

function renderForgotPassword() {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe("ForgotPassword page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders page heading", () => {
    renderForgotPassword();
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
  });

  it("renders email input", () => {
    renderForgotPassword();
    expect(screen.getByPlaceholderText("jane@clinic.com")).toBeInTheDocument();
  });

  it("renders Send reset link button", () => {
    renderForgotPassword();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("renders Back to sign in link", () => {
    renderForgotPassword();
    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
  });

  // --- Validation ---

  it("shows error toast when submitting with empty email", async () => {
    renderForgotPassword();
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Please enter your email address")
    );
  });

  it("does not call resetPasswordForEmail when email is empty", async () => {
    renderForgotPassword();
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  // --- Submit behaviour ---

  it("calls resetPasswordForEmail with the entered email", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@clinic.com",
        expect.any(Object)
      )
    );
  });

  it("shows 'Sending...' and disables button while loading", async () => {
    let resolveReset!: (v: unknown) => void;
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((r) => { resolveReset = r; })
    );
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    );
    resolveReset({ error: null });
  });

  // --- Success state ---

  it("shows success confirmation after email is sent", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText(/we've sent a reset link/i)).toBeInTheDocument()
    );
  });

  it("shows the entered email address in the success message", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "doctor@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText("doctor@clinic.com")).toBeInTheDocument()
    );
  });

  it("hides the form and shows Back to sign in link after success", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "user@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /send reset/i })).not.toBeInTheDocument());
    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
  });

  // --- Error from supabase ---

  it("shows error toast when supabase returns an error", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { message: "User not found" },
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "nobody@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("User not found")
    );
  });

  it("keeps the form visible when supabase returns an error", async () => {
    (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { message: "error" },
    });
    renderForgotPassword();
    fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
      target: { value: "nobody@clinic.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });
});
