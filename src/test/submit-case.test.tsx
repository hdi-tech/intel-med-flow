import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks (hoisted) ---

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/contexts/AuthContext")>(
    "@/contexts/AuthContext"
  );
  return {
    ...actual,
    useAuth: vi.fn().mockReturnValue({
      user: {
        id: "user-1",
        email: "test@clinic.com",
        user_metadata: { full_name: "Dr. Test" },
      },
      session: {},
      roles: ["client"],
      loading: false,
      signOut: vi.fn(),
      refreshRoles: vi.fn(),
      isAdmin: false,
      isSuperAdmin: false,
      isAccountManager: false,
      isDesigner: false,
      isClient: true,
      primaryRole: "client" as const,
    }),
  };
});

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dashboard-layout" }, children),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/lib/emailHelpers", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  ADMIN_EMAIL: "info@hdi-tech.com",
}));

// Mock supabase with per-table responses
vi.mock("@/integrations/supabase/client", () => {
  function makeChain(data: unknown = [], error: unknown = null) {
    const result = { data, error };
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      neq: () => chain,
      maybeSingle: () =>
        Promise.resolve({
          data: Array.isArray(data) ? (data[0] ?? null) : data,
          error,
        }),
      single: () =>
        Promise.resolve({
          data: Array.isArray(data) ? (data[0] ?? null) : data,
          error,
        }),
      insert: () => Promise.resolve(result),
      update: () => chain,
      then: (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) =>
        Promise.resolve(result).then(r, j),
      catch: (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn),
      finally: (fn: () => void) => Promise.resolve(result).finally(fn),
    };
    return chain;
  }

  const MOCK_CATEGORIES = [{ id: "cat-sg", name: "Surgical Guide" }];
  const MOCK_SERVICES = [
    {
      id: "svc-sg01",
      code: "SG01",
      name: "Surgical Guide Basic",
      price_usd: 150,
      category_id: "cat-sg",
      is_custom_quote: false,
      price_type: "fixed",
      price_min_usd: null,
      price_max_usd: null,
    },
  ];

  return {
    supabase: {
      auth: {},
      from: vi.fn((table: string) => {
        if (table === "categories") return makeChain(MOCK_CATEGORIES);
        if (table === "services") return makeChain(MOCK_SERVICES);
        if (table === "free_trials") return makeChain([]);
        if (table === "cases") return makeChain(null);
        if (table === "case_files") return makeChain(null);
        return makeChain([]);
      }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
        })),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

// --- Import component ---
import SubmitCase from "@/pages/SubmitCase";

// --- Helpers ---

function renderSubmitCase() {
  return render(
    <MemoryRouter>
      <SubmitCase />
    </MemoryRouter>
  );
}

/** Wait for the Surgical Guide category to appear in the category dropdown. */
async function waitForDataLoaded() {
  await waitFor(() => {
    const options = screen.queryAllByRole("option");
    expect(options.some((o) => o.textContent?.includes("Surgical Guide"))).toBe(true);
  });
}

/** Navigate from step 0 to step 1 by selecting a service and clicking Continue. */
async function goToStep1() {
  await waitForDataLoaded();
  // Select category
  const categorySelect = screen.getAllByRole("combobox")[0];
  fireEvent.change(categorySelect, { target: { value: "cat-sg" } });
  // Wait for service dropdown to appear
  await waitFor(() => expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1));
  // Select service
  const serviceSelect = screen.getAllByRole("combobox")[1];
  fireEvent.change(serviceSelect, { target: { value: "svc-sg01" } });
  // Click Continue
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  await waitFor(() => expect(screen.getByText("Case Details")).toBeInTheDocument());
}

/** Navigate to step 2 (Upload Files) from step 1. */
async function goToStep2() {
  await goToStep1();
  fireEvent.change(screen.getByPlaceholderText(/PT-2024-001/i), {
    target: { value: "PT-001" },
  });
  fireEvent.change(
    screen.getByPlaceholderText(/describe the case requirements/i),
    { target: { value: "Clinical notes for the case." } }
  );
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  await waitFor(() => expect(screen.getByText("Upload Files")).toBeInTheDocument());
}

