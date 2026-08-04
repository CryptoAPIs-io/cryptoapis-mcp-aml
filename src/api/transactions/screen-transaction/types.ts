/**
 * Blockchains supported by AML Screen Transaction — the widest per-endpoint enum in the API.
 * Kept local to this package: mcp-shared's BLOCKCHAIN_NETWORKS does not yet include
 * xrp, solana, tezos, or kaspa, and this endpoint has no network dimension.
 */
export const AML_SCREENABLE_BLOCKCHAINS = [
    "ethereum",
    "ethereum-classic",
    "binance-smart-chain",
    "bitcoin",
    "bitcoin-cash",
    "dash",
    "dogecoin",
    "litecoin",
    "arbitrum",
    "polygon",
    "avalanche",
    "optimism",
    "base",
    "zcash",
    "xrp",
    "solana",
    "tezos",
    "kaspa",
    "tron",
] as const;

export type AmlScreenableBlockchain = (typeof AML_SCREENABLE_BLOCKCHAINS)[number];

export type ScreenTransactionRequest = {
    blockchain: AmlScreenableBlockchain;
    transactionHash: string;
};
