import { createClient } from "./utils";
import { SUBGRAPH_URLS } from "config/subgraph";
import { ARBITRUM, PEGASUS, PHOENIX, BSCTESTNET, PUPPYNET } from "config/chains";

export const chainlinkClient = createClient(SUBGRAPH_URLS.common.chainLink);

export const arbitrumGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].stats);
export const arbitrumReferralsGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].referrals);
export const nissohGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].nissohVault);

export const pegasusGraphClient = createClient(SUBGRAPH_URLS[PEGASUS].stats);
export const pegasusReferralsGraphClient = createClient(SUBGRAPH_URLS[PEGASUS].referrals);
export const pegasusGraphClientForTrades = createClient(SUBGRAPH_URLS[PEGASUS].trades);
export const pegasusGraphClientForRaw = createClient(SUBGRAPH_URLS[PEGASUS].raw);
export const pegasusGraphClientForPoints = createClient(SUBGRAPH_URLS[PEGASUS].points);

export const phoenixGraphClient = createClient(SUBGRAPH_URLS[PHOENIX].stats);
export const phoenixReferralsGraphClient = createClient(SUBGRAPH_URLS[PHOENIX].referrals);
export const phoenixGraphClientForTrades = createClient(SUBGRAPH_URLS[PHOENIX].trades);
export const phoenixGraphClientForRaw = createClient(SUBGRAPH_URLS[PHOENIX].raw);
export const phoenixGraphClientForPoints = createClient(SUBGRAPH_URLS[PHOENIX].points);

export const bsctestnetGraphClient = createClient(SUBGRAPH_URLS[BSCTESTNET].stats);
export const bsctestnetReferralsGraphClient = createClient(SUBGRAPH_URLS[BSCTESTNET].referrals);
export const bsctestnetGraphClientForTrades = createClient(SUBGRAPH_URLS[BSCTESTNET].trades);
export const bsctestnetGraphClientForRaw = createClient(SUBGRAPH_URLS[BSCTESTNET].raw);
export const bsctestnetGraphClientForPoints = createClient(SUBGRAPH_URLS[BSCTESTNET].points);

export const puppynetGraphClient = createClient(SUBGRAPH_URLS[PUPPYNET].stats);
export const puppynetReferralsGraphClient = createClient(SUBGRAPH_URLS[PUPPYNET].referrals);
export const puppynetGraphClientForTrades = createClient(SUBGRAPH_URLS[PUPPYNET].trades);
export const puppynetGraphClientForRaw = createClient(SUBGRAPH_URLS[PUPPYNET].raw);
export const puppynetGraphClientForPoints = createClient(SUBGRAPH_URLS[PUPPYNET].points);

export function getAmpGraphClient(chainId: number) {
  if (chainId === ARBITRUM) {
    return arbitrumGraphClient;
  } else if (chainId === PEGASUS) {
    return pegasusGraphClient;
  } else if (chainId === PHOENIX) {
    return phoenixGraphClient;
  } else if (chainId === BSCTESTNET) {
    return bsctestnetGraphClient
  } else if (chainId === PUPPYNET) {
    return puppynetGraphClient
  }

  throw new Error(`Unsupported chain ${chainId}`);
}

export function getTradesGraphClient(chainId: number) {
  if (chainId === ARBITRUM) {
    return nissohGraphClient;
  } else if (chainId === PEGASUS) {
    return pegasusGraphClientForTrades;
  } else if (chainId === PHOENIX) {
    return phoenixGraphClientForTrades;
  } else if (chainId === BSCTESTNET) {
    return bsctestnetGraphClientForTrades
  } else if (chainId === PUPPYNET) {
    return puppynetGraphClientForTrades
  }

  throw new Error(`Unsupported chain ${chainId}`);
}

export function getPointsGraphClient(chainId: number) {
  if (chainId === ARBITRUM) {
    return nissohGraphClient;
  } else if (chainId === PEGASUS) {
    return pegasusGraphClientForPoints;
  } else if (chainId === PHOENIX) {
    return phoenixGraphClientForPoints;
  } else if (chainId === BSCTESTNET) {
    return bsctestnetGraphClientForPoints;
  } else if (chainId === PUPPYNET) {
    return puppynetGraphClientForPoints;
  }

  throw new Error(`Unsupported chain ${chainId}`);
}

export function getRawGraphClient(chainId: number) {
  if (chainId === PEGASUS) {
    return pegasusGraphClientForRaw;
  } else if (chainId === PHOENIX) {
    return phoenixGraphClientForRaw;
  } else if (chainId === BSCTESTNET) {
    return bsctestnetGraphClientForRaw
  } else if (chainId === PUPPYNET) {
    return puppynetGraphClientForRaw
  }

  throw new Error(`Unsupported chain ${chainId}`);
}

export function getAmpGraphClientByNewCreate(chainId: number) {
  if (chainId === ARBITRUM) {
    return createClient(SUBGRAPH_URLS[ARBITRUM].stats);
  } else if (chainId === PEGASUS) {
    return createClient(SUBGRAPH_URLS[PEGASUS].stats);
  } else if (chainId === PHOENIX) {
    return createClient(SUBGRAPH_URLS[PHOENIX].stats);
  } else if (chainId === BSCTESTNET) {
    return createClient(SUBGRAPH_URLS[BSCTESTNET].stats)
  } else if (chainId === PUPPYNET) {
    return createClient(SUBGRAPH_URLS[PUPPYNET].stats)
  }

  throw new Error(`Unsupported chain ${chainId}`);
}

export function getAmpGraphClientByNewCreateOrder(chainId: number) {
  if (chainId === ARBITRUM) {
    return createClient(SUBGRAPH_URLS[ARBITRUM].stats);
  } else if (chainId === PEGASUS) {
    return createClient(SUBGRAPH_URLS[PEGASUS].ordernew);
  } else if (chainId === PHOENIX) {
    return createClient(SUBGRAPH_URLS[PHOENIX].ordernew);
  } else if (chainId === BSCTESTNET) {
    return createClient(SUBGRAPH_URLS[BSCTESTNET].ordernew);
  } else if (chainId === PUPPYNET) {
    return createClient(SUBGRAPH_URLS[PUPPYNET].ordernew);
  }

  throw new Error(`Unsupported chain ${chainId}`);
}