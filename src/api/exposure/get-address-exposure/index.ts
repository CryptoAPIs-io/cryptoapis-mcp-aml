import type { CryptoApisHttpClient, RequestMetadata } from "@cryptoapis-io/mcp-shared";
import type { GetAddressExposureRequest } from "../types.js";

export type GetAddressExposureInput = GetAddressExposureRequest & RequestMetadata;

export async function getAddressExposure(client: CryptoApisHttpClient, input: GetAddressExposureInput) {
    return client.request<unknown>("GET", `/aml/exposure/${input.blockchain}/${encodeURIComponent(input.address)}`, {
        query: { context: input.context },
    });
}
