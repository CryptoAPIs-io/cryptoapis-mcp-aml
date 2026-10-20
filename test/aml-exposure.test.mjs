import { test } from "node:test";
import assert from "node:assert/strict";

import { McpLogger } from "@cryptoapis-io/mcp-shared";
import { amlTool } from "../dist/tools/aml/index.js";
import { AmlToolSchema } from "../dist/tools/aml/schema.js";
import { AML_EXPOSURE_BLOCKCHAINS } from "../dist/api/exposure/types.js";
import { AML_SCREENABLE_BLOCKCHAINS } from "../dist/api/transactions/screen-transaction/types.js";

function makeFakeClient() {
    return {
        calls: [],
        async request(method, path, opts) {
            this.calls.push({ method, path, query: opts?.query });
            return { data: { ok: true }, creditsConsumed: 1, creditsAvailable: 100, responseTime: 1, throughputUsage: 1 };
        },
    };
}

const noopLogger = new McpLogger(async () => {}, "test");

test("AML_EXPOSURE_BLOCKCHAINS holds exactly the 13 exposure chains", () => {
    const expected = [
        "ethereum",
        "binance-smart-chain",
        "ethereum-classic",
        "polygon",
        "tron",
        "bitcoin",
        "bitcoin-cash",
        "litecoin",
        "dogecoin",
        "dash",
        "zcash",
        "xrp",
        "solana",
    ];
    assert.deepStrictEqual([...AML_EXPOSURE_BLOCKCHAINS].sort(), [...expected].sort());
    assert.strictEqual(AML_EXPOSURE_BLOCKCHAINS.length, 13);
});

test("the aml tool action enum contains all four actions", () => {
    const result = AmlToolSchema.safeParse({ action: "get-address-exposure", blockchain: "ethereum", address: "addr" });
    assert.strictEqual(result.success, true);
    const result2 = AmlToolSchema.safeParse({
        action: "list-address-exposure-paths",
        blockchain: "ethereum",
        address: "addr",
    });
    assert.strictEqual(result2.success, true);
    const result3 = AmlToolSchema.safeParse({ action: "verify-address", address: "addr" });
    assert.strictEqual(result3.success, true);
    const result4 = AmlToolSchema.safeParse({
        action: "screen-transaction",
        blockchain: "ethereum",
        transactionHash: "0xhash",
    });
    assert.strictEqual(result4.success, true);
});

test("the credits map has the expected values", () => {
    assert.strictEqual(amlTool.credits["get-address-exposure"], 200000);
    assert.strictEqual(amlTool.credits["list-address-exposure-paths"], 100000);
    assert.strictEqual(amlTool.credits["verify-address"], 200000);
    assert.strictEqual(amlTool.credits["screen-transaction"], 500000);
});

test("get-address-exposure issues GET /aml/exposure/<blockchain>/<address> with context query", async () => {
    const client = makeFakeClient();
    const handler = amlTool.handler(client, noopLogger);
    await handler({ action: "get-address-exposure", blockchain: "ethereum", address: "0xabc123", context: "ctx-1" });

    assert.strictEqual(client.calls.length, 1);
    assert.deepStrictEqual(client.calls[0], {
        method: "GET",
        path: "/aml/exposure/ethereum/0xabc123",
        query: { context: "ctx-1" },
    });
});

test("get-address-exposure encodeURIComponent-encodes an address with / and :", async () => {
    const client = makeFakeClient();
    const handler = amlTool.handler(client, noopLogger);
    await handler({ action: "get-address-exposure", blockchain: "bitcoin", address: "abc/def:123" });

    assert.strictEqual(client.calls.length, 1);
    assert.strictEqual(client.calls[0].path, `/aml/exposure/bitcoin/${encodeURIComponent("abc/def:123")}`);
    assert.ok(client.calls[0].path.includes("%2F"));
    assert.ok(client.calls[0].path.includes("%3A"));
});

