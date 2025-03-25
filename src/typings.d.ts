import "@web3modal/ethers5/react";
declare global {
  interface Window {
    ethereum?: any;
  }
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean;
  }
}
