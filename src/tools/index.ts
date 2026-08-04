import { systemInfoTool } from "@cryptoapis-io/mcp-shared";
import { amlTool } from "./aml/index.js";

export const tools = [amlTool, systemInfoTool] as const;
