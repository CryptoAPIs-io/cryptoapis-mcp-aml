import { READ_ONLY_TOOL } from "@cryptoapis-io/mcp-shared";
import type { CryptoApisHttpClient, McpLogger, RequestResult } from "@cryptoapis-io/mcp-shared";
import type { McpToolDef } from "../types.js";
import { ACTION_BLOCKCHAINS, AmlToolSchema, type AmlToolInput } from "./schema.js";
import { verifyAddress } from "../../api/addresses/verify-address/index.js";
import { screenTransaction } from "../../api/transactions/screen-transaction/index.js";
import { getAddressExposure } from "../../api/exposure/get-address-exposure/index.js";
import { listAddressExposurePaths } from "../../api/exposure/list-address-exposure-paths/index.js";
import type { AmlExposureBlockchain } from "../../api/exposure/types.js";
import { credits as verifyAddressCredits } from "./verify-address/credits.js";
import { credits as screenTransactionCredits } from "./screen-transaction/credits.js";
import { credits as getAddressExposureCredits } from "./get-address-exposure/credits.js";
import { credits as listAddressExposurePathsCredits } from "./list-address-exposure-paths/credits.js";

const AML_DESCRIPTION = `AML (Anti-Money Laundering) risk checks for addresses and transactions.

Actions:
• verify-address: Check if a blockchain address is flagged or associated with fraud, sanctions, ransomware, exploits, darknet markets, or other AML risk categories. Returns risk score, risk band, and the flagging sources.
• screen-transaction: Screen a transaction against AML data. Returns whether the transaction is flagged, its risk score/band, and the flagged participant addresses with their roles, scores, severities and categories.
• get-address-exposure: Get an address's exposure to risky entities/categories across the AML exposure graph. Params: blockchain, address. Costs 200,000 credits per request.
• list-address-exposure-paths: List the paths connecting an address to risky entities in the AML exposure graph. Params: blockchain, address; optional rootAddress (only return routes originating from this flagged root address), limit (1-50, defaults to 10), startingAfter (pagination cursor). Costs 100,000 credits per page - pass the response's next cursor back as startingAfter to fetch subsequent pages.

get-address-exposure and list-address-exposure-paths only support a subset of chains - see the blockchain parameter description.

Note: the credit cost of these endpoints is significant — see credits below.`;

export const amlTool: McpToolDef<typeof AmlToolSchema> = {
    name: "aml",
    title: "AML address and transaction screening",
    annotations: READ_ONLY_TOOL,
    description: AML_DESCRIPTION,
    credits: {
        "verify-address": verifyAddressCredits,
        "screen-transaction": screenTransactionCredits,
        "get-address-exposure": getAddressExposureCredits,
        "list-address-exposure-paths": listAddressExposurePathsCredits,
    },
    inputSchema: AmlToolSchema,
    handler:
        (client: CryptoApisHttpClient, logger: McpLogger) =>
        async (input: AmlToolInput) => {
            let result: RequestResult<unknown>;
            switch (input.action) {
                case "verify-address":
                    if (!input.address) throw new Error("address is required for verify-address");
                    result = await verifyAddress(client, {
                        address: input.address,
                        context: input.context,
                    });
                    break;
                case "screen-transaction":
                    if (!input.blockchain) throw new Error("blockchain is required for screen-transaction");
                    if (!input.transactionHash) throw new Error("transactionHash is required for screen-transaction");
                    result = await screenTransaction(client, {
                        blockchain: input.blockchain,
                        transactionHash: input.transactionHash,
                        context: input.context,
                    });
                    break;
                case "get-address-exposure":
                    if (!input.address) throw new Error("address is required for get-address-exposure");
                    assertSupportedExposureBlockchain(input.action, input.blockchain);
                    result = await getAddressExposure(client, {
                        blockchain: input.blockchain,
                        address: input.address,
                        context: input.context,
                    });
                    break;
                case "list-address-exposure-paths":
                    if (!input.address) throw new Error("address is required for list-address-exposure-paths");
                    assertSupportedExposureBlockchain(input.action, input.blockchain);
                    result = await listAddressExposurePaths(client, {
                        blockchain: input.blockchain,
                        address: input.address,
                        rootAddress: input.rootAddress,
                        limit: input.limit,
                        startingAfter: input.startingAfter,
                        context: input.context,
                    });
                    break;
                default:
                    throw new Error(`Unknown action: ${(input as { action: string }).action}`);
            }

            logger.logInfo({
                tool: "aml",
                action: input.action,
                creditsConsumed: result.creditsConsumed,
                creditsAvailable: result.creditsAvailable,
                responseTime: result.responseTime,
                throughputUsage: result.throughputUsage,
            });

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify({
                            ...(result.data as object),
                            creditsConsumed: result.creditsConsumed,
                            creditsAvailable: result.creditsAvailable,
                            responseTime: result.responseTime,
                            throughputUsage: result.throughputUsage,
                        }),
                    },
                ],
            };
        },
};

function assertSupportedExposureBlockchain(
    action: string,
    blockchain: string | undefined
): asserts blockchain is AmlExposureBlockchain {
    if (!blockchain) throw new Error(`blockchain is required for ${action}`);
    const allowed = ACTION_BLOCKCHAINS[action];
    if (allowed && !allowed.includes(blockchain)) {
        throw new Error(`blockchain must be one of: ${allowed.join(", ")} (got "${blockchain}")`);
    }
}
