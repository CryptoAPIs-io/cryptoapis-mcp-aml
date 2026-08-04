import type { CryptoApisHttpClient, RequestMetadata } from "@cryptoapis-io/mcp-shared";
import type { ScreenTransactionRequest } from "./types.js";

export type ScreenTransactionInput = ScreenTransactionRequest & RequestMetadata;

export async function screenTransaction(client: CryptoApisHttpClient, input: ScreenTransactionInput) {
    return client.request<unknown>(
        "GET",
        `/aml/transactions/${input.blockchain}/${encodeURIComponent(input.transactionHash)}`,
        { query: { context: input.context } }
    );
}
