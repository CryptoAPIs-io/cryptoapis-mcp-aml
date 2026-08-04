import type { CryptoApisHttpClient, RequestMetadata } from "@cryptoapis-io/mcp-shared";
import type { VerifyAddressRequest } from "./types.js";

export type VerifyAddressInput = VerifyAddressRequest & RequestMetadata;

export async function verifyAddress(client: CryptoApisHttpClient, input: VerifyAddressInput) {
    return client.request<unknown>("GET", `/aml/addresses/${encodeURIComponent(input.address)}`, {
        query: { context: input.context },
    });
}
