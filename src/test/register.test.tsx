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
    auth: { signUp: vi.fn() },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
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
import Register from "@/pages/Register";

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

// Fill the minimum fields needed to pass validation
function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText("Dr. Jane Smith"), {
    target: { value: "Dr. Test" },
  });
  fireEvent.change(screen.getByPlaceholderText("jane@clinic.com"), {
    target: { value: "test@clinic.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Phone number"), {
    target: { value: "501234567" },
  });

  // Password fields
  const [pwdInput, confirmInput] = screen.getAllByPlaceholderText(/characters|password/i);
  fireEvent.change(pwdInput, { target: { value: "password123" } });
  fireEvent.change(confirmInput, { target: { value: "password123" } });

  fireEvent.change(screen.getByPlaceholderText("Smile Dental Clinic"), {
    target: { value: "Test Clinic" },
  });

  // Country — focus to open dropdown, then pick first item
  const countryInput = screen.getByPlaceholderText("Search country...");
  fireEvent.focus(countryInput);
  const countryOptions = screen.getAllByRole("button");
  // country buttons appear inside the dropdown
  const countryBtn = countryOptions.find((b) => b.textContent === "Afghanistan");
  if (countryBtn) fireEvent.mouseDown(countryBtn);

  // Specialty select
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Orthodontist" } });

  // Terms checkbox
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders Full name field", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Dr. Jane Smith")).toBeInTheDocument();
  });

  it("renders Email address field", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("jane@clinic.com")).toBeInTheDocument();
  });

  it("renders Phone number field", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Phone number")).toBeInTheDocument();
  });

  it("renders Password field as type=password", () => {
    renderRegister();
    const pwdInputs = screen.getAllByPlaceholderText(/characters|password/i);
    expect(pwdInputs[0]).toHaveAttribute("type", "password");
  });

  it("renders Confirm password field as type=password", () => {
    renderRegister();
    const pwdInputs = screen.getAllByPlaceholderText(/characters|password/i);
    expect(pwdInputs[1]).toHaveAttribute("type", "password");
  });

  it("renders Clinic / practice name field", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Smile Dental Clinic")).toBeInTheDocument();
  });

  it("renders Country search field", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Search country...")).toBeInTheDocument();
  });

  it("renders Specialty select", () => {
    renderRegister();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders Terms & Conditions checkbox", () => {
    renderRegister();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders Create account submit button", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders Sign in link", () => {
    renderRegister();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  // --- Password visibility toggles ---

  it("first eye button toggles password field to text", () => {
    renderRegister();
    const pwdInputs = screen.getAllByPlaceholderText(/characters|password/i);
    // Eye buttons come before submit; indices 0 and 1 are password eye buttons
    const eyeButtons = screen.getAllByRole("button").filter(
      (btn) => !btn.textContent?.toLowerCase().includes("create")
    );
    fireEvent.click(eyeButtons[0]);
    expect(pwdInputs[0]).toHaveAttribute("type", "text");
  });

  it("second eye button toggles confirm-password field to text", () => {
    renderRegister();
    const pwdInputs = screen.getAllByPlaceholderText(/characters|password/i);
    const eyeButtons = screen.getAllByRole("button").filter(
      (btn) => !btn.textContent?.toLowerCase().includes("create")
    );
    fireEvent.click(eyeButtons[1]);
    expect(pwdInputs[1]).toHaveAttribute("type", "text");
  });

  // --- Country dropdown ---

  it("opens country dropdown on focus and shows country options", () => {
    renderRegister();
    fireEvent.focus(screen.getByPlaceholderText("Search country..."));
    expect(screen.getByText("Afghanistan")).toBeInTheDocument();
  });

  it("filters country list when typing", () => {
    renderRegister();
    const countryInput = screen.getByPlaceholderText("Search country...");
    fireEvent.focus(countryInput);
    fireEvent.change(countryInput, { target: { value: "Egypt" } });
    expect(screen.getByText("Egypt")).toBeInTheDocument();
    expect(screen.queryByText("Afghanistan")).not.toBeInTheDocument();
  });

  it("selecting a country closes dropdown and sets value", () => {
    renderRegister();
    const countryInput = screen.getByPlaceholderText("Search country...");
    fireEvent.focus(countryInput);
    const egyptBtn = screen.getByText("Egypt");
    fireEvent.mouseDown(egyptBtn);
    expect(screen.queryByText("Afghanistan")).not.toBeInTheDocument();
    expect(countryInput).toHaveValue("Egypt");
  });

  // --- Validation ---

  it("shows error if Terms checkbox not checked", async () => {
    renderRegister();
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Please agree to the Terms & Conditions")
    );
  });

  it("shows error if password shorter than 8 characters", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("checkbox"));
    const [pwdInput] = screen.getAllByPlaceholderText(/characters|password/i);
    fireEvent.change(pwdInput, { target: { value: "short" } });
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters")
    );
  });

  it("shows error if passwords do not match", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("checkbox"));
    const [pwdInput, confirmInput] = screen.getAllByPlaceholderText(/characters|password/i);
    fireEvent.change(pwdInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "different99" } });
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Passwords do not match")
    );
  });

  it("shows error if required fields are missing", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("checkbox"));
    const [pwdInput, confirmInput] = screen.getAllByPlaceholderText(/characters|password/i);
    fireEvent.change(pwdInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "password123" } });
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields")
    );
  });

  // --- Successful registration ---

  it("navigates to /verify-email after successful registration", async () => {
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    renderRegister();
    fillValidForm();
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/verify-email",
        expect.objectContaining({ state: { email: "test@clinic.com" } })
      )
    );
  });

  it("shows error toast if supabase signUp returns an error", async () => {
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });
    renderRegister();
    fillValidForm();
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("User already registered")
    );
  });

  it("shows 'Creating account...' and disables button while loading", async () => {
    let resolveSignUp!: (v: unknown) => void;
    (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((r) => { resolveSignUp = r; })
    );
    renderRegister();
    fillValidForm();
    fireEvent.submit(screen.getByPlaceholderText("Dr. Jane Smith").closest("form")!);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled()
    );
    resolveSignUp({ data: null, error: { message: "err" } });
  });
});
