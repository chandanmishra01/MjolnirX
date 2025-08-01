import { SELECTED_NETWORK_LOCAL_STORAGE_KEY } from "config/localStorage";
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS } from "config/chains";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

export function useChainId() {
  let { chainId } = useWeb3ModalAccount();

  if (!chainId) {
    const chainIdFromLocalStorage = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
    if (chainIdFromLocalStorage) {
      chainId = parseInt(chainIdFromLocalStorage);
      if (!chainId) {
        // localstorage value is invalid
        localStorage.removeItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
      }
    }
  }

  if (!chainId || !SUPPORTED_CHAIN_IDS.includes(chainId)) {
    chainId = 743111;
  }

  return { chainId };
}
