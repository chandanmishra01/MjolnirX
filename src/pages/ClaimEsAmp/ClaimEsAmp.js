import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { ethers } from "ethers";
import { PLACEHOLDER_ACCOUNT } from "lib/legacy";

import { getContract } from "config/contracts";

import Token from "abis/Token.json";
import RewardReader from "abis/RewardReader.json";

import Checkbox from "components/Checkbox/Checkbox";

import "./ClaimEsAmp.css";

import pegasusIcon from "img/ic_pegasus.png";

import { Trans, t } from "@lingui/macro";
import { ARBITRUM, PEGASUS, getExplorerUrl } from "config/chains";
import { callContract, contractFetcher } from "lib/contracts";
import { bigNumberify, formatAmount, formatAmountFree, parseValue } from "lib/numbers";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

const VEST_WITH_AMP_ARB = "VEST_WITH_AMP_ARB";
const VEST_WITH_ALP_ARB = "VEST_WITH_ALP_ARB";
const VEST_WITH_AMP_PEGASUS = "VEST_WITH_AMP_PEGASUS";
const VEST_WITH_ALP_PEGASUS = "VEST_WITH_ALP_PEGASUS";

export function getVestingDataV2(vestingInfo) {
  if (!vestingInfo || vestingInfo.length === 0) {
    return;
  }

  const keys = ["ampVester", "alpVester"];
  const data = {};
  const propsLength = 12;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      pairAmount: vestingInfo[i * propsLength],
      vestedAmount: vestingInfo[i * propsLength + 1],
      escrowedBalance: vestingInfo[i * propsLength + 2],
      claimedAmounts: vestingInfo[i * propsLength + 3],
      claimable: vestingInfo[i * propsLength + 4],
      maxVestableAmount: vestingInfo[i * propsLength + 5],
      combinedAverageStakedAmount: vestingInfo[i * propsLength + 6],
      cumulativeReward: vestingInfo[i * propsLength + 7],
      transferredCumulativeReward: vestingInfo[i * propsLength + 8],
      bonusReward: vestingInfo[i * propsLength + 9],
      averageStakedAmount: vestingInfo[i * propsLength + 10],
      transferredAverageStakedAmount: vestingInfo[i * propsLength + 11],
    };

    data[key + "PairAmount"] = data[key].pairAmount;
    data[key + "VestedAmount"] = data[key].vestedAmount;
    data[key + "EscrowedBalance"] = data[key].escrowedBalance;
    data[key + "ClaimSum"] = data[key].claimedAmounts.add(data[key].claimable);
    data[key + "Claimable"] = data[key].claimable;
    data[key + "MaxVestableAmount"] = data[key].maxVestableAmount;
    data[key + "CombinedAverageStakedAmount"] = data[key].combinedAverageStakedAmount;
    data[key + "CumulativeReward"] = data[key].cumulativeReward;
    data[key + "TransferredCumulativeReward"] = data[key].transferredCumulativeReward;
    data[key + "BonusReward"] = data[key].bonusReward;
    data[key + "AverageStakedAmount"] = data[key].averageStakedAmount;
    data[key + "TransferredAverageStakedAmount"] = data[key].transferredAverageStakedAmount;
  }

  return data;
}

function getVestingValues({ minRatio, amount, vestingDataItem }) {
  if (!vestingDataItem || !amount || amount.eq(0)) {
    return;
  }

  let currentRatio = bigNumberify(0);

  const ratioMultiplier = 10000;
  const maxVestableAmount = vestingDataItem.maxVestableAmount;
  const nextMaxVestableEsAmp = maxVestableAmount.add(amount);

  const combinedAverageStakedAmount = vestingDataItem.combinedAverageStakedAmount;
  if (maxVestableAmount.gt(0)) {
    currentRatio = combinedAverageStakedAmount.mul(ratioMultiplier).div(maxVestableAmount);
  }

  const transferredCumulativeReward = vestingDataItem.transferredCumulativeReward;
  const nextTransferredCumulativeReward = transferredCumulativeReward.add(amount);
  const cumulativeReward = vestingDataItem.cumulativeReward;
  const totalCumulativeReward = cumulativeReward.add(nextTransferredCumulativeReward);

  let nextCombinedAverageStakedAmount = combinedAverageStakedAmount;

  if (combinedAverageStakedAmount.lt(totalCumulativeReward.mul(minRatio))) {
    const averageStakedAmount = vestingDataItem.averageStakedAmount;
    let nextTransferredAverageStakedAmount = totalCumulativeReward.mul(minRatio);
    nextTransferredAverageStakedAmount = nextTransferredAverageStakedAmount.sub(
      averageStakedAmount.mul(cumulativeReward).div(totalCumulativeReward)
    );
    nextTransferredAverageStakedAmount = nextTransferredAverageStakedAmount
      .mul(totalCumulativeReward)
      .div(nextTransferredCumulativeReward);

    nextCombinedAverageStakedAmount = averageStakedAmount
      .mul(cumulativeReward)
      .div(totalCumulativeReward)
      .add(nextTransferredAverageStakedAmount.mul(nextTransferredCumulativeReward).div(totalCumulativeReward));
  }

  const nextRatio = nextCombinedAverageStakedAmount.mul(ratioMultiplier).div(nextMaxVestableEsAmp);

  const initialStakingAmount = currentRatio.mul(maxVestableAmount);
  const nextStakingAmount = nextRatio.mul(nextMaxVestableEsAmp);

  return {
    maxVestableAmount,
    currentRatio,
    nextMaxVestableEsAmp,
    nextRatio,
    initialStakingAmount,
    nextStakingAmount,
  };
}

