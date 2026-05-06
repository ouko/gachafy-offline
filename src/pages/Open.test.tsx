import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Open from "./Open";

// ---------------------------------------------------------------------------
// Mutable mock state so individual tests can vary wallet / offline conditions
// ---------------------------------------------------------------------------

const walletState = {
  address: "account_tdx_2_1234567890abcdef",
  balance: 100,
  pendingDelta: 0,
  isConnected: true,
  isLoading: false,
  pendingTx: "",
  setPendingDelta: vi.fn(),
  clearPendingDelta: vi.fn(),
  setPendingTx: vi.fn(),
  connectWallet: vi.fn(),
};

const offlineState = {
  isOnline: true,
  queuedRequests: [],
  queueMintRequest: vi.fn(),
  processOfflineQueue: vi.fn(),
  clearQueue: vi.fn(),
};

const streakState = {
  streak: 0,
  isTodayDone: false,
  streakMultiplier: 1,
  markTodayComplete: vi.fn(),
};

const mockNavigate = vi.fn();
const mockMintGachaBadge = vi.fn();

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/radix-lazy", () => ({
  getRadixService: async () => ({
    mintGachaBadge: (...args: unknown[]) => mockMintGachaBadge(...args),
    getTransactionStatus: vi.fn(),
  }),
}));

vi.mock("@/lib/radix-config", () => ({
  shortenTxHash: (hash: string) => hash,
  getTxExplorerUrl: (hash: string) => `https://example.com/tx/${hash}`,
}));

vi.mock("@/lib/featureFlags", async () => {
  const actual = await vi.importActual<typeof import("@/lib/featureFlags")>("@/lib/featureFlags");
  return {
    ...actual,
    GACHA_DEPLOYED: true,
    FEATURE_BRIDGE: false,
  };
});

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => walletState,
}));

vi.mock("@/hooks/useOffline", () => ({
  useOffline: () => offlineState,
}));

vi.mock("@/hooks/useStreak", () => ({
  useStreak: () => streakState,
}));

vi.mock("@/hooks/useBooster", () => ({
  useBooster: () => ({
    isActive: false,
    cost: 5,
    description: "+5 XRD boost",
    toggleBooster: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({
    settings: { enabled: false, volume: 0.7 },
    playOpenCapsule: vi.fn(),
    playButtonClick: vi.fn(),
    playButtonHover: vi.fn(),
    playError: vi.fn(),
    playSuccess: vi.fn(),
    toggleAudio: vi.fn(),
    setVolume: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

vi.mock("@/components/AudioControls", () => ({
  default: () => null,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Open page — integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMintGachaBadge.mockResolvedValue("txhash_abc123");

    // Reset mutable state to defaults
    walletState.address = "account_tdx_2_1234567890abcdef";
    walletState.balance = 100;
    walletState.pendingDelta = 0;
    walletState.isConnected = true;
    walletState.isLoading = false;
    walletState.pendingTx = "";
    offlineState.isOnline = true;
    offlineState.queuedRequests = [];
    streakState.streakMultiplier = 1;
    streakState.isTodayDone = false;
  });

  it("renders the open button with correct tier and cost", () => {
    render(<Open />);
    expect(screen.getByRole("button", { name: /Open Epic/ })).toBeInTheDocument();
  });

  it("applies optimistic balance delta and sets pending tx on successful mint", async () => {
    const user = userEvent.setup();
    render(<Open />);

    const button = screen.getByRole("button", { name: /Open Epic/ });
    await user.click(button);

    // Optimistic delta should be applied immediately
    await waitFor(() => {
      expect(walletState.setPendingDelta).toHaveBeenCalledWith(-25);
    });

    // mintGachaBadge should be called with correct args
    await waitFor(() => {
      expect(mockMintGachaBadge).toHaveBeenCalledWith(
        "account_tdx_2_1234567890abcdef",
        "epic",
        25,
      );
    });

    // After resolution, pending tx should be set
    await waitFor(() => {
      expect(walletState.setPendingTx).toHaveBeenCalledWith("txhash_abc123");
    });
  });

  it("calls markTodayComplete when mint succeeds and today is not yet done", async () => {
    const user = userEvent.setup();
    render(<Open />);

    const button = screen.getByRole("button", { name: /Open Epic/ });
    await user.click(button);

    await waitFor(() => {
      expect(streakState.markTodayComplete).toHaveBeenCalled();
    });
  });

  it("queues the request when offline", async () => {
    const user = userEvent.setup();
    offlineState.isOnline = false;

    render(<Open />);

    const button = screen.getByRole("button", { name: /Queue Epic/ });
    await user.click(button);

    await waitFor(() => {
      expect(offlineState.queueMintRequest).toHaveBeenCalledWith(
        expect.objectContaining({ id: "epic" }),
        "account_tdx_2_1234567890abcdef",
      );
    });
    expect(mockMintGachaBadge).not.toHaveBeenCalled();
  });

  it("prompts wallet connect when not connected", async () => {
    const user = userEvent.setup();
    walletState.isConnected = false;
    walletState.address = "";

    render(<Open />);

    // The connect wallet button is rendered inside OpenButton when not connected
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("shows insufficient funds when balance is below cost", () => {
    walletState.balance = 5;

    render(<Open />);
    expect(screen.getByRole("button", { name: /Need/ })).toBeDisabled();
  });
});
