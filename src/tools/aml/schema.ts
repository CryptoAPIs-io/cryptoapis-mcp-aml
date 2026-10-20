import * as z from "zod";
import { RequestMetadataSchema } from "@cryptoapis-io/mcp-shared";
import { AML_SCREENABLE_BLOCKCHAINS } from "../../api/transactions/screen-transaction/types.js";
import { AML_EXPOSURE_BLOCKCHAINS } from "../../api/exposure/types.js";

export const AmlAction = z.enum([
    "verify-address",
    "screen-transaction",
    "get-address-exposure",
    "list-address-exposure-paths",
]);

/**
 * Per-action blockchain restrictions narrower than the tool-wide AML_SCREENABLE_BLOCKCHAINS
 * union below. Enforced in the tool handler as a pre-flight check, not via Zod
 * .superRefine() (breaks inputSchema introspection in MCP clients like the Inspector).
 */
export const ACTION_BLOCKCHAINS: Partial<Record<string, readonly string[]>> = {
    "get-address-exposure": AML_EXPOSURE_BLOCKCHAINS,
    "list-address-exposure-paths": AML_EXPOSURE_BLOCKCHAINS,
};

export const AmlToolSchema = z
    .object({
        action: AmlAction.describe("Action to perform"),
        address: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Blockchain address - required for verify-address, get-address-exposure, and list-address-exposure-paths"
            ),
        blockchain: z
            .enum(AML_SCREENABLE_BLOCKCHAINS)
            .optional()
            .describe(
                `Blockchain protocol - required for screen-transaction, get-address-exposure and list-address-exposure-paths. screen-transaction accepts: ${AML_SCREENABLE_BLOCKCHAINS.join(", ")}. get-address-exposure and list-address-exposure-paths accept only: ${AML_EXPOSURE_BLOCKCHAINS.join(", ")}`
            ),
        transactionHash: z
            .string()
            .min(1)
            .optional()
            .describe("Transaction hash to screen against AML data - required for screen-transaction"),
        rootAddress: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Only return routes that originate from this flagged root address (one of the roots[].rootAddress values returned by get-address-exposure) - optional, applies to list-address-exposure-paths only"
            ),
        limit: z
            .number()
            .int()
            .min(1)
            .max(50)
            .optional()
            .describe(
                "Number of exposure paths to return per page (1-50, defaults to 10) - applies to list-address-exposure-paths only"
            ),
        startingAfter: z
            .string()
            .optional()
            .describe(
                "Pagination cursor - pass the nextStartingAfter value from the previous response to fetch the next page; applies to list-address-exposure-paths only"
            ),
    })
    .merge(RequestMetadataSchema);

export type AmlToolInput = z.infer<typeof AmlToolSchema>;
