import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans, t } from "@lingui/macro";
import useSWR from "swr";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import TooltipComponent from "components/Tooltip/Tooltip";

import hexToRgba from "hex-to-rgba";
import { ethers } from "ethers";

import {
  USD_DECIMALS,
  AMP_DECIMALS,
  ALP_DECIMALS,
  BASIS_POINTS_DIVISOR,
  DEFAULT_MAX_USDG_AMOUNT,
  getPageTitle,
  importImage,
  arrayURLFetcher,
} from "lib/legacy";
import {
  useTotalAmpInLiquidity,
  useAmpPrice,
  useTotalAmpStaked,
  useTotalAmpSupply,
  useTradeVolumeHistory,
  usePositionStates,
  useTotalVolume,
  useFeesData,
  useVolumeData,
  formatNumber,
} from "domain/legacy";
// import useFeesSummary from "domain/useFeesSummary";

import { getContract } from "config/contracts";

import Vault from "abis/Vault.json";
import ReaderV2 from "abis/ReaderV2.json";
import AlpManager from "abis/AlpManager.json";
import Footer from "components/Footer/Footer";

import "./DashboardV2.css";

import poe40Icon from "img/ic_poe.svg";
import plp40Icon from "img/ic_plp.svg";

import AssetDropdown from "./AssetDropdown";
import ExternalLink from "components/ExternalLink/ExternalLink";
import SEO from "components/Common/SEO";
import StatsTooltip from "components/StatsTooltip/StatsTooltip";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { BSCTESTNET, getChainName, PUPPYNET } from "config/chains";
import { contractFetcher } from "lib/contracts";
import { useInfoTokens } from "domain/tokens";
import { getTokenBySymbol, getWhitelistedTokens, ALP_POOL_COLORS } from "config/tokens";
import { bigNumberify, expandDecimals, formatAmount, formatKeyAmount, numberWithCommas } from "lib/numbers";
import { useChainId } from "lib/chains";
import { formatDate } from "lib/dates";
import { ACTIVE_CHAIN_IDS } from "config/chains";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

const { AddressZero } = ethers.constants;

function getVolumeInfo(hourlyVolumes) {
  if (!hourlyVolumes || hourlyVolumes.length === 0) {
    return {};
  }
  const dailyVolumes = hourlyVolumes.map((hourlyVolume) => {
    const secondsPerHour = 60 * 60;
    const minTime = parseInt(Date.now() / 1000 / secondsPerHour) * secondsPerHour - 24 * secondsPerHour;
    const info = {};
    let totalVolume = bigNumberify(0);
    for (let i = 0; i < hourlyVolume.length; i++) {
      const item = hourlyVolume[i].data;
      if (parseInt(item.timestamp) < minTime) {
        break;
      }

      if (!info[item.token]) {
        info[item.token] = bigNumberify(0);
      }

      info[item.token] = info[item.token].add(item.volume);
      totalVolume = totalVolume.add(item.volume);
    }
    info.totalVolume = totalVolume;
    return info;
  });
  return dailyVolumes.reduce(
    (acc, cv, index) => {
      acc.totalVolume = acc.totalVolume.add(cv.totalVolume);
      acc[ACTIVE_CHAIN_IDS[index]] = cv;
      return acc;
    },
    { totalVolume: bigNumberify(0) }
  );
}

function getPositionStats(positionStats) {
  if (!positionStats || positionStats.length === 0) {
    return null;
  }
  return positionStats.reduce(
    (acc, cv, i) => {
      acc.totalLongPositionSizes = acc.totalLongPositionSizes.add(cv.totalLongPositionSizes);
      acc.totalShortPositionSizes = acc.totalShortPositionSizes.add(cv.totalShortPositionSizes);
      acc[ACTIVE_CHAIN_IDS[i]] = cv;
      return acc;
    },
    {
      totalLongPositionSizes: bigNumberify(0),
      totalShortPositionSizes: bigNumberify(0),
    }
  );
}

// function getCurrentFeesUsd(tokenAddresses, fees, infoTokens) {
//   if (!fees || !infoTokens) {
//     return bigNumberify(0);
//   }

