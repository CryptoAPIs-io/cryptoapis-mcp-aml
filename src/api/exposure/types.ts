/**
 * Blockchains supported by the AML Exposure graph (Get Address Exposure, List Address
 * Exposure Paths). Narrower than AML_SCREENABLE_BLOCKCHAINS: arbitrum, avalanche, base,
 * optimism, tezos and kaspa have no exposure graph.
 */
export const AML_EXPOSURE_BLOCKCHAINS = [
    "ethereum",
    "binance-smart-chain",
    "ethereum-classic",
    "polygon",
    "tron",
    "bitcoin",
    "bitcoin-cash",
    "litecoin",
    "dogecoin",
    "dash",
    "zcash",
    "xrp",
    "solana",
] as const;

export type AmlExposureBlockchain = (typeof AML_EXPOSURE_BLOCKCHAINS)[number];

export type GetAddressExposureRequest = {
    blockchain: AmlExposureBlockchain;
    address: string;
};

export type ListAddressExposurePathsRequest = {
    blockchain: AmlExposureBlockchain;
    address: string;
    rootAddress?: string;
    limit?: number;
    startingAfter?: string;
};