export default function ClaimEsAmp({ setPendingTxns }) {
  const { isConnected: active, address: account } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])
  const { chainId } = useChainId();
  const [selectedOption, setSelectedOption] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [value, setValue] = useState("");

  const isPegasus = chainId === PEGASUS;

  const esAmpIouAddress = getContract(chainId, "ES_AMP_IOU");

  const { data: esAmpIouBalance } = useSWR(
    isPegasus && [
      `ClaimEsAmp:esAmpIouBalance:${active}`,
      chainId,
      esAmpIouAddress,
      "balanceOf",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const arbRewardReaderAddress = getContract(ARBITRUM, "RewardReader");
  const pegasusRewardReaderAddress = getContract(PEGASUS, "RewardReader");

  const arbVesterAdddresses = [getContract(ARBITRUM, "AmpVester"), getContract(ARBITRUM, "AlpVester")];
  const pegasusVesterAdddresses = [getContract(PEGASUS, "AmpVester"), getContract(PEGASUS, "AlpVester")];

  const { data: arbVestingInfo } = useSWR(
    [
      `StakeV2:vestingInfo:${active}`,
      ARBITRUM,
      arbRewardReaderAddress,
      "getVestingInfoV2",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(undefined, RewardReader, [arbVesterAdddresses]),
    }
  );

  const { data: pegasusVestingInfo } = useSWR(
    [
      `StakeV2:vestingInfo:${active}`,
      PEGASUS,
      pegasusRewardReaderAddress,
      "getVestingInfoV2",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(undefined, RewardReader, [pegasusVesterAdddresses]),
    }
  );

  const arbVestingData = getVestingDataV2(arbVestingInfo);
  const pegasusVestingData = getVestingDataV2(pegasusVestingInfo);

  let amount = parseValue(value, 18);

  let maxVestableAmount;
  let currentRatio;

  let nextMaxVestableEsAmp;
  let nextRatio;

  let initialStakingAmount;
  let nextStakingAmount;

  let stakingToken = "staked AMP";

  const shouldShowStakingAmounts = false;

  if (selectedOption === VEST_WITH_AMP_ARB && arbVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(4),
      amount,
      vestingDataItem: arbVestingData.ampVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsAmp, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }
  }

  if (selectedOption === VEST_WITH_ALP_ARB && arbVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(320),
      amount,
      vestingDataItem: arbVestingData.alpVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsAmp, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }

    stakingToken = "ALP";
  }

  if (selectedOption === VEST_WITH_ALP_PEGASUS && pegasusVestingData) {
    const result = getVestingValues({
      minRatio: bigNumberify(320),
      amount,
      vestingDataItem: pegasusVestingData.alpVester,
    });

    if (result) {
      ({ maxVestableAmount, currentRatio, nextMaxVestableEsAmp, nextRatio, initialStakingAmount, nextStakingAmount } =
        result);
    }

    stakingToken = "ALP";
  }

  const getError = () => {
    if (!active) {
      return t`Wallet not connected`;
    }

    if (esAmpIouBalance && esAmpIouBalance.eq(0)) {
      return t`No esAMP to claim`;
    }

    if (!amount || amount.eq(0)) {
      return t`Enter an amount`;
    }

    if (selectedOption === "") {
      return t`Select an option`;
    }

    return false;
  };

  const error = getError();

  const getPrimaryText = () => {
    if (error) {
      return error;
    }

    if (isClaiming) {
      return t`Claiming...`;
    }

    return t`Claim`;
  };

  const isPrimaryEnabled = () => {
    return !error && !isClaiming;
  };

  const claim = () => {
    setIsClaiming(true);

    let receiver;

    if (selectedOption === VEST_WITH_AMP_ARB) {
      receiver = "0x544a6ec142Aa9A7F75235fE111F61eF2EbdC250a";
    }

    if (selectedOption === VEST_WITH_ALP_ARB) {
      receiver = "0x9d8f6f6eE45275A5Ca3C6f6269c5622b1F9ED515";
    }

    if (selectedOption === VEST_WITH_AMP_PEGASUS) {
      receiver = "0x5d2E4189d0b273d7E7C289311978a0183B96C404";
    }

    if (selectedOption === VEST_WITH_ALP_PEGASUS) {
      receiver = "0x5d2E4189d0b273d7E7C289311978a0183B96C404";
    }

    const contract = new ethers.Contract(esAmpIouAddress, Token.abi, library.getSigner());
    callContract(chainId, contract, "transfer", [receiver, amount], {
      sentMsg: t`Claim submitted!`,
      failMsg: t`Claim failed.`,
      successMsg: t`Claim completed!`,
      setPendingTxns,
    })
      .then(async (res) => {})
      .finally(() => {
        setIsClaiming(false);
      });
  };

  return (
    <div className="ClaimEsAmp Page page-layout">
      <div className="Page-title-section mt-0">
        <div className="Page-title">
          <Trans>Claim esAMP</Trans>
        </div>
        {!isPegasus && (
          <div className="Page-description">
            <br />
            <Trans>Please switch your network to Pegasus.</Trans>
          </div>
        )}
        {isPegasus && (
          <div>
            <div className="Page-description">
              <br />
              <Trans>You have {formatAmount(esAmpIouBalance, 18, 2, true)} esAMP (IOU) tokens.</Trans>
              <br />
              <br />
              <Trans>The address of the esAMP (IOU) token is {esAmpIouAddress}.</Trans>
              <br />
              <Trans>
                The esAMP (IOU) token is transferrable. You can add the token to your wallet and send it to another
                address to claim if you'd like.
              </Trans>
              <br />
              <br />
              <Trans>Select your vesting option below then click "Claim".</Trans>
              <br />
              <Trans>
                After claiming, the esAMP tokens will be airdropped to your account on the selected network within 7
                days.
              </Trans>
              <br />
              <Trans>The esAMP tokens can be staked or vested at any time.</Trans>
              <br />
              <Trans>
                Your esAMP (IOU) balance will decrease by your claim amount after claiming, this is expected behaviour.
              </Trans>
              <br />
              <Trans>
                You can check your claim history{" "}
                <ExternalLink href={`${getExplorerUrl(PEGASUS)}token/${esAmpIouAddress}?a=${account}`}>here</ExternalLink>.
              </Trans>
            </div>
            <br />
            <div className="ClaimEsAmp-vesting-options">
              <Checkbox
                className="base btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_AMP_ARB}
                setIsChecked={() => setSelectedOption(VEST_WITH_AMP_ARB)}
              >
                <div className="ClaimEsAmp-option-label">
                  <Trans>Vest with AMP on Pegasus</Trans>
                </div>
                <img src={pegasusIcon} alt="Pegasus" />
              </Checkbox>
              <Checkbox
                className="base btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_ALP_ARB}
                setIsChecked={() => setSelectedOption(VEST_WITH_ALP_ARB)}
              >
                <div className="ClaimEsAmp-option-label">
                  <Trans>Vest with ALP on Pegasus</Trans>
                </div>
                <img src={pegasusIcon} alt="Pegasus" />
              </Checkbox>
              {/* <Checkbox
                className="goerli btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_AMP_GOERLI}
                setIsChecked={() => setSelectedOption(VEST_WITH_AMP_GOERLI)}
              >
                <div className="ClaimEsAmp-option-label">
                  <Trans>Vest with AMP on Goerli</Trans>
                </div>
                <img src={goerliIcon} alt="Goerli" />
              </Checkbox>
              <Checkbox
                className="goerli btn btn-primary btn-left btn-lg"
                isChecked={selectedOption === VEST_WITH_ALP_GOERLI}
                setIsChecked={() => setSelectedOption(VEST_WITH_ALP_GOERLI)}
              >
                <div className="ClaimEsAmp-option-label goerli">
                  <Trans>Vest with ALP on Goerli</Trans>
                </div>
                <img src={goerliIcon} alt="Goerli" />
              </Checkbox> */}
            </div>
            <br />
            {!error && (
              <div className="muted">
                <Trans>
                  You can currently vest a maximum of {formatAmount(maxVestableAmount, 18, 2, true)} esAMP tokens at a
                  ratio of {formatAmount(currentRatio, 4, 2, true)} {stakingToken} to 1 esAMP.
                </Trans>
                {shouldShowStakingAmounts && `${formatAmount(initialStakingAmount, 18, 2, true)}.`}
                <br />
                <Trans>
                  After claiming you will be able to vest a maximum of {formatAmount(nextMaxVestableEsAmp, 18, 2, true)}{" "}
                  esAMP at a ratio of {formatAmount(nextRatio, 4, 2, true)} {stakingToken} to 1 esAMP.
                </Trans>
                {shouldShowStakingAmounts && `${formatAmount(nextStakingAmount, 18, 2, true)}.`}
                <br />
                <br />
              </div>
            )}
            <div>
              <div className="ClaimEsAmp-input-label muted">
                <Trans>Amount to claim</Trans>
              </div>
              <div className="ClaimEsAmp-input-container">
                <input type="number" placeholder="0.0" value={value} onChange={(e) => setValue(e.target.value)} />
                {value !== formatAmountFree(esAmpIouBalance, 18, 18) && (
                  <div
                    className="ClaimEsAmp-max-button"
                    onClick={() => setValue(formatAmountFree(esAmpIouBalance, 18, 18))}
                  >
                    <Trans>MAX</Trans>
                  </div>
                )}
              </div>
            </div>
            <br />
            <div>
              <button className="App-cta Exchange-swap-button" disabled={!isPrimaryEnabled()} onClick={() => claim()}>
                {getPrimaryText()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
