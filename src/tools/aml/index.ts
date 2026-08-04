import type { CryptoApisHttpClient, McpLogger, RequestResult } from "@cryptoapis-io/mcp-shared";
import type { McpToolDef } from "../types.js";
import { AmlToolSchema, type AmlToolInput } from "./schema.js";
import { verifyAddress } from "../../api/addresses/verify-address/index.js";
import { screenTransaction } from "../../api/transactions/screen-transaction/index.js";
import { credits as verifyAddressCredits } from "./verify-address/credits.js";
import { credits as screenTransactionCredits } from "./screen-transaction/credits.js";

const AML_DESCRIPTION = `AML (Anti-Money Laundering) risk checks for addresses and transactions.

Actions:
• verify-address: Check if a blockchain address is flagged or associated with fraud, sanctions, ransomware, exploits, darknet markets, or other AML risk categories. Returns risk score, risk band, and the flagging sources.
• screen-transaction: Screen a transaction against AML data. Returns whether the transaction is flagged, its risk score/band, and the flagged participant addresses with their roles, scores, severities and categories.

Note: the credit cost of these endpoints is significant — see credits below.`;

export const amlTool: McpToolDef<typeof AmlToolSchema> = {
    name: "aml",
    description: AML_DESCRIPTION,
    credits: {
        "verify-address": verifyAddressCredits,
        "screen-transaction": screenTransactionCredits,
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
