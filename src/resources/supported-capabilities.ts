import { AML_SCREENABLE_BLOCKCHAINS } from "../api/transactions/screen-transaction/types.js";
import { AML_EXPOSURE_BLOCKCHAINS } from "../api/exposure/types.js";

/**
 * Static resource describing the AML capabilities available in this package.
 *
 * verify-address has no blockchain parameter (address format alone identifies the chain);
 * screen-transaction requires an explicit blockchain from AML_SCREENABLE_BLOCKCHAINS;
 * get-address-exposure and list-address-exposure-paths require a blockchain from the
 * narrower AML_EXPOSURE_BLOCKCHAINS (no exposure graph for arbitrum, avalanche, base,
 * optimism, tezos or kaspa).
 */

export type AmlCapability = {
    tool: string;
    description: string;
    actions: {
        name: string;
        description: string;
        requiredParams: readonly string[];
        optionalParams?: readonly string[];
    }[];
};

export type SupportedCapabilitiesResource = {
    description: string;
    screenableBlockchains: readonly string[];
    exposureBlockchains: readonly string[];
    capabilities: readonly AmlCapability[];
};

/**
 * Format AML capabilities as human-readable text for embedding in prompt output.
 */
export function formatAmlCapabilities(data: SupportedCapabilitiesResource): string {
    const lines: string[] = ["Supported AML capabilities:"];
    for (const cap of data.capabilities) {
        lines.push(`\n${cap.tool}: ${cap.description}`);
        for (const action of cap.actions) {
            const params =
                action.requiredParams.length > 0 ? ` (requires: ${action.requiredParams.join(", ")})` : "";
            lines.push(`  • ${action.name}: ${action.description}${params}`);
        }
    }
    lines.push(`\nscreen-transaction supported blockchains: ${data.screenableBlockchains.join(", ")}`);
    lines.push(
        `\nget-address-exposure/list-address-exposure-paths supported blockchains: ${data.exposureBlockchains.join(", ")}`
    );
    return lines.join("\n");
}

export const supportedCapabilities: SupportedCapabilitiesResource = {
    description:
        "AML risk-screening tools for blockchain addresses and transactions. verify-address works across any supported chain from the address format alone; screen-transaction, get-address-exposure and list-address-exposure-paths require the blockchain to be specified explicitly.",
    screenableBlockchains: AML_SCREENABLE_BLOCKCHAINS,
    exposureBlockchains: AML_EXPOSURE_BLOCKCHAINS,
    capabilities: [
        {
            tool: "aml",
            description: "Check AML risk for an address or a transaction",
            actions: [
                {
                    name: "verify-address",
                    description: "Check if an address is flagged or associated with fraud, sanctions, or other AML risk categories",
                    requiredParams: ["address"],
                },
                {
                    name: "screen-transaction",
                    description: "Screen a transaction and its participants against AML data",
                    requiredParams: ["blockchain", "transactionHash"],
                },
                {
                    name: "get-address-exposure",
                    description: "Get an address's exposure to risky entities/categories in the AML exposure graph (200,000 credits per request)",
                    requiredParams: ["blockchain", "address"],
                },
                {
                    name: "list-address-exposure-paths",
                    description: "List the paths connecting an address to risky entities in the AML exposure graph (100,000 credits per page)",
                    requiredParams: ["blockchain", "address"],
                    optionalParams: ["rootAddress", "limit", "startingAfter"],
                },
            ],
        },
    ],
};
