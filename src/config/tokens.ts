import { ethers } from "ethers";
import { getContract } from "./contracts";
import { ARBITRUM, BSCTESTNET, PEGASUS, PHOENIX, PUPPYNET } from "./chains";
import { Token } from "domain/tokens";

export const TOKENS: { [chainId: number]: Token[] } = {
  [ARBITRUM]: [
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
    },
    {
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      isWrapped: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 8,
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
    },
    {
      name: "Chainlink",
      symbol: "LINK",
      decimals: 18,
      address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      isStable: false,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png?1547034700",
    },
    {
      name: "Uniswap",
      symbol: "UNI",
      decimals: 18,
      address: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
      isStable: false,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/12504/thumb/uniswap-uni.png?1600306604",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389",
    },
    {
      name: "Tether",
      symbol: "USDT",
      decimals: 6,
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png?1598003707",
    },
    {
      name: "Dai",
      symbol: "DAI",
      decimals: 18,
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
    },
    {
      name: "Frax",
      symbol: "FRAX",
      decimals: 18,
      address: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/13422/small/frax_logo.png?1608476506",
    },
    {
      name: "Magic Internet Money",
      symbol: "MIM",
      decimals: 18,
      address: "0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A",
      isStable: true,
      isTempHidden: true,
      imageUrl: "https://assets.coingecko.com/coins/images/16786/small/mimlogopng.png",
    },
  ],
  [PEGASUS]: [
    {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/4713/small/weth.png?1624446912",
    },
    {
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      address: "0xf42991f02c07ab66cfea282e7e482382aeb85461",
      isWrapped: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 8,
      address: "0x9ee1aa18f3feb435f811d6ae2f71b7d2a4adce0b",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      address: "0x057e8e2bc40ecff87e6f9b28750d5e7ac004eab9",
      decimals: 6,
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    },
    // {
    //   name: "Wrapped BNB",
    //   symbol: "BNB",
    //   decimals: 18,
    //   address: "0x60d7966bdf03f0ec0ac6de7269ce0e57aad6e9c2",
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
    // },
    {
      name: "Wrapped SOL",
      symbol: "SOL",
      decimals: 18,
      address: "0xad45924555be89f07019376eeb4cb30e3d857cfd",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    },
    {
      name: "LightLink",
      symbol: "LL",
      decimals: 18,
      address: "0xb0aaaa41170ad29b00fc166e41da3100d11edf68",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/35357/standard/lightlink-ticker-200.png",
    },
    // {
    //   name: "USD Coin",
    //   symbol: "USDC",
    //   address: "0x3cf2c147d43c98fa96d267572e3fd44a4d3940d4",
    //   decimals: 6,
    //   isStable: true,
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389",
    // },
    // {
    //   name: "DAI",
    //   symbol: "DAI",
    //   address: "0x4b6b9b31c72836806b0b1104cf1cdab8a0e3bd66",
    //   decimals: 18,
    //   isStable: true,
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
    // },
  ],
  [PHOENIX]: [
    {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/4713/small/weth.png?1624446912",
    },
    {
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      address: "0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73",
      isWrapped: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 8,
      address: "0x46a5e3fa4a02b9ae43d9df9408c86ed643144a67",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
    },
    {
      name: "Wrapped BNB",
      symbol: "BNB",
      decimals: 18,
      address: "0x81a1f39f7394c4849e4261aa02aac73865d13774",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      address: "0x6308fa9545126237158778e74ae1b6b89022c5c0",
      decimals: 6,
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      address: "0x18fb38404dadee1727be4b805c5b242b5413fa40",
      decimals: 6,
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389",
    },
    {
      name: "LightLink",
      symbol: "LL",
      decimals: 18,
      address: "0xd9d7123552fa2bedb2348bb562576d67f6e8e96e",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/35357/standard/lightlink-ticker-200.png",
    },
    // {
    //   name: "DAI",
    //   symbol: "DAI",
    //   address: "0x4b6b9b31c72836806b0b1104cf1cdab8a0e3bd66",
    //   decimals: 18,
    //   isStable: true,
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
    // },
  ],
  [BSCTESTNET]: [
    {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/4713/small/weth.png?1624446912",
    },
    {
      name: "Wrapped BNB",
      symbol: "WBNB",
      decimals: 18,
      address: "0x612777eea37a44f7a95e3b101c39e1e2695fa6c2",
      isWrapped: true,
      baseSymbol: "BNB",
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 8,
      address: "0xb19c12715134bee7c4b1ca593ee9e430dabe7b56",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
      decimals: 18,
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0x1958f7c067226c7c8ac310dc994d0cebabfb2b02",
      decimals: 18,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    // {
    //   name: "DAI",
    //   symbol: "DAI",
    //   address: "0x4b6b9b31c72836806b0b1104cf1cdab8a0e3bd66",
    //   decimals: 18,
    //   isStable: true,
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
    // },
  ],
  [PUPPYNET]: [
    {
      name: "BONE",
      symbol: "BONE",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/16916/standard/bone_icon.png?1696516487",
    },
    {
      name: "Wrapped BONE",
      symbol: "WBONE",
      decimals: 18,
      address: "0x41c3f37587ebcd46c0f85ef43e38bcfe1e70ab56",
      isWrapped: true,
      baseSymbol: "BNB",
      imageUrl: "https://assets.coingecko.com/coins/images/16916/standard/bone_icon.png?1696516487",
    },
    {
      name: "USDC",
      symbol: "USDC",
      decimals: 18,
      address: "0x71266449ffda0c201e08b22877b41091b54f2335",
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      address: "0x9b206210d530de8c2e9ad4ed52f478e9a445182f",
      decimals: 18,
      isStable: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0x71ee67eb7a61a827b4167d0456c48f446fc7d32d",
      decimals: 18,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
    },
    {
      name: "Shiba Inu",
      symbol: "SHIB",
      address: "0x27f9518dd305ac7300e284af0642191f32685a50",
      decimals: 18,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/11939/standard/shiba.png?1696511800",
    },
    {
      name: "TREAT",
      symbol: "TREAT",
      address: "0x713682ab5795d5b89b1e8be8c79cb8d2a7cfbd27",
      decimals: 18,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/53501/standard/Treat_blk_200x200.png?1736524245",
    },
    // {
    //   name: "DAI",
    //   symbol: "DAI",
    //   address: "0x4b6b9b31c72836806b0b1104cf1cdab8a0e3bd66",
    //   decimals: 18,
    //   isStable: true,
    //   isShortable: true,
    //   imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
    // },
  ],
};

