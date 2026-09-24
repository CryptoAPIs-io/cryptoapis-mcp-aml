import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { CryptoApisHttpClient, formatCreditsForDescription, loadSharedConfig, McpLogger, startHttpServer } from "@cryptoapis-io/mcp-shared";
import { tools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

const CRYPTOAPIS_SERVER_INFO = {
    name: "cryptoapis-aml",
    version: "0.1.0",
    title: "CryptoAPIs AML",
    websiteUrl: "https://developers.cryptoapis.io",
    icons: [
        {
            src: "https://cryptoapis.io/cryptoapis/images/logo.svg",
            mimeType: "image/svg+xml",
            sizes: ["any"],
            theme: "light" as const,
        },
        {
            src: "https://cryptoapis.io/cryptoapis/images/logo-black.svg",
            mimeType: "image/svg+xml",
            sizes: ["any"],
            theme: "dark" as const,
        },
    ],
};

function buildServer(client: CryptoApisHttpClient) {
    const server = new McpServer(CRYPTOAPIS_SERVER_INFO);
    const logger = new McpLogger((params) => server.sendLoggingMessage(params), CRYPTOAPIS_SERVER_INFO.name);

    for (const t of tools) {
        const description =
            t.credits != null ? `${t.description}\n\n${formatCreditsForDescription(t.credits)}` : t.description;
        server.registerTool(t.name, { description, inputSchema: t.inputSchema }, (input: Record<string, unknown>) => {
            logger.logDebug({ tool: t.name, event: "tool_call", input });
            return t.handler(client, logger)(input as never).catch((err: unknown) => {
                logger.logError(err instanceof Error ? err.message : String(err), {
                    tool: t.name,
                    action: input.action,
                    blockchain: input.blockchain,
                });
                throw err;
            });
        });
    }

    registerResources(server);
    registerPrompts(server);

    return { server, logger };
}

export type StartOptions =
    | { transport: "stdio"; apiKey?: string }
    | {
          transport: "http";
          host?: string;
          port?: number;
          path?: string;
          stateless?: boolean;
          apiKey?: string;
          authToken?: string;
          allowedHosts?: string[];
      };

export async function startAmlServer(opts: StartOptions) {
    const isHttp = opts.transport === "http";
    const cfg = loadSharedConfig({ apiKey: opts.apiKey, allowMissingApiKey: isHttp });
    const client = new CryptoApisHttpClient(cfg);
    if (opts.transport === "stdio") {
        const { server, logger } = buildServer(client);
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.logInfo("cryptoapis-aml MCP running (stdio)");
        return;
    }

    await startHttpServer({
        name: CRYPTOAPIS_SERVER_INFO.name,
        createServer: () => buildServer(client).server,
        startupApiKey: cfg.apiKey,
        host: opts.host,
        port: opts.port,
        path: opts.path,
        stateless: opts.stateless,
        authToken: opts.authToken,
        allowedHosts: opts.allowedHosts,
    });
}
