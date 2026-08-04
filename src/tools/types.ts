import type { CryptoApisHttpClient, McpLogger, ToolCredits } from "@cryptoapis-io/mcp-shared";
import type * as z from "zod";

export type McpToolDef<TSchema extends z.ZodTypeAny> = {
    name: string;
    description: string;
    credits?: ToolCredits;
    inputSchema: TSchema;
    handler: (
        client: CryptoApisHttpClient,
        logger: McpLogger
    ) => (input: z.infer<TSchema>) => Promise<{ content: { type: "text"; text: string }[] }>;
};