/** Add a mock file via the hidden file input, returning the file. */
function addMockFile(container: HTMLElement) {
  const fileInput = container.querySelector("#file-input") as HTMLInputElement;
  const mockFile = new File(["scan data"], "scan.stl", {
    type: "application/octet-stream",
  });
  const fakeFileList = {
    0: mockFile,
    length: 1,
    item: (i: number) => (i === 0 ? mockFile : null),
    [Symbol.iterator]: function* () {
      yield mockFile;
    },
  };
  Object.defineProperty(fileInput, "files", {
    value: fakeFileList,
    configurable: true,
  });
  fireEvent.change(fileInput);
  return mockFile;
}

/** Navigate from step 0 to step 4 (Review) via the default (no consultation) path. */
async function goToStep4() {
  const utils = renderSubmitCase();
  await goToStep2();
  addMockFile(utils.container);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled()
  );
  // Continue on step 2 → skips step 3 (consultation) → lands on step 4
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  await waitFor(() => expect(screen.getByText(/review & confirm/i)).toBeInTheDocument());
  return utils;
}

// ====================================================================
// TESTS
// ====================================================================

describe("SubmitCase — Step 0: Select Service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the Select Service heading on mount", async () => {
    renderSubmitCase();
    expect(screen.getByText("Select Service")).toBeInTheDocument();
  });

  it("renders the progress stepper with 5 steps", async () => {
    renderSubmitCase();
    // Steps: Service, Details, Files, Consultation, Review
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("Continue button is disabled when no service is selected", async () => {
    renderSubmitCase();
    await waitForDataLoaded();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Back button is absent on step 0", async () => {
    renderSubmitCase();
    await waitForDataLoaded();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("loads and displays the Surgical Guide category from supabase", async () => {
    renderSubmitCase();
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Surgical Guide" })
      ).toBeInTheDocument()
    );
  });

  it("shows service dropdown after selecting a category", async () => {
    renderSubmitCase();
    await waitForDataLoaded();
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "cat-sg" },
    });
    await waitFor(() => expect(screen.getAllByRole("combobox").length).toBe(2));
  });

  it("Continue becomes enabled after selecting a service", async () => {
    renderSubmitCase();
    await waitForDataLoaded();
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "cat-sg" },
    });
    await waitFor(() => expect(screen.getAllByRole("combobox").length).toBe(2));
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "svc-sg01" },
    });
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });
});