export const ADDITIONAL_TOKENS: { [chainId: number]: Token[] } = {
  [ARBITRUM]: [
    {
      name: "AMP",
      symbol: "AMP",
      address: getContract(ARBITRUM, "AMP"),
      decimals: 18,
      imageUrl: "https://assets.coingecko.com/coins/images/18323/small/arbit.png?1631532468",
    },
    {
      name: "Escrowed AMP",
      symbol: "esAMP",
      address: getContract(ARBITRUM, "ES_AMP"),
      decimals: 18,
    },
    {
      name: "AMP LP",
      symbol: "ALP",
      address: getContract(ARBITRUM, "ALP"),
      decimals: 18,
      imageUrl: "https://github.com/Amped-Dex/amp-assets/blob/main/AMP-Assets/PNG/ALP_LOGO%20ONLY.png?raw=true",
    },
  ],
  [PEGASUS]: [
    {
      name: "AMP",
      symbol: "AMP",
      address: getContract(PEGASUS, "AMP"),
      decimals: 18,
      imageUrl: "",
    },
    {
      name: "Escrowed AMP",
      symbol: "esAMP",
      address: getContract(PEGASUS, "ES_AMP"),
      decimals: 18,
    },
    {
      name: "AMP LP",
      symbol: "ALP",
      address: getContract(PEGASUS, "ALP"),
      decimals: 18,
      imageUrl: "",
    },
  ],
};