test("list-address-exposure-paths issues GET .../paths with only the set query params", async () => {
    const client = makeFakeClient();
    const handler = amlTool.handler(client, noopLogger);
    await handler({
        action: "list-address-exposure-paths",
        blockchain: "solana",
        address: "addr/with:specials",
        rootAddress: "root-addr",
        limit: 25,
        startingAfter: "cursor-1",
        context: "ctx-2",
    });

    assert.strictEqual(client.calls.length, 1);
    assert.deepStrictEqual(client.calls[0], {
        method: "GET",
        path: `/aml/exposure/solana/${encodeURIComponent("addr/with:specials")}/paths`,
        query: { context: "ctx-2", rootAddress: "root-addr", limit: 25, startingAfter: "cursor-1" },
    });
});

test("list-address-exposure-paths with no optional params sends only context in query", async () => {
    const client = makeFakeClient();
    const handler = amlTool.handler(client, noopLogger);
    await handler({ action: "list-address-exposure-paths", blockchain: "xrp", address: "addr" });

    assert.strictEqual(client.calls.length, 1);
    assert.deepStrictEqual(client.calls[0].query, {
        context: undefined,
        rootAddress: undefined,
        limit: undefined,
        startingAfter: undefined,
    });
});

test("all 13 exposure chains are accepted for both exposure actions", async () => {
    for (const blockchain of AML_EXPOSURE_BLOCKCHAINS) {
        const client = makeFakeClient();
        const handler = amlTool.handler(client, noopLogger);
        await handler({ action: "get-address-exposure", blockchain, address: "addr" });
        assert.strictEqual(client.calls.length, 1, `get-address-exposure should accept ${blockchain}`);

        const client2 = makeFakeClient();
        const handler2 = amlTool.handler(client2, noopLogger);
        await handler2({ action: "list-address-exposure-paths", blockchain, address: "addr" });
        assert.strictEqual(client2.calls.length, 1, `list-address-exposure-paths should accept ${blockchain}`);
    }
});

test("an exposure action with a non-exposure blockchain is rejected before any HTTP request", async () => {
    const nonExposureChains = ["arbitrum", "avalanche", "base", "optimism", "tezos", "kaspa"];
    for (const blockchain of nonExposureChains) {
        const client = makeFakeClient();
        const handler = amlTool.handler(client, noopLogger);
        await assert.rejects(
            () => handler({ action: "get-address-exposure", blockchain, address: "addr" }),
            (err) => {
                assert.ok(err instanceof Error);
                for (const chain of AML_EXPOSURE_BLOCKCHAINS) {
                    assert.ok(err.message.includes(chain), `error message should list ${chain}`);
                }
                return true;
            }
        );
        assert.strictEqual(client.calls.length, 0, `fake client must not be called for ${blockchain}`);

        const client2 = makeFakeClient();
        const handler2 = amlTool.handler(client2, noopLogger);
        await assert.rejects(() =>
            handler2({ action: "list-address-exposure-paths", blockchain, address: "addr" })
        );
        assert.strictEqual(client2.calls.length, 0, `fake client must not be called for ${blockchain}`);
    }
});

test("limit 0 and 51 are rejected by the schema before any HTTP request", () => {
    const tooLow = AmlToolSchema.safeParse({
        action: "list-address-exposure-paths",
        blockchain: "ethereum",
        address: "addr",
        limit: 0,
    });
    assert.strictEqual(tooLow.success, false);

    const tooHigh = AmlToolSchema.safeParse({
        action: "list-address-exposure-paths",
        blockchain: "ethereum",
        address: "addr",
        limit: 51,
    });
    assert.strictEqual(tooHigh.success, false);

    const valid = AmlToolSchema.safeParse({
        action: "list-address-exposure-paths",
        blockchain: "ethereum",
        address: "addr",
        limit: 50,
    });
    assert.strictEqual(valid.success, true);
});

test("screen-transaction still accepts arbitrum (a screenable but non-exposure chain)", async () => {
    const client = makeFakeClient();
    const handler = amlTool.handler(client, noopLogger);
    await handler({ action: "screen-transaction", blockchain: "arbitrum", transactionHash: "0xhash" });

    assert.strictEqual(client.calls.length, 1);
    assert.deepStrictEqual(client.calls[0], {
        method: "GET",
        path: "/aml/transactions/arbitrum/0xhash",
        query: { context: undefined },
    });
    assert.ok(AML_SCREENABLE_BLOCKCHAINS.includes("arbitrum"));
    assert.ok(!AML_EXPOSURE_BLOCKCHAINS.includes("arbitrum"));
});
