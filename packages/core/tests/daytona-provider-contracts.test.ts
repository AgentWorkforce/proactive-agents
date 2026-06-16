import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  relayfileProviderEventPaths,
  resolveRelayfileProviderContract,
} from "../src/relayfile/provider-contracts.js";

describe("relayfile provider contracts", () => {
  it("registers Daytona as a trigger-only provider contract", () => {
    const contract = resolveRelayfileProviderContract("daytona");
    assert.notEqual(contract, null);
    assert.equal(contract?.id, "daytona");
    assert.equal(contract?.root, "/daytona");
    assert.deepStrictEqual(contract?.resources, []);
    assert.deepStrictEqual(contract?.triggerEvents, [
      "sandbox.created",
      "sandbox.state.updated",
      "snapshot.created",
      "snapshot.state.updated",
      "snapshot.removed",
      "volume.created",
      "volume.state.updated",
      "incident",
    ]);
  });

  it("maps Daytona trigger events to the provider root", () => {
    assert.deepStrictEqual(
      relayfileProviderEventPaths({
        provider: "daytona",
        eventType: "incident",
      }),
      ["/daytona/**"],
    );
  });
});