describe("SubmitCase — Step 1: Case Details", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders Case Details heading", async () => {
    renderSubmitCase();
    await goToStep1();
    expect(screen.getByText("Case Details")).toBeInTheDocument();
  });

  it("renders Patient Reference Code input", async () => {
    renderSubmitCase();
    await goToStep1();
    expect(screen.getByPlaceholderText(/PT-2024-001/i)).toBeInTheDocument();
  });

  it("renders Clinical Notes textarea", async () => {
    renderSubmitCase();
    await goToStep1();
    expect(
      screen.getByPlaceholderText(/describe the case requirements/i)
    ).toBeInTheDocument();
  });

  it("renders Standard and Rush delivery radio buttons", async () => {
    renderSubmitCase();
    await goToStep1();
    expect(screen.getByText(/standard — 48 hours/i)).toBeInTheDocument();
    expect(screen.getByText(/rush — 24 hours/i)).toBeInTheDocument();
  });

  it("renders Request Consultation checkbox", async () => {
    renderSubmitCase();
    await goToStep1();
    expect(screen.getByText("Request Consultation")).toBeInTheDocument();
  });

  it("Continue is disabled when patient ref is empty", async () => {
    renderSubmitCase();
    await goToStep1();
    // Only fill clinical notes, leave patient ref empty
    fireEvent.change(
      screen.getByPlaceholderText(/describe the case requirements/i),
      { target: { value: "Notes here" } }
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue is disabled when clinical notes is empty", async () => {
    renderSubmitCase();
    await goToStep1();
    // Only fill patient ref, leave notes empty
    fireEvent.change(screen.getByPlaceholderText(/PT-2024-001/i), {
      target: { value: "PT-001" },
    });
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue enables when both patient ref and notes are filled", async () => {
    renderSubmitCase();
    await goToStep1();
    fireEvent.change(screen.getByPlaceholderText(/PT-2024-001/i), {
      target: { value: "PT-001" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/describe the case requirements/i),
      { target: { value: "Notes here" } }
    );
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("Back button is visible on step 1 and returns to step 0", async () => {
    renderSubmitCase();
    await goToStep1();
    const backBtn = screen.getByRole("button", { name: /back/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    await waitFor(() => expect(screen.getByText("Select Service")).toBeInTheDocument());
  });

  it("clicking Rush delivery radio changes delivery type", async () => {
    renderSubmitCase();
    await goToStep1();
    const rushRadio = screen.getByDisplayValue("rush");
    fireEvent.click(rushRadio);
    expect(rushRadio).toBeChecked();
  });

  it("checking Request Consultation toggles checkbox", async () => {
    renderSubmitCase();
    await goToStep1();
    const consultationCheckbox = screen.getAllByRole("checkbox").find(
      (cb) => !cb.closest("label")?.textContent?.includes("Terms")
    )!;
    expect(consultationCheckbox).not.toBeChecked();
    fireEvent.click(consultationCheckbox);
    expect(consultationCheckbox).toBeChecked();
  });
});

describe("SubmitCase — Step 2: Upload Files", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders Upload Files heading", async () => {
    renderSubmitCase();
    await goToStep2();
    expect(screen.getByText("Upload Files")).toBeInTheDocument();
  });

  it("renders drag-and-drop zone with upload prompt", async () => {
    renderSubmitCase();
    await goToStep2();
    expect(screen.getByText("Drag and drop files here")).toBeInTheDocument();
  });

  it("renders file type hint", async () => {
    renderSubmitCase();
    await goToStep2();
    expect(screen.getByText(/STL, DCM, DICOM/i)).toBeInTheDocument();
  });

  it("Continue is disabled before a file is added", async () => {
    renderSubmitCase();
    await goToStep2();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue enables after a file is added via the file input", async () => {
    const { container } = renderSubmitCase();
    await goToStep2();
    addMockFile(container);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled()
    );
  });

  it("added file name appears in the file list", async () => {
    const { container } = renderSubmitCase();
    await goToStep2();
    addMockFile(container);
    await waitFor(() =>
      expect(screen.getByText("scan.stl")).toBeInTheDocument()
    );
  });

  it("remove (×) button removes the file from the list", async () => {
    const { container } = renderSubmitCase();
    await goToStep2();
    addMockFile(container);
    await waitFor(() => expect(screen.getByText("scan.stl")).toBeInTheDocument());
    // The remove button is the only button in the file row
    const fileRow = screen.getByText("scan.stl").closest("div[class*='flex']")!;
    const removeBtn = within(fileRow.parentElement!).getByRole("button");
    fireEvent.click(removeBtn);
    await waitFor(() =>
      expect(screen.queryByText("scan.stl")).not.toBeInTheDocument()
    );
  });

  it("Back button returns to step 1", async () => {
    renderSubmitCase();
    await goToStep2();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => expect(screen.getByText("Case Details")).toBeInTheDocument());
  });

  it("shows required file list for SG01", async () => {
    renderSubmitCase();
    await goToStep2();
    expect(screen.getByText("Upper STL")).toBeInTheDocument();
    expect(screen.getByText("Lower STL")).toBeInTheDocument();
  });

  it("skips Step 3 (Consultation) when consultation not requested and goes to Step 4", async () => {
    const { container } = renderSubmitCase();
    await goToStep2();
    addMockFile(container);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    // Should land on step 4 (Review), NOT step 3 (Consultation)
    await waitFor(() =>
      expect(screen.getByText(/review & confirm/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(/you requested a consultation/i)).not.toBeInTheDocument();
  });
});

describe("SubmitCase — Step 3: Consultation (when requested)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows consultation info message when consultation was requested", async () => {
    renderSubmitCase();
    await goToStep1();
    // Check the consultation checkbox
    const consultationCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(consultationCheckbox);
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/PT-2024-001/i), {
      target: { value: "PT-001" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/describe the case requirements/i),
      { target: { value: "Notes." } }
    );
    // Continue → step 2
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => expect(screen.getByText("Upload Files")).toBeInTheDocument());

    // Add file
    const { container } = renderSubmitCase();
    // We need to add the file to this existing DOM — use document.getElementById
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) {
      const mockFile = new File(["x"], "scan.stl");
      Object.defineProperty(fileInput, "files", {
        value: { 0: mockFile, length: 1, item: () => mockFile, [Symbol.iterator]: function* () { yield mockFile; } },
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
    void container; // suppress unused var warning
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    // Should be on step 3 (consultation info)
    await waitFor(() =>
      expect(
        screen.getByText(/assigned specialist will contact you/i)
      ).toBeInTheDocument()
    );
  });
});

