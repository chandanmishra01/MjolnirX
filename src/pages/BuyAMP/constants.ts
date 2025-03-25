import { ARBITRUM, PEGASUS } from "config/chains";
import { getContract } from "config/contracts";

const ARBITRUM_AMP = getContract(ARBITRUM, "AMP");
const PEGASUS_AMP = getContract(PEGASUS, "AMP");

type Exchange = {
  name: string;
  icon: string;
  networks: number[];
  link?: string;
  links?: { [ARBITRUM]: string; [PEGASUS]: string };
};

export const EXTERNAL_LINKS = {
  [ARBITRUM]: {
    bungee: `https://multitx.bungee.exchange/?toChainId=42161&toTokenAddress=${ARBITRUM_AMP}`,
    banxa: "https://amp.banxa.com/?coinType=ETH&fiatType=USD&fiatAmount=500&blockchain=arbitrum",
    o3: "https://o3swap.com/",
    networkWebsite: "https://arbitrum.io/",
    buyAmp: {
      banxa: "https://amp.banxa.com/?coinType=AMP&fiatType=USD&fiatAmount=500&blockchain=arbitrum",
      uniswap: `https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${ARBITRUM_AMP}`,
    },
  },
  [PEGASUS]: {
    bungee: `https://multitx.bungee.exchange/?toChainId=5&toTokenAddress=${PEGASUS_AMP}`,
    banxa: "https://amp.banxa.com/?coinType=ETH&fiatType=USD&fiatAmount=500&blockchain=base",
    networkWebsite: "https://ethereum.org/",
    buyAmp: {
      banxa: "https://amp.banxa.com/?coinType=AMP&fiatType=USD&fiatAmount=500&blockchain=base",
      uniswap: `https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${PEGASUS_AMP}`,
    },
  },
};

export const TRANSFER_EXCHANGES: Exchange[] = [
  {
    name: "Binance",
    icon: "ic_binance.svg",
    networks: [ARBITRUM, PEGASUS],
    link: "https://www.binance.com/en/trade/",
  },
  {
    name: "Synapse",
    icon: "ic_synapse.svg",
    networks: [ARBITRUM, PEGASUS],
    link: "https://synapseprotocol.com/",
  },
  {
    name: "Arbitrum",
    icon: "ic_arbitrum_24.svg",
    networks: [ARBITRUM],
    link: "https://bridge.arbitrum.io/",
  },
  {
    name: "PEGASUS",
    icon: "ic_avax_30.svg",
    networks: [PEGASUS],
    link: "https://bridge.avax.network/",
  },
  {
    name: "Hop",
    icon: "ic_hop.svg",
    networks: [ARBITRUM],
    link: "https://app.hop.exchange/send?token=ETH&sourceNetwork=ethereum&destNetwork=arbitrum",
  },
  {
    name: "Bungee",
    icon: "ic_bungee.png",
    networks: [ARBITRUM, PEGASUS],
    link: "https://multitx.bungee.exchange",
  },
  {
    name: "Multiswap",
    icon: "ic_multiswap.svg",
    networks: [ARBITRUM, PEGASUS],
    link: "https://app.multichain.org/#/router",
  },
  {
    name: "O3",
    icon: "ic_o3.png",
    networks: [ARBITRUM, PEGASUS],
    link: "https://o3swap.com/",
  },
  {
    name: "Across",
    icon: "ic_across.svg",
    networks: [ARBITRUM],
    link: "https://across.to/",
  },
];

export const CENTRALISED_EXCHANGES: Exchange[] = [
  {
    name: "Binance",
    icon: "ic_binance.svg",
    link: "https://www.binance.com/en/trade/AMP_USDT?_from=markets",
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Bybit",
    icon: "ic_bybit.svg",
    link: "https://www.bybit.com/en-US/trade/spot/AMP/USDT",
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Kucoin",
    icon: "ic_kucoin.svg",
    link: "https://www.kucoin.com/trade/AMP-USDT",
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Huobi",
    icon: "ic_huobi.svg",
    link: "https://www.huobi.com/en-us/exchange/amp_usdt/",
    networks: [ARBITRUM, PEGASUS],
  },
];

export const DECENTRALISED_AGGRIGATORS: Exchange[] = [
  {
    name: "1inch",
    icon: "ic_1inch.svg",
    links: {
      [ARBITRUM]: "https://app.1inch.io/#/42161/unified/swap/ETH/AMP",
      [PEGASUS]: "https://app.1inch.io/#/43114/unified/swap/AVAX/AMP",
    },
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Matcha",
    icon: "ic_matcha.png",
    links: {
      [ARBITRUM]: `https://www.matcha.xyz/markets/42161/${ARBITRUM_AMP}`,
      [PEGASUS]: `https://www.matcha.xyz/markets/43114/${PEGASUS_AMP}`,
    },
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Paraswap",
    icon: "ic_paraswap.svg",
    links: {
      [ARBITRUM]: "https://app.paraswap.io/#/?network=arbitrum",
      [PEGASUS]: "https://app.paraswap.io/#/?network=PEGASUS",
    },
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Firebird",
    icon: "ic_firebird.png",
    link: "https://app.firebird.finance/swap",
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "OpenOcean",
    icon: "ic_openocean.svg",
    links: {
      [ARBITRUM]: "https://app.openocean.finance/CLASSIC#/ARBITRUM/ETH/AMP",
      [PEGASUS]: "https://app.openocean.finance/CLASSIC#/AVAX/AVAX/AMP",
    },
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "DODO",
    icon: "ic_dodo.svg",
    links: {
      [ARBITRUM]: `https://app.dodoex.io/?from=ETH&to=${ARBITRUM_AMP}&network=arbitrum`,
      [PEGASUS]: `https://app.dodoex.io/?from=AVAX&to=${PEGASUS_AMP}&network=PEGASUS`,
    },
    networks: [ARBITRUM, PEGASUS],
  },
  {
    name: "Odos",
    icon: "ic_odos.png",
    link: "https://app.odos.xyz/",
    networks: [ARBITRUM],
  },
  {
    name: "Slingshot",
    icon: "ic_slingshot.svg",
    link: "https://app.slingshot.finance/swap/ETH",
    networks: [ARBITRUM],
  },
  {
    name: "Yieldyak",
    icon: "ic_yield_yak.png",
    link: "https://yieldyak.com/swap",
    networks: [PEGASUS],
  },
];
