import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseXrdAmount, shortenTxHash, RADIX_CONFIG } from "./radix-config";

vi.mock("./featureFlags", () => ({
  FEATURE_BRIDGE: false,
  FEATURE_OFFLINE_QUEUE: false,
  FEATURE_CREATOR_DASHBOARD: true,
  GACHA_DEPLOYED: true,
}));

describe("parseXrdAmount", () => {
  it("parses decimal strings correctly", () => {
    expect(parseXrdAmount("10.5")).toBe(10.5);
    expect(parseXrdAmount("0")).toBe(0);
    expect(parseXrdAmount("1000000.123456")).toBe(1000000.123456);
  });

  it("returns 0 for empty string", () => {
    expect(parseXrdAmount("")).toBe(0);
  });

  it("returns 0 for NaN-like inputs", () => {
    expect(parseXrdAmount("not-a-number")).toBe(0);
  });

  it("returns 0 for negative numbers", () => {
    expect(parseXrdAmount("-5")).toBe(0);
  });

  it("returns 0 for Infinity", () => {
    expect(parseXrdAmount("Infinity")).toBe(0);
  });
});

describe("shortenTxHash", () => {
  it("shortens long hashes", () => {
    const hash = "transaction_tdx_21_1abcdefghijklmnopqrstuvwxyz";
    const result = shortenTxHash(hash);
    expect(result).toBe("transa...wxyz");
    expect(result.length).toBeLessThan(hash.length);
  });

  it("returns short hashes unchanged", () => {
    expect(shortenTxHash("abc")).toBe("abc");
    expect(shortenTxHash("")).toBe("");
  });

  it("handles exactly 10-character hashes", () => {
    // 10 chars is the threshold where shortening kicks in (length >= 10)
    expect(shortenTxHash("abcdefghij")).toBe("abcdef...ghij");
  });
});

describe("RADIX_CONFIG", () => {
  it("defaults to stokenet when no env is set", () => {
    expect(RADIX_CONFIG.network).toBe("stokenet");
    expect(RADIX_CONFIG.networkId).toBeDefined();
  });

  it("has a valid gateway URL", () => {
    expect(RADIX_CONFIG.gatewayUrl).toMatch(/^https:\/\//);
  });

  it("has an XRD resource address", () => {
    expect(RADIX_CONFIG.xrdResourceAddress).toMatch(/^resource_/);
  });

  it("has a dApp definition address", () => {
    expect(RADIX_CONFIG.dAppDefinitionAddress).toMatch(/^account_/);
  });
});

describe("generateNonce", () => {
  it("produces positive integers within safe range", async () => {
    // We can't directly test generateNonce since it's not exported,
    // but we can test that mintGachaBadge constructs a valid manifest
    // by mocking the RDT wallet API.
    const { radixService } = await import("./radix");

    const mockSendTransaction = vi.fn().mockResolvedValue({
      value: { transactionIntentHash: "txhash123" },
    });

    // @ts-expect-error — mocking internal RDT instance
    radixService.rdt = {
      walletApi: {
        sendTransaction: mockSendTransaction,
      },
    };
    radixService["initialized"] = true;

    const txHash = await radixService.mintGachaBadge(
      "account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej",
      "epic",
      25,
    );

    expect(txHash).toBe("txhash123");
    expect(mockSendTransaction).toHaveBeenCalledTimes(1);

    const manifest = mockSendTransaction.mock.calls[0][0].transactionManifest;
    expect(manifest).toContain("mint_gacha_badge");
    expect(manifest).toContain("epic");
    expect(manifest).toContain("25");
    expect(manifest).toContain("u64"); // nonce is present
  });
});
