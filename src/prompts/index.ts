import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { supportedCapabilities, formatAmlCapabilities } from "../resources/supported-capabilities.js";

export function registerPrompts(server: McpServer): void {
    server.registerPrompt(
        "check-aml-risk",
        {
            description: "Check the AML risk of a blockchain address or transaction",
            argsSchema: {
                address: z.string().optional().describe("Blockchain address to verify"),
                blockchain: z.string().optional().describe("Blockchain protocol, required together with transactionHash"),
                transactionHash: z.string().optional().describe("Transaction hash to screen, required together with blockchain"),
            },
        },
        (args): GetPromptResult => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: args.transactionHash
                            ? `Use the aml tool with action screen-transaction to check transaction ${args.transactionHash} on ${args.blockchain} for AML risk. Report the risk band, risk score, and any flagged participant addresses with their roles and categories.\n\n${formatAmlCapabilities(supportedCapabilities)}`
                            : `Use the aml tool with action verify-address to check address ${args.address} for AML risk. Report the risk band, risk score, categories, and flagging sources.\n\n${formatAmlCapabilities(supportedCapabilities)}`,
                    },
                },
            ],
        })
    );

    server.registerPrompt(
        "check-address-exposure",
        {
            description:
                "Check a blockchain address's exposure to risky entities via the AML exposure graph (200,000 credits per request; 100,000 credits per page for paths)",
            argsSchema: {
                blockchain: z.string().describe("Blockchain protocol - one of the exposure-supported chains"),
                address: z.string().describe("Blockchain address to check exposure for"),
                rootAddress: z.string().optional().describe("Only return routes originating from this flagged root address"),
            },
        },
        (args): GetPromptResult => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Use the aml tool with action get-address-exposure to check address ${args.address} on ${args.blockchain} for exposure to risky entities (200,000 credits). Then use action list-address-exposure-paths (100,000 credits per page${args.rootAddress ? `, rootAddress ${args.rootAddress}` : ""}) to list the connecting paths, passing the response's nextStartingAfter back as startingAfter to page through all results. Report the exposure categories, risk levels, and the paths found.\n\n${formatAmlCapabilities(supportedCapabilities)}`,
                    },
                },
            ],
        })
    );
}