//   let currentFeesUsd = bigNumberify(0);
//   for (let i = 0; i < tokenAddresses.length; i++) {
//     const tokenAddress = tokenAddresses[i];
//     const tokenInfo = infoTokens[tokenAddress];
//     if (!tokenInfo || !tokenInfo.contractMinPrice) {
//       continue;
//     }

//     const feeUsd = fees[i].mul(tokenInfo.contractMinPrice).div(expandDecimals(1, tokenInfo.decimals));
//     currentFeesUsd = currentFeesUsd.add(feeUsd);
//   }
//   return currentFeesUsd;
// }

export default function DashboardV2() {
  const { isConnected: active } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);
    }
  }, [walletProvider])
  const { chainId } = useChainId();
  // const totalVolume = useTotalVolume();
  const [totalVolume, totalVolumeDelta] = useVolumeData(chainId);

  const chainName = getChainName(chainId);
  // const { data: positionStats } = useSWR(
  //   ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/position_stats")),
  //   {
  //     fetcher: arrayURLFetcher,
  //   }
  // );
  const positionStats = usePositionStates(chainId);

  // const { data: hourlyVolumes } = useSWR(
  //   ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/hourly_volume")),
  //   {
  //     fetcher: arrayURLFetcher,
  //   }
  // );

  // const hourlyVolumes = useTradeVolumeHistory(chainId);
  // const dailyVolume = useVolumeData({from: parseInt(Date.now() / 1000) - 86400, to: parseInt(Date.now() / 1000) });

  let { total: totalAmpSupply } = useTotalAmpSupply(chainId);

  // const currentVolumeInfo = getVolumeInfo(hourlyVolumes);

  // const positionStatsInfo = getPositionStats(positionStats);
  const positionStatsInfo = positionStats;

  function getWhitelistedTokenAddresses(chainId) {
    const whitelistedTokens = getWhitelistedTokens(chainId);
    return whitelistedTokens.map((token) => token.address);
  }

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const visibleTokens = tokenList.filter((t) => !t.isTempHidden);

  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");
  const alpManagerAddress = getContract(chainId, "AlpManager");

  const ampAddress = getContract(chainId, "AMP");
  const alpAddress = getContract(chainId, "ALP");
  const usdgAddress = getContract(chainId, "USDG");
  
  const tokensForSupplyQuery = [ampAddress, alpAddress, usdgAddress];
  
  const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, alpManagerAddress, "getAums"], {
    fetcher: contractFetcher(library, AlpManager),
  });

  const { data: totalSupplies } = useSWR(
    [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
    {
      fetcher: contractFetcher(library, ReaderV2, [tokensForSupplyQuery]),
    }
  );

  const { data: totalTokenWeights } = useSWR(
    [`AlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: contractFetcher(library, Vault),
    }
  );

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  // const { data: currentFees } = useSWR(
  //   infoTokens[AddressZero].contractMinPrice // infoTokensArbitrum[AddressZero].contractMinPrice && infoTokensGoerli[AddressZero].contractMinPrice
  //     ? "Dashboard:currentFees"
  //     : null,
  //   {
  //     fetcher: () => {
  //       return Promise.all(
  //         ACTIVE_CHAIN_IDS.map((chainId) =>
  //           contractFetcher(null, ReaderV2, [getWhitelistedTokenAddresses(chainId)])(
  //             `Dashboard:fees:${chainId}`,
  //             chainId,
  //             getContract(chainId, "Reader"),
  //             "getFees",
  //             getContract(chainId, "Vault")
  //           )
  //         )
  //       ).then((fees) => {
  //         return fees.reduce(
  //           (acc, cv, i) => {
  //             const feeUSD = getCurrentFeesUsd(getWhitelistedTokenAddresses(ACTIVE_CHAIN_IDS[i]), cv, infoTokens);
  //             acc[ACTIVE_CHAIN_IDS[i]] = feeUSD;
  //             acc.total = acc.total.add(feeUSD);
  //             return acc;
  //           },
  //           { total: bigNumberify(0) }
  //         );
  //       });
  //     },
  //   }
  // );

  // const { data: feesSummaryByChain } = useFeesSummary();
  // const feesSummary = feesSummaryByChain[chainId];
  let eth
  if (chainId === PUPPYNET)
    eth = infoTokens[getTokenBySymbol(chainId, "WETH").address];
  else 
    eth = infoTokens[getTokenBySymbol(chainId, "WETH").address];

  // const shouldIncludeCurrrentFees =
  //   feesSummaryByChain[chainId].lastUpdatedAt &&
  //   parseInt(Date.now() / 1000) - feesSummaryByChain[chainId].lastUpdatedAt > 60 * 60;

  // const totalFees = ACTIVE_CHAIN_IDS.map((chainId) => {
  //   if (shouldIncludeCurrrentFees && currentFees && currentFees[chainId]) {
  //     return currentFees[chainId].div(expandDecimals(1, USD_DECIMALS)).add(feesSummaryByChain[chainId].totalFees || 0);
  //   }

  //   return feesSummaryByChain[chainId].totalFees || 0;
  // })
  //   .map((v) => Math.round(v))
  //   .reduce(
  //     (acc, cv, i) => {
  //       acc[ACTIVE_CHAIN_IDS[i]] = cv;
  //       acc.total = acc.total + cv;
  //       return acc;
  //     },
  //     { total: 0 }
  //   );
  const [totalFees, totalFeesDelta] = useFeesData(chainId);

  const { ampPrice } = useAmpPrice(chainId, library, active);

  let { total: totalAmpInLiquidity } = useTotalAmpInLiquidity(chainId, active);

  let { stakedAmpSupply: stakedAmpSupply, total: totalStakedAmp } = useTotalAmpStaked(chainId);

  let ampMarketCap;
  if (ampPrice && totalAmpSupply) {
    ampMarketCap = ampPrice.mul(totalAmpSupply).div(expandDecimals(1, AMP_DECIMALS));
  }

  let stakedAmpSupplyUsd;
  if (ampPrice && totalStakedAmp) {
    stakedAmpSupplyUsd = totalStakedAmp.mul(ampPrice).div(expandDecimals(1, AMP_DECIMALS));
  }

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  let alpPrice;
  let alpSupply;
  let alpMarketCap;
  if (aum && totalSupplies && totalSupplies[3]) {
    alpSupply = totalSupplies[3];
    alpPrice =
      aum && aum.gt(0) && alpSupply.gt(0)
        ? aum.mul(expandDecimals(1, ALP_DECIMALS)).div(alpSupply)
        : expandDecimals(1, USD_DECIMALS);
    alpMarketCap = alpPrice.mul(alpSupply).div(expandDecimals(1, ALP_DECIMALS));
  }
  let tvl;
  if (alpMarketCap && ampPrice && totalStakedAmp) {
    tvl = alpMarketCap.add(ampPrice.mul(totalStakedAmp).div(expandDecimals(1, AMP_DECIMALS)));
  }

  // const ethFloorPriceFund = expandDecimals(350 + 148 + 384, 18);
  // const alpFloorPriceFund = expandDecimals(660001, 18);
  // const usdcFloorPriceFund = expandDecimals(784598 + 200000, 30);
  const ethFloorPriceFund = expandDecimals(350, 18);
  const alpFloorPriceFund = expandDecimals(660, 18);
  const usdcFloorPriceFund = expandDecimals(784 + 200, 30);

  let totalFloorPriceFundUsd;

  if (eth && eth.contractMinPrice && alpPrice) {
    const ethFloorPriceFundUsd = ethFloorPriceFund.mul(eth.contractMinPrice).div(expandDecimals(1, eth.decimals));
    const alpFloorPriceFundUsd = alpFloorPriceFund.mul(alpPrice).div(expandDecimals(1, 18));

    totalFloorPriceFundUsd = ethFloorPriceFundUsd.add(alpFloorPriceFundUsd).add(usdcFloorPriceFund);
  }

  let adjustedUsdgSupply = bigNumberify(0);

  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdgAmount) {
      adjustedUsdgSupply = adjustedUsdgSupply.add(tokenInfo.usdgAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdgAmount ||
      !adjustedUsdgSupply ||
      adjustedUsdgSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
    // use add(1).div(10).mul(10) to round numbers up
    const targetWeightBps = tokenInfo.weight.mul(BASIS_POINTS_DIVISOR).div(totalTokenWeights).add(1).div(10).mul(10);

    const weightText = `${formatAmount(currentWeightBps, 2, 2, false)}% / ${formatAmount(
      targetWeightBps,
      2,
      2,
      false
    )}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        renderContent={() => {
          return (
            <>
              <StatsTooltipRow
                label={t`Current Weight`}
                value={`${formatAmount(currentWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <StatsTooltipRow
                label={t`Target Weight`}
                value={`${formatAmount(targetWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div className="text-black">
                  <Trans>
                    {tokenInfo.symbol} is below its target weight.
                    <br />
                    <br />
                    Get lower fees to{" "}
                    <Link to="/buy_mlp" target="_blank" rel="noopener noreferrer">
                      buy MLP
                    </Link>{" "}
                    with {tokenInfo.symbol},&nbsp; and to{" "}
                    <Link to="/trade" target="_blank" rel="noopener noreferrer">
                      swap
                    </Link>{" "}
                    {tokenInfo.symbol} for other tokens.
                  </Trans>
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div className="text-black">
                  <Trans>
                    {tokenInfo.symbol} is above its target weight.
                    <br />
                    <br />
                    Get lower fees to{" "}
                    <Link to="/trade" target="_blank" rel="noopener noreferrer">
                      swap
                    </Link>{" "}
                    tokens for {tokenInfo.symbol}.
                  </Trans>
                </div>
              )}
              <br />
              <div>
                <ExternalLink href="#">
                  <Trans>More Info</Trans>
                </ExternalLink>
              </div>
            </>
          );
        }}
      />
    );
  };

  let stakedPercent = 0;

  if (totalAmpSupply && !totalAmpSupply.isZero() && !totalStakedAmp.isZero()) {
    stakedPercent = totalStakedAmp.mul(100).div(totalAmpSupply).toNumber();
  }

  let liquidityPercent = 0;

  if (totalAmpSupply && !totalAmpSupply.isZero() && totalAmpInLiquidity) {
    liquidityPercent = totalAmpInLiquidity.mul(100).div(totalAmpSupply).toNumber();
  }

  let notStakedPercent = 100 - stakedPercent - liquidityPercent;

  let ampDistributionData = [
    {
      name: t`staked`,
      value: stakedPercent,
      color: "#4353fa",
    },
    {
      name: t`in liquidity`,
      value: liquidityPercent,
      color: "#0598fa",
    },
    {
      name: t`not staked`,
      value: notStakedPercent,
      color: "#ef6401",
    },
  ];

  let stableAlp = 0;
  let totalAlp = 0;

  let alpPool = tokenList.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo.usdgAmount && adjustedUsdgSupply && adjustedUsdgSupply.gt(0)) {
      const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
      if (tokenInfo.isStable) {
        stableAlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      }
      totalAlp += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return {
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      };
    }
    return null;
  });

  let stablePercentage = totalAlp > 0 ? ((stableAlp * 100) / totalAlp).toFixed(2) : "0.0";

  alpPool = alpPool.filter(function (element) {
    return element !== null;
  });

  alpPool = alpPool.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  ampDistributionData = ampDistributionData.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  const [ampActiveIndex, setAMPActiveIndex] = useState(null);

  const onAMPDistributionChartEnter = (_, index) => {
    setAMPActiveIndex(index);
  };

  const onAMPDistributionChartLeave = (_, index) => {
    setAMPActiveIndex(null);
  };

  const [alpActiveIndex, setALPActiveIndex] = useState(null);

  const onALPPoolChartEnter = (_, index) => {
    setALPActiveIndex(index);
  };

  const onALPPoolChartLeave = (_, index) => {
    setALPActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats-label">
          <div className="stats-label-color" style={{ backgroundColor: payload[0].color }}></div>
          {payload[0].value}% {payload[0].name}
        </div>
      );
    }

    return null;
  };

  return (
    <SEO title={getPageTitle("Dashboard")}>
      <div className="default-container DashboardV2 page-layout">
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content">
            <div className="Page-title font-kufam">
              <Trans>Stats</Trans>
              {/* {chainId === ARBITRUM && <img src={arbitrum24Icon} alt="arbitrum24Icon" width="50px" height="50px" />}
              {chainId === PEGASUS && <img src={pegasus24Icon} alt="pegasus24Icon" width="50px" height="50px" />} */}
            </div>
          </div>
        </div>
        <div className="DashboardV2-content">
          <div className="DashboardV2-cards">
            <div className="App-card">
              <div className="App-card-title font-kufam">
                <Trans>Overview</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>AUM</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(tvl, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => (
                        <span>{t`Assets Under Management: MJX staked (All chains) + MLP pool (${chainName})`}</span>
                        // <div>{t`Assets Under Management: AMP staked (All chains) + ALP pool (${chainName})`}</div>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>MLP Pool</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      handle={`$${formatAmount(aum, USD_DECIMALS, 0, true)}`}
                      position="right-bottom"
                      renderContent={() => <span>{t`Total value of tokens in MLP pool (${chainName})`}</span>}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>24h Volume</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      // handle={`$${formatAmount(currentVolumeInfo?.[chainId]?.totalVolume, 18, 0, true)}`}
                      handle={
                        totalVolumeDelta
                          ? `${formatNumber(totalVolumeDelta, { currency: true, compact: false })}`
                          : `$0`
                      }
                      renderContent={() => (
                        <StatsTooltip
                          title={t`Volume`}
                          baseValue={
                            totalVolumeDelta ? formatNumber(totalVolumeDelta, { currency: true, compact: false }) : `$0`
                          }
                          total={
                            totalVolumeDelta ? formatNumber(totalVolumeDelta, { currency: true, compact: false }) : `$0`
                          }
                          isFloatNum={true}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Long Positions</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(
                        // positionStatsInfo?.[chainId]?.totalLongPositionSizes,
                        positionStatsInfo?.totalLongPositionSizes,
                        30,
                        0,
                        true
                      )}`}
                      renderContent={() => (
                        <StatsTooltip
                          title={t`Long Positions`}
                          // arbitrumValue={positionStatsInfo?.[ARBITRUM].totalLongPositionSizes}
                          // goerliValue={positionStatsInfo?.totalLongPositionSizes}
                          baseValue={positionStatsInfo && positionStatsInfo.totalShortPositionSizes? positionStatsInfo.totalLongPositionSizes:bigNumberify(0)}
                          total={ethers.BigNumber.from("0x1").mul(positionStatsInfo && positionStatsInfo.totalShortPositionSizes? positionStatsInfo.totalLongPositionSizes:bigNumberify(0))}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Short Positions</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      handle={`$${formatAmount(
                        // positionStatsInfo?.[chainId]?.totalShortPositionSizes,
                        positionStatsInfo?.totalShortPositionSizes,
                        30,
                        0,
                        true
                      )}`}
                      renderContent={() => (
                        <StatsTooltip
                          title={t`Short Positions`}
                          // arbitrumValue={positionStatsInfo?.[ARBITRUM].totalShortPositionSizes}
                          // goerliValue={positionStatsInfo?.totalShortPositionSizes}
                          baseValue={positionStatsInfo && positionStatsInfo.totalShortPositionSizes ? positionStatsInfo.totalShortPositionSizes:bigNumberify(0)}
                          total={ethers.BigNumber.from("0x1").mul(positionStatsInfo && positionStatsInfo.totalShortPositionSizes ? positionStatsInfo.totalShortPositionSizes:bigNumberify(0))}
                        />
                      )}
                    />
                  </div>
                </div>
                {/* {feesSummary.lastUpdatedAt ? (
                  <div className="App-card-row">
                    <div className="label">
                      <Trans>Fees since</Trans> {formatDate(feesSummary.lastUpdatedAt)}
                    </div>
                    <div>
                      <TooltipComponent
                        position="right-bottom"
                        className="nowrap"
                        handle={`$${formatAmount(currentFees?.[chainId], USD_DECIMALS, 2, true)}`}
                        renderContent={() => (
                          <StatsTooltip
                            title={t`Fees`}
                            // goerliValue={currentFees?.[GOERLI_TESTNET]}
                            baseValue={currentFees?.[chainId]}
                            total={currentFees?.total}
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : null} */}
              </div>
            </div>
            <div className="App-card">
              <div className="App-card-title font-kufam">
                <Trans>Total Stats</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Total Fees</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      // handle={`$${numberWithCommas(totalFees?.[chainId])}`}
                      handle={totalFees ? `${formatNumber(totalFees, { currency: true, compact: false })}` : `$0`}
                      renderContent={() => (
                        <StatsTooltip
                          title={t`Total Fees`}
                          baseValue={totalFees ? formatNumber(totalFees, { currency: true, compact: false }) : `$0`}
                          total={totalFees ? formatNumber(totalFees, { currency: true, compact: false }) : `$0`}
                          decimalsForConversion={0}
                          isFloatNum={true}
                        />
                      )}
                      // renderContent={()=>{}}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Total Volume</Trans>
                  </div>
                  <div>
                    <TooltipComponent
                      position="right-bottom"
                      className="nowrap"
                      // handle={`$${formatAmount(totalVolume?.[chainId], USD_DECIMALS, 0, true)}`}
                      handle={totalVolume ? `${formatNumber(totalVolume, { currency: true, compact: false })}` : `$0`}
                      renderContent={() => (
                        <StatsTooltip
                          title={t`Total Volume`}
                          baseValue={totalVolume ? formatNumber(totalVolume, { currency: true, compact: false }) : `$0`}
                          total={totalVolume ? formatNumber(totalVolume, { currency: true, compact: false }) : `$0`}
                          isFloatNum={true}
                        />
                      )}
                    />
                  </div>
                </div>
                {/* <div className="App-card-row">
                  <div className="label">
                    <Trans>Floor Price Fund</Trans>
                  </div>
                  <div>${formatAmount(totalFloorPriceFundUsd, 30, 0, true)}</div>
                </div> */}
              </div>
            </div>
          </div>
          <div className="Tab-title-section">
            <div className="Page-title font-kufam">
              <Trans>Tokens</Trans>
              {/* {chainId === ARBITRUM && <img src={arbitrum24Icon} alt="arbitrum24Icon" width="50px" height="50px" />}
              {chainId === PEGASUS && <img src={pegasus24Icon} alt="pegasus24Icon" width="50px" height="50px" />} */}
            </div>
            <div className="Page-description">
              <Trans>Platform and MLP index tokens.</Trans>
            </div>
          </div>
          <div className="DashboardV2-token-cards">
            <div className="stats-wrapper stats-wrapper--amp">
              <div className="App-card">
                <div className="stats-block">
                  <div className="App-card-title">
                    <div className="App-card-title-mark">
                      <div className="App-card-title-mark-icon">
                        <img src={poe40Icon} alt="MJX Token Icon" width="35px" height="35px" />
                      </div>
                      <div className="App-card-title-mark-info">
                        <div className="App-card-title-mark-title">MJX</div>
                        <div className="App-card-title-mark-subtitle">MJX</div>
                      </div>
                      <div>
                        <AssetDropdown assetSymbol="AMP" />
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Price</Trans>
                      </div>
                      <div>
                        {!ampPrice && "..."}
                        {ampPrice && (
                          <TooltipComponent
                            position="right-bottom"
                            className="nowrap"
                            handle={"$" + formatAmount(ampPrice, USD_DECIMALS, 2, true)}
                            // handle={"1 CRO"}
                            renderContent={() => (
                              <>
                                <StatsTooltipRow
                                  label={`Price on ${chainName}`}
                                  value={formatAmount(ampPrice, USD_DECIMALS, 2, true)}
                                  showDollar={false}
                                />
                                {/* <StatsTooltipRow
                                  label={t`Price on Goerli`}
                                  value={formatAmount(ampPriceFromGoerli, USD_DECIMALS, 2, true)}
                                  showDollar={true}
                                /> */}
                              </>
                            )}
                          />
                        )}
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Supply</Trans>
                      </div>
                      <div>{formatAmount(totalAmpSupply, AMP_DECIMALS, 0, true)} MJX</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Total Staked</Trans>
                      </div>
                      <div>
                        <TooltipComponent
                          position="right-bottom"
                          className="nowrap"
                          handle={`$${formatAmount(stakedAmpSupplyUsd, USD_DECIMALS, 0, true)}`}
                          renderContent={() => (
                            <StatsTooltip
                              title={t`Staked`}
                              baseValue={stakedAmpSupply}
                              // goerliValue={goerliStakedAmp}
                              total={totalStakedAmp}
                              decimalsForConversion={AMP_DECIMALS}
                              showDollar={false}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Market Cap</Trans>
                      </div>
                      <div>${formatAmount(ampMarketCap, USD_DECIMALS, 0, true)}</div>
                    </div>
                  </div>
                </div>
                <div
                  className={ampDistributionData.length > 0 ? "stats-piechart" : ""}
                  onMouseLeave={onAMPDistributionChartLeave}
                >
                  {ampDistributionData.length > 0 && (
                    <PieChart width={210} height={210}>
                      <Pie
                        data={ampDistributionData}
                        cx={100}
                        cy={100}
                        innerRadius={73}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        onMouseEnter={onAMPDistributionChartEnter}
                        onMouseOut={onAMPDistributionChartLeave}
                        onMouseLeave={onAMPDistributionChartLeave}
                      >
                        {ampDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              filter:
                                ampActiveIndex === index
                                  ? `drop-shadow(0px 0px 6px ${hexToRgba(entry.color, 0.7)})`
                                  : "none",
                              cursor: "pointer",
                            }}
                            stroke={entry.color}
                            strokeWidth={ampActiveIndex === index ? 1 : 1}
                          />
                        ))}
                      </Pie>
                      <text x={"50%"} y={"50%"} fill="white" textAnchor="middle" dominantBaseline="middle">
                        <Trans>Distribution</Trans>
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  )}
                </div>
              </div>
              <div className="App-card">
                <div className="stats-block">
                  <div className="App-card-title">
                    <div className="App-card-title-mark">
                      <div className="App-card-title-mark-icon">
                        <img src={plp40Icon} alt="plp40Icon" width="35px" height="35px" />
                        {/* {chainId === PEGASUS ? (
                          <img src={pegasus16Icon} alt={t`Pegasus Icon`} className="selected-network-symbol" />
                        ) : (
                          <img src={pegasus16Icon} alt={t`Goerli Icon`} className="selected-network-symbol" />
                        )} */}
                      </div>
                      <div className="App-card-title-mark-info">
                        <div className="App-card-title-mark-title">MLP</div>
                        <div className="App-card-title-mark-subtitle">MLP</div>
                      </div>
                      <div>
                        <AssetDropdown assetSymbol="ALP" />
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Price</Trans>
                      </div>
                      <div>${formatAmount(alpPrice, USD_DECIMALS, 3, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Supply</Trans>
                      </div>
                      <div>{formatAmount(alpSupply, ALP_DECIMALS, 0, true)} MLP</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Total Staked</Trans>
                      </div>
                      <div>${formatAmount(alpMarketCap, USD_DECIMALS, 0, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Market Cap</Trans>
                      </div>
                      <div>${formatAmount(alpMarketCap, USD_DECIMALS, 0, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Trans>Stablecoin Percentage</Trans>
                      </div>
                      <div>{stablePercentage}%</div>
                    </div>
                  </div>
                </div>
                <div className={alpPool.length > 0 ? "stats-piechart" : ""} onMouseOut={onALPPoolChartLeave}>
                  {alpPool.length > 0 && (
                    <PieChart width={210} height={210}>
                      <Pie
                        data={alpPool}
                        cx={100}
                        cy={100}
                        innerRadius={73}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        onMouseEnter={onALPPoolChartEnter}
                        onMouseOut={onALPPoolChartLeave}
                        onMouseLeave={onALPPoolChartLeave}
                        paddingAngle={2}
                      >
                        {alpPool.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={ALP_POOL_COLORS[entry.name]}
                            style={{
                              filter:
                                alpActiveIndex === index
                                  ? `drop-shadow(0px 0px 6px ${hexToRgba(ALP_POOL_COLORS[entry.name], 0.7)})`
                                  : "none",
                              cursor: "pointer",
                            }}
                            stroke={ALP_POOL_COLORS[entry.name]}
                            strokeWidth={alpActiveIndex === index ? 1 : 1}
                          />
                        ))}
                      </Pie>
                      <text x={"50%"} y={"50%"} fill="white" textAnchor="middle" dominantBaseline="middle">
                        MLP Pool
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  )}
                </div>
              </div>
            </div>
            <div className="token-table-wrapper App-card">
              <div className="App-card-title font-kufam">
                <Trans>MLP Index Composition</Trans>{" "}
                {/* {chainId === ARBITRUM && <img src={arbitrum16Icon} alt={t`Arbitrum Icon`} />}
                {chainId === PEGASUS && <img src={pegasus16Icon} alt={t`Pegasus Icon`} />} */}
              </div>
              <div className="App-card-divider"></div>
              <table className="token-table">
                <thead>
                  <tr>
                    <th>
                      <Trans>TOKEN</Trans>
                    </th>
                    <th>
                      <Trans>PRICE</Trans>
                    </th>
                    <th>
                      <Trans>POOL</Trans>
                    </th>
                    <th>
                      <Trans>WEIGHT</Trans>
                    </th>
                    <th>
                      <Trans>UTILIZATION</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTokens.map((token) => {
                    const tokenInfo = infoTokens[token.address];
                    let utilization = bigNumberify(0);
                    if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                      utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                    }
                    let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                    if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                      maxUsdgAmount = tokenInfo.maxUsdgAmount;
                    }
                    const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.svg");

                    return (
                      <tr key={token.symbol}>
                        <td>
                          <div className="token-symbol-wrapper">
                            <div className="App-card-title-info">
                              <div className="App-card-title-info-icon">
                                <img src={tokenImage} alt={token.symbol} width="40px" />
                              </div>
                              <div className="App-card-title-info-text">
                                <div className="App-card-info-title">{token.name}</div>
                                <div className="App-card-info-subtitle">{token.symbol}</div>
                              </div>
                              <div>
                                <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          $
                          {formatKeyAmount(
                            tokenInfo,
                            "minPrice",
                            USD_DECIMALS,
                            token.symbol.includes("CRO") ? 4 : 2,
                            true
                          )}
                        </td>
                        <td>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  <StatsTooltipRow
                                    label={t`Pool Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Target Min Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Max ${tokenInfo.symbol} Capacity`}
                                    value={formatAmount(maxUsdgAmount, 18, 2, true)}
                                    showDollar={true}
                                  />
                                </>
                              );
                            }}
                          />
                        </td>
                        <td>{getWeightText(tokenInfo)}</td>
                        <td>{formatAmount(utilization, 2, 2, false)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="token-grid">
              {visibleTokens.map((token) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                  utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                }
                let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                  maxUsdgAmount = tokenInfo.maxUsdgAmount;
                }

                const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
                return (
                  <div className="App-card" key={token.symbol}>
                    <div className="App-card-title">
                      <div className="mobile-token-card">
                        <img src={tokenImage} alt={token.symbol} width="20px" />
                        <div className="token-symbol-text">{token.symbol}</div>
                        <div>
                          <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Price</Trans>
                        </div>
                        <div>
                          $
                          {formatKeyAmount(
                            tokenInfo,
                            "minPrice",
                            USD_DECIMALS,
                            token.symbol.includes("CRO") ? 4 : 2,
                            true
                          )}
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Pool</Trans>
                        </div>
                        <div>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 2, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  <StatsTooltipRow
                                    label={t`Pool Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Target Min Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 2, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Max ${tokenInfo.symbol} Capacity`}
                                    value={formatAmount(maxUsdgAmount, 18, 2, true)}
                                  />
                                </>
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Weight</Trans>
                        </div>
                        <div>{getWeightText(tokenInfo)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Utilization</Trans>
                        </div>
                        <div>{formatAmount(utilization, 2, 2, false)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
