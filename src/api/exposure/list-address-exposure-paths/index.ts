import type { CryptoApisHttpClient, RequestMetadata } from "@cryptoapis-io/mcp-shared";
import type { ListAddressExposurePathsRequest } from "../types.js";

export type ListAddressExposurePathsInput = ListAddressExposurePathsRequest & RequestMetadata;

export async function listAddressExposurePaths(client: CryptoApisHttpClient, input: ListAddressExposurePathsInput) {
    return client.request<unknown>(
        "GET",
        `/aml/exposure/${input.blockchain}/${encodeURIComponent(input.address)}/paths`,
        {
            query: {
                context: input.context,
                rootAddress: input.rootAddress,
                limit: input.limit,
                startingAfter: input.startingAfter,
            },
        }
    );
}
