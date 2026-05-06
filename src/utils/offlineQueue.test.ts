import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { offlineQueueDB, type MintRequest } from "./offlineQueue";

describe("OfflineQueueDB", () => {
  beforeEach(async () => {
    await offlineQueueDB.clearAllRequests();
  });

  afterEach(async () => {
    await offlineQueueDB.clearAllRequests();
  });

  it("adds and retrieves mint requests", async () => {
    const request: MintRequest = {
      id: "test-1",
      tier: { id: "common", name: "Common", price: 8, rarity: "common" },
      timestamp: Date.now(),
      nonce: 1,
      userId: "user-123",
    };

    await offlineQueueDB.addMintRequest(request);
    const requests = await offlineQueueDB.getAllMintRequests();

    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe("test-1");
    expect(requests[0].tier.name).toBe("Common");
  });

  it("removes a request by id", async () => {
    const request: MintRequest = {
      id: "test-2",
      tier: { id: "rare", name: "Rare", price: 15, rarity: "rare" },
      timestamp: Date.now(),
      nonce: 2,
    };

    await offlineQueueDB.addMintRequest(request);
    await offlineQueueDB.removeMintRequest("test-2");
    const requests = await offlineQueueDB.getAllMintRequests();

    expect(requests).toHaveLength(0);
  });

  it("returns requests sorted by timestamp", async () => {
    const req1: MintRequest = {
      id: "older",
      tier: { id: "common", name: "Common", price: 8, rarity: "common" },
      timestamp: 1000,
      nonce: 1,
    };
    const req2: MintRequest = {
      id: "newer",
      tier: { id: "epic", name: "Epic", price: 25, rarity: "epic" },
      timestamp: 2000,
      nonce: 2,
    };

    await offlineQueueDB.addMintRequest(req2);
    await offlineQueueDB.addMintRequest(req1);
    const requests = await offlineQueueDB.getAllMintRequests();

    expect(requests[0].id).toBe("older");
    expect(requests[1].id).toBe("newer");
  });

  it("increments nonce sequentially", async () => {
    const nonce1 = await offlineQueueDB.getNextNonce();
    expect(nonce1).toBe(1);

    const request: MintRequest = {
      id: "test",
      tier: { id: "common", name: "Common", price: 8, rarity: "common" },
      timestamp: Date.now(),
      nonce: nonce1,
    };
    await offlineQueueDB.addMintRequest(request);

    const nonce2 = await offlineQueueDB.getNextNonce();
    expect(nonce2).toBe(2);
  });

  it("clears all requests", async () => {
    const request: MintRequest = {
      id: "test-clear",
      tier: { id: "common", name: "Common", price: 8, rarity: "common" },
      timestamp: Date.now(),
      nonce: 1,
    };

    await offlineQueueDB.addMintRequest(request);
    await offlineQueueDB.clearAllRequests();
    const requests = await offlineQueueDB.getAllMintRequests();

    expect(requests).toHaveLength(0);
  });
});
