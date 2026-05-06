import { describe, it, expect } from "vitest";
import {
  walletAddressSchema,
  txHashSchema,
  tierSchema,
  balanceSchema,
  nonceSchema,
  validateInput,
  safeParseNumber,
  sanitizeForLogging,
} from "./validation";

describe("walletAddressSchema", () => {
  it("accepts valid Radix account addresses", () => {
    expect(() =>
      validateInput(walletAddressSchema, "account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej")
    ).not.toThrow();
  });

  it("rejects empty strings", () => {
    expect(() => validateInput(walletAddressSchema, "")).toThrow();
  });

  it("rejects non-account strings", () => {
    expect(() => validateInput(walletAddressSchema, "resource_tdx_2_1tknxxx")).toThrow();
  });

  it("rejects overly long strings", () => {
    expect(() => validateInput(walletAddressSchema, "a".repeat(201))).toThrow();
  });
});

describe("balanceSchema", () => {
  it("accepts zero balance", () => {
    expect(validateInput(balanceSchema, 0)).toBe(0);
  });

  it("accepts normal balances", () => {
    expect(validateInput(balanceSchema, 1000)).toBe(1000);
  });

  it("accepts large but plausible balances", () => {
    expect(validateInput(balanceSchema, 1e12)).toBe(1e12);
  });

  it("rejects negative balances", () => {
    expect(() => validateInput(balanceSchema, -1)).toThrow();
  });

  it("rejects implausibly large balances", () => {
    expect(() => validateInput(balanceSchema, 1e14)).toThrow();
  });

  it("rejects NaN", () => {
    expect(() => validateInput(balanceSchema, NaN)).toThrow();
  });
});

describe("nonceSchema", () => {
  it("accepts positive integers", () => {
    expect(validateInput(nonceSchema, 42)).toBe(42);
  });

  it("accepts MAX_SAFE_INTEGER", () => {
    expect(validateInput(nonceSchema, Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects zero", () => {
    expect(() => validateInput(nonceSchema, 0)).toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => validateInput(nonceSchema, -1)).toThrow();
  });

  it("rejects floats", () => {
    expect(() => validateInput(nonceSchema, 3.14)).toThrow();
  });
});

describe("tierSchema", () => {
  it("accepts valid tier objects", () => {
    const tier = { id: "epic", name: "Epic", price: 25, rarity: "epic" };
    expect(validateInput(tierSchema, tier)).toEqual(tier);
  });

  it("rejects invalid tier IDs", () => {
    expect(() =>
      validateInput(tierSchema, { id: "legendary", name: "Legendary", price: 25, rarity: "legendary" })
    ).toThrow();
  });

  it("rejects negative prices", () => {
    expect(() =>
      validateInput(tierSchema, { id: "common", name: "Common", price: -5, rarity: "common" })
    ).toThrow();
  });

  it("rejects prices over 1000", () => {
    expect(() =>
      validateInput(tierSchema, { id: "common", name: "Common", price: 2000, rarity: "common" })
    ).toThrow();
  });
});

describe("safeParseNumber", () => {
  it("parses valid numbers", () => {
    expect(safeParseNumber("42")).toBe(42);
  });

  it("returns default for NaN", () => {
    expect(safeParseNumber("not a number")).toBe(0);
  });

  it("returns default for Infinity", () => {
    expect(safeParseNumber(Infinity)).toBe(0);
  });

  it("uses custom default", () => {
    expect(safeParseNumber("invalid", 99)).toBe(99);
  });
});

describe("sanitizeForLogging", () => {
  it("truncates long strings", () => {
    const result = sanitizeForLogging("a".repeat(100));
    expect(result).toMatch(/^a+\.\.\.a+$/);
  });

  it("masks account addresses", () => {
    const addr = "account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej";
    const result = sanitizeForLogging(addr);
    expect(result).toMatch(/^account_td\.\.\.5wej$/);
  });

  it("redacts sensitive keys", () => {
    const obj = { username: "alice", password: "secret123", token: "abc" };
    const result = sanitizeForLogging(obj);
    expect(result.password).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
    expect(result.username).toBe("alice");
  });

  it("handles arrays recursively", () => {
    const arr = [{ privateKey: "secret" }, { name: "ok" }];
    const result = sanitizeForLogging(arr);
    expect(result[0].privateKey).toBe("[REDACTED]");
    expect(result[1].name).toBe("ok");
  });
});
