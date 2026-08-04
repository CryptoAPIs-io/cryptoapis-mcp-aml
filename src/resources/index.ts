import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { supportedCapabilities } from "./supported-capabilities.js";

const RESOURCE_URI = "cryptoapis://aml/supported-capabilities";

export function registerResources(server: McpServer): void {
    server.registerResource(
        "supported-capabilities",
        RESOURCE_URI,
        { description: "Available AML tools, actions, and the blockchains screen-transaction supports" },
        (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(supportedCapabilities, null, 2),
                },
            ],
        })
    );
}
