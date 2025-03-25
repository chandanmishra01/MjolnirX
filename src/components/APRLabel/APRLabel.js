import React from "react";

import useSWR from "swr";

import {
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
} from "lib/legacy";

import Vault from "abis/Vault.json";
import ReaderV2 from "abis/ReaderV2.json";
import RewardReader from "abis/RewardReader.json";
import Token from "abis/Token.json";
import AlpManager from "abis/AlpManager.json";

import { useAmpPrice } from "domain/legacy";

import { getContract } from "config/contracts";
import { contractFetcher } from "lib/contracts";
import { formatKeyAmount } from "lib/numbers";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

export default function APRLabel({ chainId, label }) {
  const { isConnected: active } = useWeb3ModalAccount()

  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const ampAddress = getContract(chainId, "AMP");
  const esAmpAddress = getContract(chainId, "ES_AMP");
  const bnAmpAddress = getContract(chainId, "BN_AMP");
  const alpAddress = getContract(chainId, "ALP");

  const stakedAmpTrackerAddress = getContract(chainId, "StakedAmpTracker");
  const bonusAmpTrackerAddress = getContract(chainId, "BonusAmpTracker");
  const feeAmpTrackerAddress = getContract(chainId, "FeeAmpTracker");

  const stakedAlpTrackerAddress = getContract(chainId, "StakedAlpTracker");
  const feeAlpTrackerAddress = getContract(chainId, "FeeAlpTracker");

  const alpManagerAddress = getContract(chainId, "AlpManager");

  const ampVesterAddress = getContract(chainId, "AmpVester");
  const alpVesterAddress = getContract(chainId, "AlpVester");

  const vesterAddresses = [ampVesterAddress, alpVesterAddress];

  const walletTokens = [ampAddress, esAmpAddress, alpAddress, stakedAmpTrackerAddress];
  const depositTokens = [
    ampAddress,
    esAmpAddress,
    stakedAmpTrackerAddress,
    bonusAmpTrackerAddress,
    bnAmpAddress,
    alpAddress,
  ];
  const rewardTrackersForDepositBalances = [
    stakedAmpTrackerAddress,
    stakedAmpTrackerAddress,
    bonusAmpTrackerAddress,
    feeAmpTrackerAddress,
    feeAmpTrackerAddress,
    feeAlpTrackerAddress,
  ];
  const rewardTrackersForStakingInfo = [
    stakedAmpTrackerAddress,
    bonusAmpTrackerAddress,
    feeAmpTrackerAddress,
    stakedAlpTrackerAddress,
    feeAlpTrackerAddress,
  ];

  const { data: walletBalances } = useSWR(
    [`StakeV2:walletBalances:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [`StakeV2:depositBalances:${active}`, chainId, rewardReaderAddress, "getDepositBalances", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedAmpSupply } = useSWR(
    [`StakeV2:stakedAmpSupply:${active}`, chainId, ampAddress, "balanceOf", stakedAmpTrackerAddress],
    {
      fetcher: contractFetcher(undefined, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, alpManagerAddress, "getAums"], {
    fetcher: contractFetcher(undefined, AlpManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: contractFetcher(undefined, Vault),
    }
  );

  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, ReaderV2, [vesterAddresses]),
    }
  );

  const { ampPrice } = useAmpPrice(chainId, {}, active);

  // const ampSupplyUrl = getServerUrl(chainId, "/amp_supply");
  // const { data: ampSupply } = useSWR([ampSupplyUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.text()),
  // });

  const { data: ampSupply } = useSWR(
    [`APRLabel:ampSupply:${active}`, chainId, ampAddress, "totalSupply"],
    {
      fetcher: contractFetcher(undefined, Token),
    }
  );

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);
  const vestingData = getVestingData(vestingInfo);

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    vestingData,
    aum,
    nativeTokenPrice,
    stakedAmpSupply,
    ampPrice,
    ampSupply
  );
  return <span className="text-main">{`${formatKeyAmount(processedData, label, 2, 2, true)}%`}</span>;
}