export const PLATFORM_TOKENS: { [chainId: number]: { [symbol: string]: Token } } = {
  [ARBITRUM]: {
    // arbitrum
    AMP: {
      name: "AMP",
      symbol: "AMP",
      decimals: 18,
      address: getContract(ARBITRUM, "AMP"),
      imageUrl: "https://assets.coingecko.com/coins/images/18323/small/arbit.png?1631532468",
    },
    ALP: {
      name: "AMP LP",
      symbol: "ALP",
      decimals: 18,
      address: getContract(ARBITRUM, "StakedAlpTracker"), // address of fsALP token because user only holds fsALP
      imageUrl: "https://github.com/Amped-Dex/amp-assets/blob/main/AMP-Assets/PNG/ALP_LOGO%20ONLY.png?raw=true",
    },
  },
  [PEGASUS]: {
    AMP: {
      name: "AMP",
      symbol: "AMP",
      decimals: 18,
      address: getContract(PEGASUS, "AMP"),
      imageUrl: "",
    },
    ALP: {
      name: "AMP LP",
      symbol: "ALP",
      decimals: 18,
      address: getContract(PEGASUS, "StakedAlpTracker"), // address of fsALP token because user only holds fsALP
      imageUrl: "",
    },
  },
};

export const ICONLINKS = {
  [ARBITRUM]: {
    AMP: {
      coingecko: "https://www.coingecko.com/en/coins/amp",
      arbitrum: "https://arbiscan.io/address/0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a",
    },
    ALP: {
      arbitrum: "https://arbiscan.io/token/0x1aDDD80E6039594eE970E5872D247bf0414C8903",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/ethereum",
    },
    BTC: {
      coingecko: "https://www.coingecko.com/en/coins/wrapped-bitcoin",
      arbitrum: "https://arbiscan.io/address/0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    },
    LINK: {
      coingecko: "https://www.coingecko.com/en/coins/chainlink",
      arbitrum: "https://arbiscan.io/address/0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
    },
    UNI: {
      coingecko: "https://www.coingecko.com/en/coins/uniswap",
      arbitrum: "https://arbiscan.io/address/0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      arbitrum: "https://arbiscan.io/address/0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      arbitrum: "https://arbiscan.io/address/0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      arbitrum: "https://arbiscan.io/address/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    },
    MIM: {
      coingecko: "https://www.coingecko.com/en/coins/magic-internet-money",
      arbitrum: "https://arbiscan.io/address/0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a",
    },
    FRAX: {
      coingecko: "https://www.coingecko.com/en/coins/frax",
      arbitrum: "https://arbiscan.io/address/0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
    },
  },
  [PEGASUS]: {
    AMP: {
      pagasus: "https://basescan.org/address/0x155BabF44190E2ef3d5EEae6AA261E794de83b23",
    },
    ALP: {
      pagasus: "https://basescan.org/address/0x3c6DEc605311571b67978C6EF2DbfE77A841722d",
    },
    CRO: {
      coingecko: "https://www.coingecko.com/en/coins/base",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      pagasus: "https://basescan.org/address/0xe44fd7fcb2b1581822d0c862b68222998a0c299a",
    },
   
    DOGE: {
      coingecko: "https://www.coingecko.com/en/coins/dogecoin",
      pagasus: "https://basescan.org/address/0x1a8e39ae59e5556b56b76fcba98d22c9ae557396",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      pagasus: "https://basescan.org/address/0xf2001b145b43032aaf5ee2884e456ccd805f677d",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      pagasus: "https://basescan.org/address/0x66e428c3f67a68878562e79a0234c1f83c208770",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      pagasus: "https://basescan.org/address/0xc21223249ca28397b4b6541dffaecc539bff0c59",
    },
  },
  [PHOENIX]: {
    AMP: {
      pagasus: "https://basescan.org/address/0x155BabF44190E2ef3d5EEae6AA261E794de83b23",
    },
    ALP: {
      pagasus: "https://basescan.org/address/0x3c6DEc605311571b67978C6EF2DbfE77A841722d",
    },
    CRO: {
      coingecko: "https://www.coingecko.com/en/coins/base",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      pagasus: "https://basescan.org/address/0xe44fd7fcb2b1581822d0c862b68222998a0c299a",
    },
   
    DOGE: {
      coingecko: "https://www.coingecko.com/en/coins/dogecoin",
      pagasus: "https://basescan.org/address/0x1a8e39ae59e5556b56b76fcba98d22c9ae557396",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      pagasus: "https://basescan.org/address/0xf2001b145b43032aaf5ee2884e456ccd805f677d",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      pagasus: "https://basescan.org/address/0x66e428c3f67a68878562e79a0234c1f83c208770",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      pagasus: "https://basescan.org/address/0xc21223249ca28397b4b6541dffaecc539bff0c59",
    },
  },
  [BSCTESTNET]: {
    AMP: {
      pagasus: "https://basescan.org/address/0x155BabF44190E2ef3d5EEae6AA261E794de83b23",
    },
    ALP: {
      pagasus: "https://basescan.org/address/0x3c6DEc605311571b67978C6EF2DbfE77A841722d",
    },
    CRO: {
      coingecko: "https://www.coingecko.com/en/coins/base",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      pagasus: "https://basescan.org/address/0xe44fd7fcb2b1581822d0c862b68222998a0c299a",
    },
   
    DOGE: {
      coingecko: "https://www.coingecko.com/en/coins/dogecoin",
      pagasus: "https://basescan.org/address/0x1a8e39ae59e5556b56b76fcba98d22c9ae557396",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      pagasus: "https://basescan.org/address/0xf2001b145b43032aaf5ee2884e456ccd805f677d",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      pagasus: "https://basescan.org/address/0x66e428c3f67a68878562e79a0234c1f83c208770",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      pagasus: "https://basescan.org/address/0xc21223249ca28397b4b6541dffaecc539bff0c59",
    },
  },

  [PUPPYNET]: {
    AMP: {
      pagasus: "https://basescan.org/address/0x155BabF44190E2ef3d5EEae6AA261E794de83b23",
    },
    ALP: {
      pagasus: "https://basescan.org/address/0x3c6DEc605311571b67978C6EF2DbfE77A841722d",
    },
    CRO: {
      coingecko: "https://www.coingecko.com/en/coins/base",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/weth",
      pagasus: "https://basescan.org/address/0xe44fd7fcb2b1581822d0c862b68222998a0c299a",
    },
   
    DOGE: {
      coingecko: "https://www.coingecko.com/en/coins/dogecoin",
      pagasus: "https://basescan.org/address/0x1a8e39ae59e5556b56b76fcba98d22c9ae557396",
    },
    DAI: {
      coingecko: "https://www.coingecko.com/en/coins/dai",
      pagasus: "https://basescan.org/address/0xf2001b145b43032aaf5ee2884e456ccd805f677d",
    },
    USDT: {
      coingecko: "https://www.coingecko.com/en/coins/tether",
      pagasus: "https://basescan.org/address/0x66e428c3f67a68878562e79a0234c1f83c208770",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      pagasus: "https://basescan.org/address/0xc21223249ca28397b4b6541dffaecc539bff0c59",
    },
  },
};

export const ALP_POOL_COLORS = {
  ETH: "#6062a6",
  BTC: "#F7931A",
  BNB: "#F0B90A",
  WBTC: "#F7931A",
  "USDC.e": "#2A5ADA",
  MIM: "#9695F8",
  MATIC: "#000",
  DAI: "#FAC044",
  UNI: "#E9167C",
  AVAX: "#E84142",
  TREAT: "#3256D6",
  SHIB: "#ef6401",
  BONE: "#3256D6",
  USDT: "#67B18A",
  USDC: "#2775CA",
};

export const TOKENS_MAP: { [chainId: number]: { [address: string]: Token } } = {};
export const TOKENS_BY_SYMBOL_MAP: { [chainId: number]: { [symbol: string]: Token } } = {};
export const WRAPPED_TOKENS_MAP: { [chainId: number]: Token } = {};
export const NATIVE_TOKENS_MAP: { [chainId: number]: Token } = {};

const CHAIN_IDS = [ARBITRUM, PEGASUS, PHOENIX, BSCTESTNET, PUPPYNET];

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId: number) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId: number) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId: number) {
  return TOKENS[chainId];
}

export function isValidToken(chainId: number, address: string) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId: number, address: string) {
  address = address.toLowerCase();

  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId: number, symbol: string) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId: number) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDG");
}

export function getVisibleTokens(chainId: number) {
  return getWhitelistedTokens(chainId).filter((token) => !token.isWrapped && !token.isTempHidden);
}
