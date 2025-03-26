import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Trans, t } from "@lingui/macro";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

import useSWR from "swr";
import { ethers } from "ethers";
import Tab from "../Tab/Tab";
import cx from "classnames";
import { getContract } from "config/contracts";
import {
  getBuyAlpToAmount,
  getBuyAlpFromAmount,
  getSellAlpFromAmount,
  getSellAlpToAmount,
  adjustForDecimals,
  ALP_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  ALP_COOLDOWN_DURATION,
  SECONDS_PER_YEAR,
  USDG_DECIMALS,
  PLACEHOLDER_ACCOUNT,
  importImage,
} from "lib/legacy";

import { useAmpPrice } from "domain/legacy";

import TokenSelector from "../Exchange/TokenSelector";
import BuyInputSection from "../BuyInputSection/BuyInputSection";
import Tooltip from "../Tooltip/Tooltip";

import ReaderV2 from "abis/ReaderV2.json";
import RewardReader from "abis/RewardReader.json";
import Vault from "abis/Vault.json";
import AlpManager from "abis/AlpManager.json";
import RewardTracker from "abis/RewardTracker.json";
import Vester from "abis/Vester.json";
import RewardRouter from "abis/RewardRouter.json";
import Token from "abis/Token.json";

import alp24Icon from "img/ic_alp.svg";
import plp40Icon from "img/ic_plp.svg";
import arrowIcon from "img/ic_convert_down.svg";

import "./AlpSwap.css";
import AssetDropdown from "pages/Dashboard/AssetDropdown";
import SwapErrorModal from "./SwapErrorModal";
import StatsTooltipRow from "../StatsTooltip/StatsTooltipRow";
import { ARBITRUM, BASE, getChainName, IS_NETWORK_DISABLED } from "config/chains";
import { callContract, contractFetcher } from "lib/contracts";
import { approveTokens, useInfoTokens } from "domain/tokens";
import { useLocalStorageByChainId } from "lib/localStorage";
import { helperToast } from "lib/helperToast";
import { getTokenInfo, getUsd } from "domain/tokens/utils";
import { bigNumberify, expandDecimals, formatAmount, formatAmountFree, formatKeyAmount, parseValue } from "lib/numbers";
import { getNativeToken, getToken, getTokens, getWhitelistedTokens, getWrappedToken } from "config/tokens";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";

const { AddressZero } = ethers.constants;

function getStakingData(stakingInfo) {
  if (!stakingInfo || stakingInfo.length === 0) {
    return;
  }

  const keys = ["stakedAlpTracker", "feeAlpTracker"];
  const data = {};
  const propsLength = 5;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      claimable: stakingInfo[i * propsLength],
      tokensPerInterval: stakingInfo[i * propsLength + 1],
      averageStakedAmounts: stakingInfo[i * propsLength + 2],
      cumulativeRewards: stakingInfo[i * propsLength + 3],
      totalSupply: stakingInfo[i * propsLength + 4],
    };
  }

  return data;
}

function getTooltipContent(managedUsd, tokenInfo, token) {
  return (
    <>
      <StatsTooltipRow
        label={t`Current Pool Amount`}
        value={[
          `$${formatAmount(managedUsd, USD_DECIMALS, 0, true)}`,
          `(${formatKeyAmount(tokenInfo, "poolAmount", token.decimals, 0, true)} ${token.symbol})`,
        ]}
      />
      <StatsTooltipRow label={t`Max Pool Capacity`} value={formatAmount(tokenInfo.maxUsdgAmount, 18, 0, true)} />
    </>
  );
}

