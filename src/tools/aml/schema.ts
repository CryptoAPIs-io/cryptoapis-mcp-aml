import * as z from "zod";
import { RequestMetadataSchema } from "@cryptoapis-io/mcp-shared";
import { AML_SCREENABLE_BLOCKCHAINS } from "../../api/transactions/screen-transaction/types.js";

export const AmlAction = z.enum(["verify-address", "screen-transaction"]);

export const AmlToolSchema = z
    .object({
        action: AmlAction.describe("Action to perform"),
        address: z
            .string()
            .min(1)
            .optional()
            .describe("Blockchain address to verify against AML databases - required for verify-address"),
        blockchain: z
            .enum(AML_SCREENABLE_BLOCKCHAINS)
            .optional()
            .describe(
                `Blockchain protocol the transaction belongs to - required for screen-transaction. One of: ${AML_SCREENABLE_BLOCKCHAINS.join(", ")}`
            ),
        transactionHash: z
            .string()
            .min(1)
            .optional()
            .describe("Transaction hash to screen against AML data - required for screen-transaction"),
    })
    .merge(RequestMetadataSchema);

export type AmlToolInput = z.infer<typeof AmlToolSchema>;