describe("SubmitCase — Step 4: Review & Submit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders Review & Confirm heading", async () => {
    await goToStep4();
    expect(screen.getByText(/review & confirm/i)).toBeInTheDocument();
  });

  it("shows selected service in the summary", async () => {
    await goToStep4();
    expect(screen.getByText(/SG01/)).toBeInTheDocument();
  });

  it("shows patient reference in the summary", async () => {
    await goToStep4();
    expect(screen.getByText("PT-001")).toBeInTheDocument();
  });

  it("shows file count in the summary", async () => {
    await goToStep4();
    expect(screen.getByText("1 file(s)")).toBeInTheDocument();
  });

  it("shows price in the summary for fixed-price service", async () => {
    await goToStep4();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });

  it("shows payment-after-approval notice", async () => {
    await goToStep4();
    expect(
      screen.getByText(/payment is collected only after you approve/i)
    ).toBeInTheDocument();
  });

  it("renders Submit Case button", async () => {
    await goToStep4();
    expect(screen.getByRole("button", { name: /submit case/i })).toBeInTheDocument();
  });

  it("Submit Case button is enabled by default", async () => {
    await goToStep4();
    expect(screen.getByRole("button", { name: /submit case/i })).not.toBeDisabled();
  });

  it("Back button on step 4 goes back to step 2 (skipping consultation)", async () => {
    await goToStep4();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => expect(screen.getByText("Upload Files")).toBeInTheDocument());
  });

  it("clicking Submit Case calls supabase cases.insert", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await goToStep4();
    fireEvent.click(screen.getByRole("button", { name: /submit case/i }));
    await waitFor(() =>
      expect(supabase.from).toHaveBeenCalledWith("cases")
    );
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>);
    const casesChain = fromMock.mock.results.find(
      (_: unknown, i: number) => fromMock.mock.calls[i]?.[0] === "cases"
    )?.value;
    expect(casesChain?.insert).toHaveBeenCalled();
  });

  it("shows 'Submitting...' and disables button while submitting", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    // Make the insert hang
    const hangingPromise = new Promise(() => {});
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "cases") {
        return {
          select: () => ({}),
          eq: () => ({}),
          insert: () => hangingPromise,
          then: (r: (v: unknown) => unknown) => hangingPromise.then(r),
          catch: (fn: (e: unknown) => unknown) => hangingPromise.catch(fn),
          finally: (fn: () => void) => hangingPromise.finally(fn),
        };
      }
      // Other tables use normal chain
      function makeChain(data: unknown = [], error: unknown = null) {
        const result = { data, error };
        const chain: Record<string, unknown> = {
          select: () => chain, eq: () => chain, order: () => chain,
          insert: () => Promise.resolve(result),
          update: () => chain,
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) => Promise.resolve(result).then(r, j),
          catch: (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn),
          finally: (fn: () => void) => Promise.resolve(result).finally(fn),
        };
        return chain;
      }
      return makeChain([]);
    });

    await goToStep4();
    fireEvent.click(screen.getByRole("button", { name: /submit case/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
    );
  });

  it("navigates to the new case detail page after successful submission", async () => {
    await goToStep4();
    fireEvent.click(screen.getByRole("button", { name: /submit case/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    const navigatedTo = mockNavigate.mock.calls[0][0] as string;
    expect(navigatedTo).toMatch(/^\/dashboard\/cases\//);
  });
});