export default function AlpSwap(props) {
  const {
    savedSlippageAmount,
    isBuying,
    setPendingTxns,
    connectWallet,
    setIsBuying,
    savedShouldDisableValidationForTesting,
  } = props;
  const history = useHistory();
  const swapLabel = isBuying ? "BuyAlp" : "SellAlp";
  const tabLabel = isBuying ? t`Buy ALP` : t`Sell ALP`;
  const { chainId } = useChainId();
  const tokens = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const visibleTokens = tokenList.filter((t) => !t.isTempHidden);
  const [swapValue, setSwapValue] = useState("");
  const [alpValue, setAlpValue] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${swapLabel}-swap-token-address`,
    AddressZero
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorOnSwapAmount, setAnchorOnSwapAmount] = useState(true);
  const [feeBasisPoints, setFeeBasisPoints] = useState("");
  const [modalError, setModalError] = useState(false);

  const readerAddress = getContract(chainId, "Reader");
  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const stakedAlpTrackerAddress = getContract(chainId, "StakedAlpTracker");
  const feeAlpTrackerAddress = getContract(chainId, "FeeAlpTracker");
  const usdgAddress = getContract(chainId, "USDG");
  const alpManagerAddress = getContract(chainId, "AlpManager");
  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const tokensForBalanceAndSupplyQuery = [stakedAlpTrackerAddress, usdgAddress];

  const tokenAddresses = tokens.map((token) => token.address);
  const { isConnected: active, address: account } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])

  const { data: tokenBalances } = useSWR(
    [`AlpSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, ReaderV2, [tokenAddresses]),
    }
  );


  // const { data: balance } = useSWR(
  //   [`Token:name:${active}`, chainId, 'address', "name"],
  //   {
  //     fetcher: contractFetcher(library, Token, []),
  //   }
  // );

  const { data: balancesAndSupplies } = useSWR(
    [
      `AlpSwap:getTokenBalancesWithSupplies:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, ReaderV2, [tokensForBalanceAndSupplyQuery]),
    }
  );

  

  const { data: aums } = useSWR([`AlpSwap:getAums:${active}`, chainId, alpManagerAddress, "getAums"], {
    fetcher: contractFetcher(library, AlpManager),
  });

  const { data: totalTokenWeights } = useSWR(
    [`AlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: contractFetcher(library, Vault),
    }
  );

  const tokenAllowanceAddress = swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
  const { data: tokenAllowance } = useSWR(
    [active, chainId, tokenAllowanceAddress, "allowance", account || PLACEHOLDER_ACCOUNT, alpManagerAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const { data: lastPurchaseTime } = useSWR(
    [`AlpSwap:lastPurchaseTime:${active}`, chainId, alpManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, AlpManager),
    }
  );

  const { data: alpBalance } = useSWR(
    [`AlpSwap:alpBalance:${active}`, chainId, feeAlpTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const alpVesterAddress = getContract(chainId, "AlpVester");
  const { data: reservedAmount } = useSWR(
    [`AlpSwap:reservedAmount:${active}`, chainId, alpVesterAddress, "pairAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, Vester),
    }
  );

  const { ampPrice } = useAmpPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);
  
  const rewardTrackersForStakingInfo = [stakedAlpTrackerAddress, feeAlpTrackerAddress];
  const { data: stakingInfo } = useSWR(
    [`AlpSwap:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const stakingData = getStakingData(stakingInfo);

  const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(ALP_COOLDOWN_DURATION) : undefined;
  
  const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

  const alpSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);
  const usdgSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
  let aum;
  if (aums && aums.length > 0) {
    aum = isBuying ? aums[0] : aums[1];
  }
  const alpPrice =
    aum && aum.gt(0) && alpSupply.gt(0)
      ? aum.mul(expandDecimals(1, ALP_DECIMALS)).div(alpSupply)
      : expandDecimals(1, USD_DECIMALS);
  
  let alpBalanceUsd;
  if (alpBalance) {
    alpBalanceUsd = alpBalance.mul(alpPrice).div(expandDecimals(1, ALP_DECIMALS));
  }
  const alpSupplyUsd = alpSupply.mul(alpPrice).div(expandDecimals(1, ALP_DECIMALS));

  let reserveAmountUsd;
  if (reservedAmount) {
    reserveAmountUsd = reservedAmount.mul(alpPrice).div(expandDecimals(1, ALP_DECIMALS));
  }

  let maxSellAmount = alpBalance;
  if (alpBalance && reservedAmount) {
    maxSellAmount = alpBalance.sub(reservedAmount);
  }

  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined);
  const swapToken = getToken(chainId, swapTokenAddress);
  const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

  const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

  const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
  const alpAmount = parseValue(alpValue, ALP_DECIMALS);

  const needApproval =
    isBuying && swapTokenAddress !== AddressZero && tokenAllowance && swapAmount && swapAmount.gt(tokenAllowance);

  const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
  const alpUsdMax = alpAmount && alpPrice ? alpAmount.mul(alpPrice).div(expandDecimals(1, ALP_DECIMALS)) : undefined;

  let isSwapTokenCapReached;
  if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdgAmount) {
    isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
      adjustForDecimals(swapTokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS)
    );
  }

  const onSwapValueChange = (e) => {
    setAnchorOnSwapAmount(true);
    setSwapValue(e.target.value);
  };

  const onAlpValueChange = (e) => {
    setAnchorOnSwapAmount(false);
    setAlpValue(e.target.value);
  };

  const onSelectSwapToken = (token) => {
    setSwapTokenAddress(token.address);
    setIsWaitingForApproval(false);
  };

  const nativeToken = getTokenInfo(infoTokens, AddressZero);

  let totalApr = bigNumberify(0);

  let feeAlpTrackerAnnualRewardsUsd;
  let feeAlpTrackerApr;
  if (
    stakingData &&
    stakingData.feeAlpTracker &&
    stakingData.feeAlpTracker.tokensPerInterval &&
    nativeToken &&
    nativeToken.minPrice &&
    alpSupplyUsd &&
    alpSupplyUsd.gt(0)
  ) {
    feeAlpTrackerAnnualRewardsUsd = stakingData.feeAlpTracker.tokensPerInterval
      .mul(SECONDS_PER_YEAR)
      .mul(nativeToken.minPrice)
      .div(expandDecimals(1, 18));
    feeAlpTrackerApr = feeAlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(alpSupplyUsd);
    totalApr = totalApr.add(feeAlpTrackerApr);
  }

  let stakedAlpTrackerAnnualRewardsUsd;
  let stakedAlpTrackerApr;

  if (
    ampPrice &&
    stakingData &&
    stakingData.stakedAlpTracker &&
    stakingData.stakedAlpTracker.tokensPerInterval &&
    alpSupplyUsd &&
    alpSupplyUsd.gt(0)
  ) {
    stakedAlpTrackerAnnualRewardsUsd = stakingData.stakedAlpTracker.tokensPerInterval
      .mul(SECONDS_PER_YEAR)
      .mul(ampPrice)
      .div(expandDecimals(1, 18));
    stakedAlpTrackerApr = stakedAlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(alpSupplyUsd);
    totalApr = totalApr.add(stakedAlpTrackerApr);
  }

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (anchorOnSwapAmount) {
        if (!swapAmount) {
          setAlpValue("");
          setFeeBasisPoints("");
          return;
        }
        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyAlpToAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            alpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, ALP_DECIMALS, ALP_DECIMALS);
          setAlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellAlpFromAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            alpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, ALP_DECIMALS, ALP_DECIMALS);
          setAlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        }

        return;
      }

      if (!alpAmount) {
        setSwapValue("");
        setFeeBasisPoints("");
        return;
      }

      if (swapToken) {
        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyAlpFromAmount(
            alpAmount,
            swapTokenAddress,
            infoTokens,
            alpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellAlpToAmount(
            alpAmount,
            swapTokenAddress,
            infoTokens,
            alpPrice,
            usdgSupply,
            totalTokenWeights,
            true
          );

          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        }
      }
    };

    updateSwapAmounts();
  }, [
    isBuying,
    anchorOnSwapAmount,
    swapAmount,
    alpAmount,
    swapToken,
    swapTokenAddress,
    infoTokens,
    alpPrice,
    usdgSupply,
    totalTokenWeights,
  ]);

  const switchSwapOption = (hash = "") => {
    history.push(`${history.location.pathname}#${hash}`);
    props.setIsBuying(hash === "redeem" ? false : true);
  };

  const fillMaxAmount = () => {
    if (isBuying) {
      setAnchorOnSwapAmount(true);
      setSwapValue(formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals));
      return;
    }

    setAnchorOnSwapAmount(false);
    setAlpValue(formatAmountFree(maxSellAmount, ALP_DECIMALS, ALP_DECIMALS));
  };

  const getError = () => {
    if (IS_NETWORK_DISABLED[chainId]) {
      if (isBuying) return [t`ALP buy disabled, pending ${getChainName(chainId)} upgrade`];
      return [t`ALP sell disabled, pending ${getChainName(chainId)} upgrade`];
    }

    if (!isBuying && inCooldownWindow) {
      return [t`Redemption time not yet reached`];
    }

    if (!swapAmount || swapAmount.eq(0)) {
      return [t`Enter an amount`];
    }
    if (!alpAmount || alpAmount.eq(0)) {
      return [t`Enter an amount`];
    }

    if (isBuying) {
      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        !savedShouldDisableValidationForTesting &&
        swapTokenInfo &&
        swapTokenInfo.balance &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.balance)
      ) {
        return [t`Insufficient ${swapTokenInfo.symbol} balance`];
      }

      if (swapTokenInfo.maxUsdgAmount && swapTokenInfo.usdgAmount && swapUsdMin) {
        const usdgFromAmount = adjustForDecimals(swapUsdMin, USD_DECIMALS, USDG_DECIMALS);
        const nextUsdgAmount = swapTokenInfo.usdgAmount.add(usdgFromAmount);
        if (swapTokenInfo.maxUsdgAmount.gt(0) && nextUsdgAmount.gt(swapTokenInfo.maxUsdgAmount)) {
          return [t`${swapTokenInfo.symbol} pool exceeded, try different token`, true];
        }
      }
    }

    if (!isBuying) {
      if (maxSellAmount && alpAmount && alpAmount.gt(maxSellAmount)) {
        return [t`Insufficient ALP balance`];
      }

      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.availableAmount &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.availableAmount)
      ) {
        return [t`Insufficient liquidity`];
      }
    }

    return [false];
  };

  const isPrimaryEnabled = () => {
    if (IS_NETWORK_DISABLED[chainId]) {
      return false;
    }
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (isBuying && isSwapTokenCapReached) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return t`Connect Wallet`;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return error;
    }
    if (isBuying && isSwapTokenCapReached) {
      return t`Max Capacity for ${swapToken.symbol} Reached`;
    }

    if (needApproval && isWaitingForApproval) {
      return t`Waiting for Approval`;
    }
    if (isApproving) {
      return t`Approving ${swapToken.symbol}...`;
    }
    if (needApproval) {
      return t`Approve ${swapToken.symbol}`;
    }

    if (isSubmitting) {
      return isBuying ? t`Buying...` : t`Selling...`;
    }

    return isBuying ? t`Buy ALP` : t`Sell ALP`;
  };

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: swapToken.address,
      spender: alpManagerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
    });
  };

  const buyAlp = () => {
    setIsSubmitting(true);

    const minAlp = alpAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "mintAndStakeGlpETH" : "mintAndStakeGlp";
    const params = swapTokenAddress === AddressZero ? [0, minAlp] : [swapTokenAddress, swapAmount, 0, minAlp];
    const value = swapTokenAddress === AddressZero ? swapAmount : 0;

    callContract(chainId, contract, method, params, {
      value,
      sentMsg: t`Buy submitted.`,
      failMsg: t`Buy failed.`,
      successMsg: t`${formatAmount(alpAmount, 18, 4, true)} ALP bought with ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const sellAlp = () => {
    setIsSubmitting(true);
    const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemGlpETH" : "unstakeAndRedeemGlp";
    const params =
      swapTokenAddress === AddressZero ? [alpAmount, minOut, account] : [swapTokenAddress, alpAmount, minOut, account];

    callContract(chainId, contract, method, params, {
      sentMsg: t`Sell submitted!`,
      failMsg: t`Sell failed.`,
      successMsg: t`${formatAmount(alpAmount, 18, 4, true)} ALP sold for ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onClickPrimary = () => {
    if (!active) {
      connectWallet();
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }

    const [, modal] = getError();

    if (modal) {
      setModalError(true);
      return;
    }

    if (isBuying) {
      buyAlp();
    } else {
      sellAlp();
    }
  };

  let payLabel = t`Pay`;
  let receiveLabel = t`Receive`;
  let payBalance = "$0.00";
  let receiveBalance = "$0.00";
  if (isBuying) {
    if (swapUsdMin) {
      payBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
    if (alpUsdMax) {
      receiveBalance = `$${formatAmount(alpUsdMax, USD_DECIMALS, 2, true)}`;
    }
  } else {
    if (alpUsdMax) {
      payBalance = `$${formatAmount(alpUsdMax, USD_DECIMALS, 2, true)}`;
    }
    if (swapUsdMin) {
      receiveBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
  }

  const selectToken = (token) => {
    setAnchorOnSwapAmount(false);
    setSwapTokenAddress(token.address);
    helperToast.success(t`${token.symbol} selected in order form`);
  };

  let feePercentageText = formatAmount(feeBasisPoints, 2, 2, true, "-");
  if (feeBasisPoints !== undefined && feeBasisPoints.toString().length > 0) {
    feePercentageText += "%";
  }

  const wrappedTokenSymbol = getWrappedToken(chainId).symbol;
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  const onSwapOptionChange = (opt) => {
    if (opt === t`Sell ALP`) {
      switchSwapOption("redeem");
    } else {
      switchSwapOption();
    }
  };

  return (
    <div className="AlpSwap">
      <SwapErrorModal
        isVisible={Boolean(modalError)}
        setIsVisible={setModalError}
        swapToken={swapToken}
        chainId={chainId}
        alpAmount={alpAmount}
        usdgSupply={usdgSupply}
        totalTokenWeights={totalTokenWeights}
        alpPrice={alpPrice}
        infoTokens={infoTokens}
        swapUsdMin={swapUsdMin}
      />
      {/* <div className="Page-title-section">
        <div className="Page-title">{isBuying ? "Buy ALP" : "Sell ALP"}</div>
        {isBuying && <div className="Page-description">
          Purchase <a href="https://amped.gitbook.io/amped/" target="_blank" rel="noopener noreferrer">ALP tokens</a> to earn {nativeTokenSymbol} fees from swaps and leverage trading.<br/>
          Note that there is a minimum holding time of 15 minutes after a purchase.<br/>
          <div>View <Link to="/earn">staking</Link> page.</div>
        </div>}
        {!isBuying && <div className="Page-description">
          Redeem your ALP tokens for any supported asset.
          {inCooldownWindow && <div>
            ALP tokens can only be redeemed 15 minutes after your most recent purchase.<br/>
            Your last purchase was at {formatDateTime(lastPurchaseTime)}, you can redeem ALP tokens after {formatDateTime(redemptionTime)}.<br/>
          </div>}
          <div>View <Link to="/earn">staking</Link> page.</div>
        </div>}
      </div> */}
      <div className="AlpSwap-content">
        <div className="App-card AlpSwap-stats-card">
          <div className="App-card-title">
            <div className="App-card-title-mark">
              <div className="App-card-title-mark-icon">
                <img src={plp40Icon} alt="plp40Icon" width="35px" height="35px" />
                {/* {chainId === BASE ? (
                  <img src={base16Icon} alt="base16Icon" className="selected-network-symbol" />
                ) : (
                  <img src={goerli16Icon} alt="goerli16Icon" className="selected-network-symbol" />
                )} */}
              </div>
              <div className="App-card-title-mark-info">
                <div className="App-card-title-mark-title">ALP</div>
                <div className="App-card-title-mark-subtitle">ALP</div>
              </div>
              <div>
                <AssetDropdown assetSymbol="ALP" />
              </div>
            </div>
          </div>
          <div className="App-card-divider" />
          <div className="App-card-content">
            <div className="App-card-row">
              <div className="label">
                <Trans>Price</Trans>
              </div>
              <div className="value">${formatAmount(alpPrice, USD_DECIMALS, 3, true)}</div>
            </div>
            <div className="App-card-row">
              <div className="label">
                <Trans>Wallet</Trans>
              </div>
              <div className="value">
                {formatAmount(alpBalance, ALP_DECIMALS, 4, true)} ALP ($
                {formatAmount(alpBalanceUsd, USD_DECIMALS, 2, true)})
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">
                <Trans>Staked</Trans>
              </div>
              <div className="value">
                {formatAmount(alpBalance, ALP_DECIMALS, 4, true)} ALP ($
                {formatAmount(alpBalanceUsd, USD_DECIMALS, 2, true)})
              </div>
            </div>
          </div>
          <div className="App-card-divider" />
          <div className="App-card-content">
            {!isBuying && (
              <div className="App-card-row">
                <div className="label">
                  <Trans>Reserved</Trans>
                </div>
                <div className="value">
                  <Tooltip
                    handle={`${formatAmount(reservedAmount, 18, 4, true)} ALP ($${formatAmount(
                      reserveAmountUsd,
                      USD_DECIMALS,
                      2,
                      true
                    )})`}
                    position="right-bottom"
                    renderContent={() =>
                      t`${formatAmount(reservedAmount, 18, 4, true)} ALP have been reserved for vesting.`
                    }
                  />
                </div>
              </div>
            )}
            <div className="App-card-row">
              <div className="label">
                <Trans>APR</Trans>
              </div>
              <div className="value">
                <Tooltip
                  handle={`${formatAmount(totalApr, 2, 2, true)}%`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        <StatsTooltipRow
                          label={t`${nativeTokenSymbol} (${wrappedTokenSymbol}) APR`}
                          value={`${formatAmount(feeAlpTrackerApr, 2, 2, false)}%`}
                          showDollar={false}
                        />
                        <StatsTooltipRow
                          label={t`Escrowed AMP APR`}
                          value={`${formatAmount(stakedAlpTrackerApr, 2, 2, false)}%`}
                          showDollar={false}
                        />
                      </>
                    );
                  }}
                />
              </div>
            </div>
            <div className="App-card-row">
              <div className="label">
                <Trans>Total Supply</Trans>
              </div>
              <div className="value">
                <Trans>
                  {formatAmount(alpSupply, ALP_DECIMALS, 4, true)} ALP ($
                  {formatAmount(alpSupplyUsd, USD_DECIMALS, 2, true)})
                </Trans>
              </div>
            </div>
          </div>
        </div>
        <div className="AlpSwap-box App-box">
          <Tab
            options={[t`Buy ALP`, t`Sell ALP`]}
            option={tabLabel}
            onChange={onSwapOptionChange}
            className="Exchange-swap-option-tabs"
          />
          {isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={t`Balance:`}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              showMaxButton={swapValue !== formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals)}
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              selectedToken={swapToken}
              balance={payBalance}
            >
              <TokenSelector
                label={t`Pay`}
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="AlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={t`Available:`}
              tokenBalance={`${formatAmount(maxSellAmount, ALP_DECIMALS, 4, true)}`}
              inputValue={alpValue}
              onInputValueChange={onAlpValueChange}
              showMaxButton={alpValue !== formatAmountFree(maxSellAmount, ALP_DECIMALS, ALP_DECIMALS)}
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              balance={payBalance}
              defaultTokenName={"ALP"}
            >
              <div className="selected-token">
                ALP <img src={alp24Icon} alt="alp24Icon" />
              </div>
            </BuyInputSection>
          )}

          <div className="AppOrder-ball-container">
            <div className="AppOrder-ball">
              <img
                src={arrowIcon}
                alt="arrowIcon"
                onClick={() => {
                  setIsBuying(!isBuying);
                  switchSwapOption(isBuying ? "redeem" : "");
                }}
              />
            </div>
          </div>

          {isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={t`Balance:`}
              tokenBalance={`${formatAmount(alpBalance, ALP_DECIMALS, 4, true)}`}
              inputValue={alpValue}
              onInputValueChange={onAlpValueChange}
              balance={receiveBalance}
              defaultTokenName={"ALP"}
            >
              <div className="selected-token">
              ALP <img src={alp24Icon} alt="alp24Icon" />
              </div>
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={t`Balance:`}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              balance={receiveBalance}
              selectedToken={swapToken}
            >
              <TokenSelector
                label={t`Receive`}
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="AlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}

          <div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">{feeBasisPoints > 50 ? t`WARNING: High Fees` : t`Fees`}</div>
              <div className="align-right fee-block">
                {isBuying && (
                  <Tooltip
                    handle={isBuying && isSwapTokenCapReached ? "NA" : feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      if (!feeBasisPoints) {
                        return (
                          <div className="text-white">
                            <Trans>Fees will be shown once you have entered an amount in the order form.</Trans>
                          </div>
                        );
                      }
                      return (
                        <div className="text-white">
                          {feeBasisPoints > 50 && <Trans>To reduce fees, select a different asset to pay with.</Trans>}
                          <Trans>Check the "Save on Fees" section below to get the lowest fee percentages.</Trans>
                        </div>
                      );
                    }}
                  />
                )}
                {!isBuying && (
                  <Tooltip
                    handle={feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      if (!feeBasisPoints) {
                        return (
                          <div className="text-white">
                            <Trans>Fees will be shown once you have entered an amount in the order form.</Trans>
                          </div>
                        );
                      }
                      return (
                        <div className="text-white">
                          {feeBasisPoints > 50 && <Trans>To reduce fees, select a different asset to receive.</Trans>}
                          <Trans>Check the "Save on Fees" section below to get the lowest fee percentages.</Trans>
                        </div>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="AlpSwap-cta Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      <div className="Tab-title-section">
        <div className="Page-title">
          <Trans>Save on Fees</Trans>
        </div>
        {isBuying && (
          <div className="Page-description">
            <Trans>
              Fees may vary depending on which asset you use to buy ALP. <br />
              Enter the amount of PLP you want to purchase in the order form, then check here to compare fees.
            </Trans>
          </div>
        )}
        {!isBuying && (
          <div className="Page-description">
            <Trans>
              Fees may vary depending on which asset you sell ALP for. <br />
              Enter the amount of ALP you want to redeem in the order form, then check here to compare fees.
            </Trans>
          </div>
        )}
      </div>
      <div className="AlpSwap-token-list">
        {/* <div className="AlpSwap-token-list-content"> */}
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
                {isBuying ? (
                  <Tooltip
                    handle={t`AVAILABLE`}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => (
                      <p className="text-white">
                        <Trans>Available amount to deposit into ALP.</Trans>
                      </p>
                    )}
                  />
                ) : (
                  <Tooltip
                    handle={t`AVAILABLE`}
                    tooltipIconPosition="right"
                    position="center-bottom text-none"
                    renderContent={() => {
                      return (
                        <p className="text-white">
                          <Trans>
                            Available amount to withdraw from ALP. Funds not utilized by current open positions.
                          </Trans>
                        </p>
                      );
                    }}
                  />
                )}
              </th>
              <th>
                <Trans>WALLET</Trans>
              </th>
              <th>
                <Tooltip
                  handle={t`FEES`}
                  tooltipIconPosition="right"
                  position="right-bottom text-none"
                  renderContent={() => {
                    return (
                      <div className="text-white">
                        <Trans>Fees will be shown once you have entered an amount in the order form.</Trans>
                      </div>
                    );
                  }}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleTokens.map((token) => {
              let tokenFeeBps;
              if (isBuying) {
                const { feeBasisPoints: feeBps } = getBuyAlpFromAmount(
                  alpAmount,
                  token.address,
                  infoTokens,
                  alpPrice,
                  usdgSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              } else {
                const { feeBasisPoints: feeBps } = getSellAlpToAmount(
                  alpAmount,
                  token.address,
                  infoTokens,
                  alpPrice,
                  usdgSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              }
              const tokenInfo = getTokenInfo(infoTokens, token.address);
            
              // if (tokenInfo === undefined) return;
              let managedUsd;
              if (tokenInfo && tokenInfo.managedUsd) {
                managedUsd = tokenInfo.managedUsd;
              }
              let availableAmountUsd;
              if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
                availableAmountUsd = tokenInfo.availableAmount
                  .mul(tokenInfo.minPrice)
                  .div(expandDecimals(1, token.decimals));
              } 
              let balanceUsd;
              if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
                balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
              }
              const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.svg");

              // if (tokenInfo === undefined) return;
              let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdgAmount);

              let amountLeftToDeposit = bigNumberify(0);
              if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                amountLeftToDeposit = tokenInfo.maxUsdgAmount
                  .sub(tokenInfo.usdgAmount)
                  .mul(expandDecimals(1, USD_DECIMALS))
                  .div(expandDecimals(1, USDG_DECIMALS));
              }
              if (amountLeftToDeposit.lt(0)) {
                amountLeftToDeposit = bigNumberify(0);
              }
              function renderFees() {
                const swapUrl = `https://app.1inch.io/#/${chainId}/swap/`;
                switch (true) {
                  case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                    return (
                      <Tooltip
                        handle="NA"
                        position="right-bottom"
                        renderContent={() => (
                          <div className="text-white">
                            <Trans>
                              Max pool capacity reached for {tokenInfo.symbol}
                              <br />
                              <br />
                              Please mint ALP using another token
                            </Trans>
                            <br />
                            <p>
                              <ExternalLink href={swapUrl}>
                                <Trans> Swap {tokenInfo.symbol} on 1inch</Trans>
                              </ExternalLink>
                            </p>
                          </div>
                        )}
                      />
                    );
                  case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                    return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${
                      tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                    }`;
                  default:
                    return "";
                }
              }

              return (
                <tr key={token.symbol}>
                  <td>
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
                  </td>
                  <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 4, true)}</td>
                  <td>
                    {isBuying && (
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit && amountLeftToDeposit.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => getTooltipContent(managedUsd, tokenInfo, token)}
                        />
                      </div>
                    )}
                    {!isBuying && (
                      <div>
                        <Tooltip
                          handle={
                            availableAmountUsd && availableAmountUsd.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => getTooltipContent(managedUsd, tokenInfo, token)}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                    {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                  </td>
                  <td>{renderFees()}</td>
                  <td>
                    <button
                      className={cx("App-button-option action-btn", isBuying ? "buying" : "selling")}
                      onClick={() => selectToken(token)}
                    >
                      {isBuying ? t`Buy with ${token.symbol}` : t`Sell for ${token.symbol}`}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="token-grid">
          {visibleTokens.map((token) => {
            let tokenFeeBps;
            if (isBuying) {
              const { feeBasisPoints: feeBps } = getBuyAlpFromAmount(
                alpAmount,
                token.address,
                infoTokens,
                alpPrice,
                usdgSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            } else {
              const { feeBasisPoints: feeBps } = getSellAlpToAmount(
                alpAmount,
                token.address,
                infoTokens,
                alpPrice,
                usdgSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            }
            const tokenInfo = getTokenInfo(infoTokens, token.address);
            
            let managedUsd;
            if (tokenInfo && tokenInfo.managedUsd) {
              managedUsd = tokenInfo.managedUsd;
            }
            let availableAmountUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
              availableAmountUsd = tokenInfo.availableAmount
                .mul(tokenInfo.minPrice)
                .div(expandDecimals(1, token.decimals));
            }
            let balanceUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
              balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
            }

            let amountLeftToDeposit = bigNumberify(0);
            // if (tokenInfo === undefined) return;
            if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
              amountLeftToDeposit = tokenInfo.maxUsdgAmount
                .sub(tokenInfo.usdgAmount)
                .mul(expandDecimals(1, USD_DECIMALS))
                .div(expandDecimals(1, USDG_DECIMALS));
            }
            if (amountLeftToDeposit.lt(0)) {
              amountLeftToDeposit = bigNumberify(0);
            }
            let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdgAmount);

            function renderFees() {
              switch (true) {
                case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                  return (
                    <Tooltip
                      handle="NA"
                      position="right-bottom"
                      renderContent={() => (
                        <Trans>
                          Max pool capacity reached for {tokenInfo.symbol}. Please mint ALP using another token
                        </Trans>
                      )}
                    />
                  );
                case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                  return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${
                    tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                  }`;
                default:
                  return "";
              }
            }
            const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
            return (
              <div className="App-card" key={token.symbol}>
                <div className="mobile-token-card">
                  <img src={tokenImage} alt={token.symbol} width="20px" />
                  <div className="token-symbol-text">{token.symbol}</div>
                  <div>
                    <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                  </div>
                </div>
                <div className="App-card-divider" />
                <div className="App-card-content">
                  <div className="App-card-row">
                    <div className="label">
                      <Trans>Price</Trans>
                    </div>
                    <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
                  </div>
                  {isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        handle="Available"
                        position="left-bottom"
                        renderContent={() => (
                          <p className="text-white">
                            <Trans>Available amount to deposit into ALP.</Trans>
                          </p>
                        )}
                      />
                      <div>
                        <Tooltip
                          handle={amountLeftToDeposit && `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`}
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => getTooltipContent(managedUsd, tokenInfo, token)}
                        />
                      </div>
                    </div>
                  )}
                  {!isBuying && (
                    <div className="App-card-row">
                      <div className="label">
                        <Tooltip
                          handle={t`Available`}
                          position="left-bottom"
                          renderContent={() => {
                            return (
                              <p className="text-white">
                                <Trans>
                                  Available amount to withdraw from ALP. Funds not utilized by current open positions.
                                </Trans>
                              </p>
                            );
                          }}
                        />
                      </div>

                      <div>
                        <Tooltip
                          handle={
                            availableAmountUsd && availableAmountUsd.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => getTooltipContent(managedUsd, tokenInfo, token)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="App-card-row">
                    <div className="label">
                      <Trans>Wallet</Trans>
                    </div>
                    <div>
                      {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                      {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div>
                      {tokenFeeBps ? (
                        t`Fees`
                      ) : (
                        <Tooltip
                          handle="Fees"
                          renderContent={() => (
                            <p className="text-white">
                              <Trans>Fees will be shown once you have entered an amount in the order form.</Trans>
                            </p>
                          )}
                        />
                      )}
                    </div>
                    <div>{renderFees()}</div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    {isBuying && (
                      <button className="App-button-option App-card-option" onClick={() => selectToken(token)}>
                        <Trans>Buy with {token.symbol}</Trans>
                      </button>
                    )}
                    {!isBuying && (
                      <button className="App-button-option App-card-option" onClick={() => selectToken(token)}>
                        <Trans>Sell for {token.symbol}</Trans>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
