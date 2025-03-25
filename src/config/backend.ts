import { ARBITRUM, BSCTESTNET, PEGASUS, PHOENIX, PUPPYNET } from "./chains";

export const AMP_STATS_API_URL = "https://stats.gmx.io/api";

// export const MEXC_API_URL = "https://www.mexc.com/api/platform/spot/market";
export const MEXC_API_URL = "https://www.mexc.com/api/platform/spot/market";

const BACKEND_URLS = {
  default: "https://gmx-server-mainnet.uw.r.appspot.com",

  [ARBITRUM]: "https://gmx-server-mainnet.uw.r.appspot.com",
  [PEGASUS]: "https://gmx-server-mainnet.uw.r.appspot.com",
  [PHOENIX]: "https://gmx-server-mainnet.uw.r.appspot.com",
  [BSCTESTNET]: "https://gmx-server-mainnet.uw.r.appspot.com",
  [PUPPYNET]: "https://gmx-server-mainnet.uw.r.appspot.com",
};

export function getServerBaseUrl(chainId: number) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }

  if (document.location.hostname.includes("deploy-preview")) {
    const fromLocalStorage = localStorage.getItem("SERVER_PEGASUS_URL");
    if (fromLocalStorage) {
      return fromLocalStorage;
    }
  }

  return BACKEND_URLS[chainId] || BACKEND_URLS.default;
}

export function getServerUrl(chainId: number, path: string) {
  return `${getServerBaseUrl(chainId)}${path}`;
}
