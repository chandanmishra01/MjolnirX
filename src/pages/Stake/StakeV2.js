import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import Modal from "components/Modal/Modal";
import Checkbox from "components/Checkbox/Checkbox";
import Tooltip from "components/Tooltip/Tooltip";
import Footer from "components/Footer/Footer";

import Vault from "abis/Vault.json";
import ReaderV2 from "abis/ReaderV2.json";
import Vester from "abis/Vester.json";
import RewardRouter from "abis/RewardRouter.json";
import RewardReader from "abis/RewardReader.json";
import Token from "abis/Token.json";
import AlpManager from "abis/AlpManager.json";

import { ethers } from "ethers";
import {
  ALP_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
  getPageTitle,
} from "lib/legacy";
import { useAmpPrice, useTotalAmpStaked, useTotalAmpSupply } from "domain/legacy";
import { PEGASUS, getChainName, getConstant } from "config/chains";

import useSWR from "swr";

import { getContract } from "config/contracts";

import "./StakeV2.css";
import SEO from "components/Common/SEO";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { callContract, contractFetcher } from "lib/contracts";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { helperToast } from "lib/helperToast";
import { approveTokens } from "domain/tokens";
import { bigNumberify, expandDecimals, formatAmount, formatAmountFree, formatKeyAmount, parseValue } from "lib/numbers";
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

const { AddressZero } = ethers.constants;

function StakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    active,
    account,
    library,
    stakingTokenSymbol,
    stakingTokenAddress,
    farmAddress,
    rewardRouterAddress,
    stakeMethodName,
    setPendingTxns,
  } = props;
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { data: tokenAllowance } = useSWR(
    active && stakingTokenAddress && [active, chainId, stakingTokenAddress, "allowance", account, farmAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  let amount = parseValue(value, 18);
  const needApproval = farmAddress !== AddressZero && tokenAllowance && amount && amount.gt(tokenAllowance);

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return t`Enter an amount`;
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: stakingTokenAddress,
        spender: farmAddress,
        chainId,
      });
      return;
    }

    setIsStaking(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(chainId, contract, stakeMethodName, [amount], {
      sentMsg: t`Stake submitted!`,
      failMsg: t`Stake failed.`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsStaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isStaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isApproving) {
      return t`Approving ${stakingTokenSymbol}...`;
    }
    if (needApproval) {
      return t`Approve ${stakingTokenSymbol}`;
    }
    if (isStaking) {
      return t`Staking...`;
    }
    return t`Stake`;
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">
                <Trans>Stake</Trans>
              </div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">{stakingTokenSymbol}</div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function UnstakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    library,
    unstakingTokenSymbol,
    rewardRouterAddress,
    unstakeMethodName,
    multiplierPointsAmount,
    reservedAmount,
    bonusAmpInFeeAmp,
    setPendingTxns,
  } = props;
  const [isUnstaking, setIsUnstaking] = useState(false);

  let amount = parseValue(value, 18);
  let burnAmount;

  if (
    multiplierPointsAmount &&
    multiplierPointsAmount.gt(0) &&
    amount &&
    amount.gt(0) &&
    bonusAmpInFeeAmp &&
    bonusAmpInFeeAmp.gt(0)
  ) {
    burnAmount = multiplierPointsAmount.mul(amount).div(bonusAmpInFeeAmp);
  }

  const shouldShowReductionAmount = true;
  let rewardReductionBasisPoints;
  if (burnAmount && bonusAmpInFeeAmp) {
    rewardReductionBasisPoints = burnAmount.mul(BASIS_POINTS_DIVISOR).div(bonusAmpInFeeAmp);
  }

  const getError = () => {
    if (!amount) {
      return t`Enter an amount`;
    }
    if (amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
  };

  const onClickPrimary = () => {
    setIsUnstaking(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(chainId, contract, unstakeMethodName, [amount], {
      sentMsg: t`Unstake submitted!`,
      failMsg: t`Unstake failed.`,
      successMsg: t`Unstake completed!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsUnstaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isUnstaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isUnstaking) {
      return t`Unstaking...`;
    }
    return t`Unstake`;
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">
                <Trans>Unstake</Trans>
              </div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">{unstakingTokenSymbol}</div>
          </div>
        </div>
        {reservedAmount && reservedAmount.gt(0) && (
          <div className="Modal-note">
            You have {formatAmount(reservedAmount, 18, 2, true)} tokens reserved for vesting.
          </div>
        )}
        {burnAmount && burnAmount.gt(0) && rewardReductionBasisPoints && rewardReductionBasisPoints.gt(0) && (
          <div className="Modal-note">
            Unstaking will burn&nbsp;
            <a href="https://amped.gitbook.io/amped/rewards" target="_blank" rel="noopener noreferrer">
              {formatAmount(burnAmount, 18, 4, true)} Multiplier Points
            </a>
            .&nbsp;
            {shouldShowReductionAmount && (
              <span>Boost Percentage: -{formatAmount(rewardReductionBasisPoints, 2, 2)}%.</span>
            )}
          </div>
        )}
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VesterDepositModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    balance,
    vestedAmount,
    averageStakedAmount,
    maxVestableAmount,
    library,
    stakeTokenLabel,
    reserveAmount,
    maxReserveAmount,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);

  let amount = parseValue(value, 18);

  let nextReserveAmount = reserveAmount;

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  let additionalReserveAmount = bigNumberify(0);
  if (amount && averageStakedAmount && maxVestableAmount && maxVestableAmount.gt(0)) {
    nextReserveAmount = nextDepositAmount.mul(averageStakedAmount).div(maxVestableAmount);
    if (nextReserveAmount.gt(reserveAmount)) {
      additionalReserveAmount = nextReserveAmount.sub(reserveAmount);
    }
  }

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return t`Enter an amount`;
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
    if (nextReserveAmount.gt(maxReserveAmount)) {
      return t`Insufficient staked tokens`;
    }
  };

  const onClickPrimary = () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "deposit", [amount], {
      sentMsg: t`Deposit submitted!`,
      failMsg: t`Deposit failed!`,
      successMsg: t`Deposited!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsDepositing(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isDepositing) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isDepositing) {
      return t`Depositing...`;
    }
    return t`Deposit`;
  };

  return (
    <SEO title={getPageTitle("Earn")}>
      <div className="StakeModal">
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title} className="non-scrollable">
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                <div className="Exchange-swap-usd">
                  <Trans>Deposit</Trans>
                </div>
              </div>
              <div
                className="muted align-right clickable"
                onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
              >
                <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
              </div>
            </div>
            <div className="Exchange-swap-section-bottom">
              <div>
                <input
                  type="number"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="PositionEditor-token-symbol">esAMP</div>
            </div>
          </div>
          <div className="VesterDepositModal-info-rows">
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Wallet</Trans>
              </div>
              <div className="align-right">{formatAmount(balance, 18, 2, true)} esAMP</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Vault Capacity</Trans>
              </div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(nextDepositAmount, 18, 2, true)} / ${formatAmount(
                    maxVestableAmount,
                    18,
                    2,
                    true
                  )}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <div>
                        <p className="text-white">
                          <Trans>Vault Capacity for your Account:</Trans>
                        </p>
                        <StatsTooltipRow
                          showDollar={false}
                          label={t`Deposited`}
                          value={`${formatAmount(vestedAmount, 18, 2, true)} esAMP`}
                        />
                        <StatsTooltipRow
                          showDollar={false}
                          label={t`Max Capacity`}
                          value={`${formatAmount(maxVestableAmount, 18, 2, true)} esAMP`}
                        />
                      </div>
                    );
                  }}
                />
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Reserve Amount</Trans>
              </div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(
                    reserveAmount && reserveAmount.gte(additionalReserveAmount)
                      ? reserveAmount
                      : additionalReserveAmount,
                    18,
                    2,
                    true
                  )} / ${formatAmount(maxReserveAmount, 18, 2, true)}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        <StatsTooltipRow
                          label={t`Current Reserved`}
                          value={formatAmount(reserveAmount, 18, 2, true)}
                          showDollar={false}
                        />
                        <StatsTooltipRow
                          label={t`Additional reserve required`}
                          value={formatAmount(additionalReserveAmount, 18, 2, true)}
                          showDollar={false}
                        />
                        {amount && nextReserveAmount.gt(maxReserveAmount) && (
                          <>
                            <br />
                            <Trans>
                              You need a total of at least {formatAmount(nextReserveAmount, 18, 2, true)}{" "}
                              {stakeTokenLabel} to vest {formatAmount(amount, 18, 2, true)} esAMP.
                            </Trans>
                          </>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      </div>
    </SEO>
  );
}

function VesterWithdrawModal(props) {
  const { isVisible, setIsVisible, chainId, title, library, vesterAddress, setPendingTxns } = props;
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const onClickPrimary = () => {
    setIsWithdrawing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "withdraw", [], {
      sentMsg: t`Withdraw submitted.`,
      failMsg: t`Withdraw failed.`,
      successMsg: t`Withdrawn!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsWithdrawing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <Trans>
          <div>
            This will withdraw and unreserve all tokens as well as pause vesting.
            <br />
            <br />
            esAMP tokens that have been converted to AMP will remain as AMP tokens.
            <br />
            <br />
            To claim AMP tokens without withdrawing, use the "Claim" button under the Total Rewards section.
            <br />
            <br />
          </div>
        </Trans>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={isWithdrawing}>
            {!isWithdrawing && "Confirm Withdraw"}
            {isWithdrawing && "Confirming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CompoundModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    active,
    account,
    library,
    chainId,
    setPendingTxns,
    totalVesterRewards,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isCompounding, setIsCompounding] = useState(false);
  const [shouldClaimAmp, setShouldClaimAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-amp"],
    true
  );
  const [shouldStakeAmp, setShouldStakeAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-amp"],
    true
  );
  const [shouldClaimEsAmp, setShouldClaimEsAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-es-amp"],
    true
  );
  const [shouldStakeEsAmp, setShouldStakeEsAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-es-amp"],
    true
  );
  const [shouldStakeMultiplierPoints, setShouldStakeMultiplierPoints] = useState(true);
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-convert-weth"],
    true
  );

  const ampAddress = getContract(chainId, "AMP");
  const stakedAmpTrackerAddress = getContract(chainId, "StakedAmpTracker");

  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, ampAddress, "allowance", account, stakedAmpTrackerAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const needApproval = shouldStakeAmp && tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding;
  };

  const getPrimaryText = () => {
    if (isApproving) {
      return t`Approving AMP...`;
    }
    if (needApproval) {
      return t`Approve AMP`;
    }
    if (isCompounding) {
      return t`Compounding...`;
    }
    return t`Compound`;
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: ampAddress,
        spender: stakedAmpTrackerAddress,
        chainId,
      });
      return;
    }

    setIsCompounding(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimAmp || shouldStakeAmp,
        shouldStakeAmp,
        shouldClaimEsAmp || shouldStakeEsAmp,
        shouldStakeEsAmp,
        shouldStakeMultiplierPoints,
        shouldClaimWeth || shouldConvertWeth,
        shouldConvertWeth,
      ],
      {
        sentMsg: t`Compound submitted!`,
        failMsg: t`Compound failed.`,
        successMsg: t`Compound completed!`,
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsCompounding(false);
      });
  };

  const toggleShouldStakeAmp = (value) => {
    if (value) {
      setShouldClaimAmp(true);
    }
    setShouldStakeAmp(value);
  };

  const toggleShouldStakeEsAmp = (value) => {
    if (value) {
      setShouldClaimEsAmp(true);
    }
    setShouldStakeEsAmp(value);
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={t`Compound Rewards`}>
        <div className="CompoundModal-menu">
          <div>
            <Checkbox
              isChecked={shouldStakeMultiplierPoints}
              setIsChecked={setShouldStakeMultiplierPoints}
              disabled={true}
            >
              <Trans>Stake Multiplier Points</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimAmp} setIsChecked={setShouldClaimAmp} disabled={shouldStakeAmp}>
              <Trans>Claim AMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldStakeAmp} setIsChecked={toggleShouldStakeAmp}>
              <Trans>Stake AMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsAmp} setIsChecked={setShouldClaimEsAmp} disabled={shouldStakeEsAmp}>
              <Trans>Claim esAMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldStakeEsAmp} setIsChecked={toggleShouldStakeEsAmp}>
              <Trans>Stake esAMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth}>
              <Trans>Claim {wrappedTokenSymbol} Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              <Trans>
                Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
              </Trans>
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ClaimModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    library,
    chainId,
    setPendingTxns,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isClaiming, setIsClaiming] = useState(false);
  const [shouldClaimAmp, setShouldClaimAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-amp"],
    true
  );
  const [shouldClaimEsAmp, setShouldClaimEsAmp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-es-amp"],
    true
  );
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-convert-weth"],
    true
  );

  const isPrimaryEnabled = () => {
    return !isClaiming;
  };

  const getPrimaryText = () => {
    if (isClaiming) {
      return t`Claiming...`;
    }
    return t`Claim`;
  };

  const onClickPrimary = () => {
    setIsClaiming(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimAmp,
        false, // shouldStakeAmp
        shouldClaimEsAmp,
        false, // shouldStakeEsAmp
        false, // shouldStakeMultiplierPoints
        shouldClaimWeth,
        shouldConvertWeth,
      ],
      {
        sentMsg: t`Claim submitted.`,
        failMsg: t`Claim failed.`,
        successMsg: t`Claim completed!`,
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={t`Claim Rewards`}>
        <div className="CompoundModal-menu">
          <div>
            <Checkbox isChecked={shouldClaimAmp} setIsChecked={setShouldClaimAmp}>
              <Trans>Claim AMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsAmp} setIsChecked={setShouldClaimEsAmp}>
              <Trans>Claim esAMP Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth}>
              <Trans>Claim {wrappedTokenSymbol} Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              <Trans>
                Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
              </Trans>
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function StakeV2({ setPendingTxns, connectWallet }) {
  const { isConnected: active, address: account } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);

  const [isStakeModalVisible, setIsStakeModalVisible] = useState(false);
  const [stakeModalTitle, setStakeModalTitle] = useState("");
  const [stakeModalMaxAmount, setStakeModalMaxAmount] = useState(undefined);
  const [stakeValue, setStakeValue] = useState("");
  const [stakingTokenSymbol, setStakingTokenSymbol] = useState("");
  const [stakingTokenAddress, setStakingTokenAddress] = useState("");
  const [stakingFarmAddress, setStakingFarmAddress] = useState("");
  const [stakeMethodName, setStakeMethodName] = useState("");

  const [isUnstakeModalVisible, setIsUnstakeModalVisible] = useState(false);
  const [unstakeModalTitle, setUnstakeModalTitle] = useState("");
  const [unstakeModalMaxAmount, setUnstakeModalMaxAmount] = useState(undefined);
  const [unstakeModalReservedAmount, setUnstakeModalReservedAmount] = useState(undefined);
  const [unstakeValue, setUnstakeValue] = useState("");
  const [unstakingTokenSymbol, setUnstakingTokenSymbol] = useState("");
  const [unstakeMethodName, setUnstakeMethodName] = useState("");

  const [isVesterDepositModalVisible, setIsVesterDepositModalVisible] = useState(false);
  const [vesterDepositTitle, setVesterDepositTitle] = useState("");
  const [vesterDepositStakeTokenLabel, setVesterDepositStakeTokenLabel] = useState("");
  const [vesterDepositMaxAmount, setVesterDepositMaxAmount] = useState("");
  const [vesterDepositBalance, setVesterDepositBalance] = useState("");
  const [vesterDepositEscrowedBalance, setVesterDepositEscrowedBalance] = useState("");
  const [vesterDepositVestedAmount, setVesterDepositVestedAmount] = useState("");
  const [vesterDepositAverageStakedAmount, setVesterDepositAverageStakedAmount] = useState("");
  const [vesterDepositMaxVestableAmount, setVesterDepositMaxVestableAmount] = useState("");
  const [vesterDepositValue, setVesterDepositValue] = useState("");
  const [vesterDepositReserveAmount, setVesterDepositReserveAmount] = useState("");
  const [vesterDepositMaxReserveAmount, setVesterDepositMaxReserveAmount] = useState("");
  const [vesterDepositAddress, setVesterDepositAddress] = useState("");

  const [isVesterWithdrawModalVisible, setIsVesterWithdrawModalVisible] = useState(false);
  const [vesterWithdrawTitle, setVesterWithdrawTitle] = useState(false);
  const [vesterWithdrawAddress, setVesterWithdrawAddress] = useState("");

  const [isCompoundModalVisible, setIsCompoundModalVisible] = useState(false);
  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);

  const rewardRouterAddress = getContract(chainId, "RewardRouter");
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

  const stakedAmpDistributorAddress = getContract(chainId, "StakedAmpDistributor");
  const stakedAlpDistributorAddress = getContract(chainId, "StakedAlpDistributor");

  const ampVesterAddress = getContract(chainId, "AmpVester");
  const alpVesterAddress = getContract(chainId, "AlpVester");

  const vesterAddresses = [ampVesterAddress, alpVesterAddress];

  const excludedEsAmpAccounts = [stakedAmpDistributorAddress, stakedAlpDistributorAddress];

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

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
    [
      `StakeV2:walletBalances:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [
      `StakeV2:depositBalances:${active}`,
      chainId,
      rewardReaderAddress,
      "getDepositBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedAmpSupply } = useSWR(
    [`StakeV2:stakedAmpSupply:${active}`, chainId, ampAddress, "balanceOf", stakedAmpTrackerAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, alpManagerAddress, "getAums"], {
    fetcher: contractFetcher(library, AlpManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: contractFetcher(library, Vault),
    }
  );

  const { data: esAmpSupply } = useSWR(
    [`StakeV2:esAmpSupply:${active}`, chainId, readerAddress, "getTokenSupply", esAmpAddress],
    {
      fetcher: contractFetcher(library, ReaderV2, [excludedEsAmpAccounts]),
    }
  );
  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, ReaderV2, [vesterAddresses]),
    }
  );

  const { ampPrice } = useAmpPrice(
    chainId,
    { pegasus: chainId === PEGASUS ? library : undefined },
    active
  );

  let { total: totalAmpSupply } = useTotalAmpSupply(chainId);

  let { total: totalAmpStaked } = useTotalAmpStaked(chainId);
  
  // const ampSupplyUrl = getServerUrl(chainId, "/amp_supply");
  // const { data: ampSupply } = useSWR([ampSupplyUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.text()),
  // });

  
  const { data: ampSupply } = useSWR(
    [`StakeV2:ampSupply:${active}`, chainId, ampAddress, "balanceOf", account],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const isAmpTransferEnabled = true;

  let esAmpSupplyUsd;
  if (esAmpSupply && ampPrice) {
    esAmpSupplyUsd = esAmpSupply.mul(ampPrice).div(expandDecimals(1, 18));
  }

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

  let hasMultiplierPoints = false;
  let multiplierPointsAmount;
  if (processedData && processedData.bonusAmpTrackerRewards && processedData.bnAmpInFeeAmp) {
    multiplierPointsAmount = processedData.bonusAmpTrackerRewards.add(processedData.bnAmpInFeeAmp);
    if (multiplierPointsAmount.gt(0)) {
      hasMultiplierPoints = true;
    }
  }
  let totalRewardTokens;
  if (processedData && processedData.bnAmpInFeeAmp && processedData.bonusAmpInFeeAmp) {
    totalRewardTokens = processedData.bnAmpInFeeAmp.add(processedData.bonusAmpInFeeAmp);
  }

  let totalRewardTokensAndAlp;
  if (totalRewardTokens && processedData && processedData.alpBalance) {
    totalRewardTokensAndAlp = totalRewardTokens.add(processedData.alpBalance);
  }

  const bonusAmpInFeeAmp = processedData ? processedData.bonusAmpInFeeAmp : undefined;

  let stakedAmpSupplyUsd;
  if (ampPrice) {
    stakedAmpSupplyUsd = totalAmpStaked.mul(ampPrice).div(expandDecimals(1, 18));
  }
  
  let totalSupplyUsd;
  if (totalAmpSupply && ampPrice) {
    totalSupplyUsd = totalAmpSupply.mul(ampPrice).div(expandDecimals(1, 18));
  }

  let maxUnstakeableAmp = bigNumberify(0);
  if (
    totalRewardTokens &&
    vestingData &&
    vestingData.ampVesterPairAmount &&
    multiplierPointsAmount &&
    processedData.bonusAmpInFeeAmp
  ) {
    const availableTokens = totalRewardTokens.sub(vestingData.ampVesterPairAmount);
    const stakedTokens = processedData.bonusAmpInFeeAmp;
    const divisor = multiplierPointsAmount.add(stakedTokens);
    if (divisor.gt(0)) {
      maxUnstakeableAmp = availableTokens.mul(stakedTokens).div(divisor);
    }
  }

  const showStakeAmpModal = () => {
    if (!isAmpTransferEnabled) {
      helperToast.error(t`AMP transfers not yet enabled`);
      return;
    }

    setIsStakeModalVisible(true);
    setStakeModalTitle(t`Stake AMP`);
    setStakeModalMaxAmount(processedData.ampBalance);
    setStakeValue("");
    setStakingTokenSymbol("AMP");
    setStakingTokenAddress(ampAddress);
    setStakingFarmAddress(stakedAmpTrackerAddress);
    setStakeMethodName("stakeGmx");
  };

  const showStakeEsAmpModal = () => {
    setIsStakeModalVisible(true);
    setStakeModalTitle(t`Stake esAMP`);
    setStakeModalMaxAmount(processedData.esAmpBalance);
    setStakeValue("");
    setStakingTokenSymbol("esAMP");
    setStakingTokenAddress(esAmpAddress);
    setStakingFarmAddress(AddressZero);
    setStakeMethodName("stakeEsAmp");
  };

  const showAmpVesterDepositModal = () => {
    let remainingVestableAmount = vestingData.ampVester.maxVestableAmount.sub(vestingData.ampVester.vestedAmount);
    if (processedData.esAmpBalance.lt(remainingVestableAmount)) {
      remainingVestableAmount = processedData.esAmpBalance;
    }

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle(t`AMP Vault`);
    setVesterDepositStakeTokenLabel("staked AMP + esAMP + Multiplier Points");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esAmpBalance);
    setVesterDepositEscrowedBalance(vestingData.ampVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.ampVester.vestedAmount);
    setVesterDepositMaxVestableAmount(vestingData.ampVester.maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.ampVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.ampVester.pairAmount);
    setVesterDepositMaxReserveAmount(totalRewardTokens);
    setVesterDepositValue("");
    setVesterDepositAddress(ampVesterAddress);
  };

  const showAlpVesterDepositModal = () => {
    let remainingVestableAmount = vestingData.alpVester.maxVestableAmount.sub(vestingData.alpVester.vestedAmount);
    if (processedData.esAmpBalance.lt(remainingVestableAmount)) {
      remainingVestableAmount = processedData.esAmpBalance;
    }

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle(t`ALP Vault`);
    setVesterDepositStakeTokenLabel("staked ALP");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esAmpBalance);
    setVesterDepositEscrowedBalance(vestingData.alpVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.alpVester.vestedAmount);
    setVesterDepositMaxVestableAmount(vestingData.alpVester.maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.alpVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.alpVester.pairAmount);
    setVesterDepositMaxReserveAmount(processedData.alpBalance);
    setVesterDepositValue("");
    setVesterDepositAddress(alpVesterAddress);
  };

  const showAmpVesterWithdrawModal = () => {
    if (!vestingData || !vestingData.ampVesterVestedAmount || vestingData.ampVesterVestedAmount.eq(0)) {
      helperToast.error(t`You have not deposited any tokens for vesting.`);
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle(t`Withdraw from AMP Vault`);
    setVesterWithdrawAddress(ampVesterAddress);
  };

  const showAlpVesterWithdrawModal = () => {
    if (!vestingData || !vestingData.alpVesterVestedAmount || vestingData.alpVesterVestedAmount.eq(0)) {
      helperToast.error(t`You have not deposited any tokens for vesting.`);
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle(t`Withdraw from ALP Vault`);
    setVesterWithdrawAddress(alpVesterAddress);
  };

  const showUnstakeAmpModal = () => {
    if (!isAmpTransferEnabled) {
      helperToast.error(t`AMP transfers not yet enabled`);
      return;
    }
    setIsUnstakeModalVisible(true);
    setUnstakeModalTitle(t`Unstake AMP`);
    let maxAmount = processedData.ampInStakedAmp;
    if (
      processedData.ampInStakedAmp &&
      vestingData &&
      vestingData.ampVesterPairAmount.gt(0) &&
      maxUnstakeableAmp &&
      maxUnstakeableAmp.lt(processedData.ampInStakedAmp)
    ) {
      maxAmount = maxUnstakeableAmp;
    }
    setUnstakeModalMaxAmount(maxAmount);
    setUnstakeModalReservedAmount(vestingData.ampVesterPairAmount);
    setUnstakeValue("");
    setUnstakingTokenSymbol("AMP");
    setUnstakeMethodName("unstakeGmx");
  };

  const showUnstakeEsAmpModal = () => {
    setIsUnstakeModalVisible(true);
    setUnstakeModalTitle(t`Unstake esAMP`);
    let maxAmount = processedData.esAmpInStakedAmp;
    if (
      processedData.esAmpInStakedAmp &&
      vestingData &&
      vestingData.ampVesterPairAmount.gt(0) &&
      maxUnstakeableAmp &&
      maxUnstakeableAmp.lt(processedData.esAmpInStakedAmp)
    ) {
      maxAmount = maxUnstakeableAmp;
    }
    setUnstakeModalMaxAmount(maxAmount);
    setUnstakeModalReservedAmount(vestingData.ampVesterPairAmount);
    setUnstakeValue("");
    setUnstakingTokenSymbol("esAMP");
    setUnstakeMethodName("unstakeEsAmp");
  };

  const renderMultiplierPointsLabel = useCallback(() => {
    return t`Multiplier Points APR`;
  }, []);

  const renderMultiplierPointsValue = useCallback(() => {
    return (
      <Tooltip
        handle={`100.00%`}
        position="right-bottom"
        renderContent={() => {
          return (
            <Trans>
              Boost your rewards with Multiplier Points.&nbsp;
              <a href="https://amped.gitbook.io/amped/rewards#multiplier-points" rel="noreferrer" target="_blank">
                More info
              </a>
              .
            </Trans>
          );
        }}
      />
    );
  }, []);

  let earnMsg;
  if (totalRewardTokensAndAlp && totalRewardTokensAndAlp.gt(0)) {
    let ampAmountStr;
    if (processedData.ampInStakedAmp && processedData.ampInStakedAmp.gt(0)) {
      ampAmountStr = formatAmount(processedData.ampInStakedAmp, 18, 2, true) + " AMP";
    }
    let esAmpAmountStr;
    if (processedData.esAmpInStakedAmp && processedData.esAmpInStakedAmp.gt(0)) {
      esAmpAmountStr = formatAmount(processedData.esAmpInStakedAmp, 18, 2, true) + " esAMP";
    }
    let mpAmountStr;
    if (processedData.bonusAmpInFeeAmp && processedData.bnAmpInFeeAmp.gt(0)) {
      mpAmountStr = formatAmount(processedData.bnAmpInFeeAmp, 18, 2, true) + " MP";
    }
    let alpStr;
    if (processedData.alpBalance && processedData.alpBalance.gt(0)) {
      alpStr = formatAmount(processedData.alpBalance, 18, 2, true) + " ALP";
    }
    const amountStr = [ampAmountStr, esAmpAmountStr, mpAmountStr, alpStr].filter((s) => s).join(", ");
    earnMsg = (
      <div>
        <Trans>
          You are earning {nativeTokenSymbol} rewards with {formatAmount(totalRewardTokensAndAlp, 18, 2, true)} tokens.
          <br />
          Tokens: {amountStr}.
        </Trans>
      </div>
    );
  }

  return (
    <div className="default-container page-layout">
      <StakeModal
        isVisible={isStakeModalVisible}
        setIsVisible={setIsStakeModalVisible}
        chainId={chainId}
        title={stakeModalTitle}
        maxAmount={stakeModalMaxAmount}
        value={stakeValue}
        setValue={setStakeValue}
        active={active}
        account={account}
        library={library}
        stakingTokenSymbol={stakingTokenSymbol}
        stakingTokenAddress={stakingTokenAddress}
        farmAddress={stakingFarmAddress}
        rewardRouterAddress={rewardRouterAddress}
        stakeMethodName={stakeMethodName}
        hasMultiplierPoints={hasMultiplierPoints}
        setPendingTxns={setPendingTxns}
        nativeTokenSymbol={nativeTokenSymbol}
        wrappedTokenSymbol={wrappedTokenSymbol}
      />
      <UnstakeModal
        setPendingTxns={setPendingTxns}
        isVisible={isUnstakeModalVisible}
        setIsVisible={setIsUnstakeModalVisible}
        chainId={chainId}
        title={unstakeModalTitle}
        maxAmount={unstakeModalMaxAmount}
        reservedAmount={unstakeModalReservedAmount}
        value={unstakeValue}
        setValue={setUnstakeValue}
        library={library}
        unstakingTokenSymbol={unstakingTokenSymbol}
        rewardRouterAddress={rewardRouterAddress}
        unstakeMethodName={unstakeMethodName}
        multiplierPointsAmount={multiplierPointsAmount}
        bonusAmpInFeeAmp={bonusAmpInFeeAmp}
      />
      <VesterDepositModal
        isVisible={isVesterDepositModalVisible}
        setIsVisible={setIsVesterDepositModalVisible}
        chainId={chainId}
        title={vesterDepositTitle}
        stakeTokenLabel={vesterDepositStakeTokenLabel}
        maxAmount={vesterDepositMaxAmount}
        balance={vesterDepositBalance}
        escrowedBalance={vesterDepositEscrowedBalance}
        vestedAmount={vesterDepositVestedAmount}
        averageStakedAmount={vesterDepositAverageStakedAmount}
        maxVestableAmount={vesterDepositMaxVestableAmount}
        reserveAmount={vesterDepositReserveAmount}
        maxReserveAmount={vesterDepositMaxReserveAmount}
        value={vesterDepositValue}
        setValue={setVesterDepositValue}
        library={library}
        vesterAddress={vesterDepositAddress}
        setPendingTxns={setPendingTxns}
      />
      <VesterWithdrawModal
        isVisible={isVesterWithdrawModalVisible}
        setIsVisible={setIsVesterWithdrawModalVisible}
        vesterAddress={vesterWithdrawAddress}
        chainId={chainId}
        title={vesterWithdrawTitle}
        library={library}
        setPendingTxns={setPendingTxns}
      />
      <CompoundModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isCompoundModalVisible}
        setIsVisible={setIsCompoundModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <ClaimModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <div className="section-title-block">
        <div className="section-title-icon"></div>
        <div className="section-title-content">
          <div className="Page-title font-kufam">
            <Trans>Earn</Trans>
          </div>
          <div className="Page-description">
            <Trans>
              Stake AMP and ALP to earn rewards.
            </Trans>
          </div>
          {earnMsg && <div className="Page-description">{earnMsg}</div>}
        </div>
      </div>
      <div className="StakeV2-content">
        <div className="StakeV2-cards">
          <div className="App-card StakeV2-amp-card">
            <div className="App-card-title font-kufam">AMP</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>
                  {!ampPrice && "..."}
                  {ampPrice && (
                    <Tooltip
                      position="right-bottom"
                      className="nowrap"
                      handle={"$" + formatAmount(ampPrice, USD_DECIMALS, 2, true)}
                      // handle={"1 CRO"}
                      renderContent={() => (
                        <>
                          <StatsTooltipRow
                            label={t`Price on Pegasus`}
                            value= {formatAmount(ampPrice, USD_DECIMALS, 2, true)}
                            showDollar={false}
                          />  
                          {/* <StatsTooltipRow
                            label={t`Price on Goerli`}
                            value={formatAmount(ampPriceFromGoerli, USD_DECIMALS, 2, true)}
                          /> */}
                        </>
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "ampBalance", 18, 2, true)} AMP ($
                  {formatKeyAmount(processedData, "ampBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "ampInStakedAmp", 18, 2, true)} AMP ($
                  {formatKeyAmount(processedData, "ampInStakedAmpUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "ampAprTotalWithBoost", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label="Escrowed AMP APR"
                            showDollar={false}
                            value={`${formatKeyAmount(processedData, "ampAprForEsAmp", 2, 2, true)}%`}
                          />
                          {(!processedData.ampBoostAprForNativeToken ||
                            processedData.ampBoostAprForNativeToken.eq(0)) && (
                            <StatsTooltipRow
                              label={`${nativeTokenSymbol} APR`}
                              showDollar={false}
                              value={`${formatKeyAmount(processedData, "ampAprForNativeToken", 2, 2, true)}%`}
                            />
                          )}
                          {processedData.ampBoostAprForNativeToken && processedData.ampBoostAprForNativeToken.gt(0) && (
                            <div>
                              <br />

                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Pegasus APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(processedData, "ampAprForNativeToken", 2, 2, true)}%`}
                              />
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Boosted APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(processedData, "ampBoostAprForNativeToken", 2, 2, true)}%`}
                              />
                              <div className="Tooltip-divider" />
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Total APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(
                                  processedData,
                                  "ampAprForNativeTokenWithBoost",
                                  2,
                                  2,
                                  true
                                )}%`}
                              />

                              <br />

                              <Trans>The Boosted APR is from your staked Multiplier Points.</Trans>
                            </div>
                          )}
                          <div>
                            <br />
                            <Trans>
                              APRs are updated weekly on Wednesday and will depend on the fees collected for the week.
                            </Trans>
                          </div>
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Rewards</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`$${formatKeyAmount(processedData, "totalAmpRewardsUsd", USD_DECIMALS, 2, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol})`}
                            value={`${formatKeyAmount(
                              processedData,
                              "feeAmpTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(processedData, "feeAmpTrackerRewardsUsd", USD_DECIMALS, 2, true)})`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed AMP"
                            value={`${formatKeyAmount(
                              processedData,
                              "stakedAmpTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(
                              processedData,
                              "stakedAmpTrackerRewardsUsd",
                              USD_DECIMALS,
                              2,
                              true
                            )})`}
                            showDollar={false}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">{renderMultiplierPointsLabel()}</div>
                <div>{renderMultiplierPointsValue()}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Boost Percentage</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatAmount(processedData.boostBasisPoints, 2, 2, false)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <div>
                          <Trans>
                            You are earning {formatAmount(processedData.boostBasisPoints, 2, 2, false)}% more{" "}
                            {nativeTokenSymbol} rewards using{" "}
                            {formatAmount(processedData.bnAmpInFeeAmp, 18, 4, 2, true)} Staked Multiplier Points.
                          </Trans>
                          <br />
                          <br />
                          <Trans>Use the "Compound" button to stake your Multiplier Points.</Trans>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {!totalAmpStaked && "..."}
                  
                  {/* {totalAmpStaked && (
                    <Tooltip
                      position="right-bottom"
                      className="nowrap"
                      handle={
                        formatAmount(totalAmpStaked, 18, 0, true) +
                        " AMP" +
                        ` ($${formatAmount(stakedAmpSupplyUsd, USD_DECIMALS, 0, true)})`
                      }
                      renderContent={() => (
                        <StatsTooltip
                          showDollar={false}
                          title={t`Staked`}
                          avaxValue={avaxAmpStaked}
                          arbitrumValue={arbitrumAmpStaked}
                          total={totalAmpStaked}
                          decimalsForConversion={18}
                          symbol="AMP"
                        />
                      )}
                    />
                  )} */}
                  { formatAmount(totalAmpStaked, 18, 0, true) +
                        " AMP" +
                        ` ($${formatAmount(stakedAmpSupplyUsd, USD_DECIMALS, 2/* 0 */, true)})` }
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                {!totalAmpSupply && "..."}
                {totalAmpSupply && (
                  <div>
                    {formatAmount(totalAmpSupply, 18, 0, true)} AMP ($
                    {formatAmount(totalSupplyUsd, USD_DECIMALS, 2/* 0 */, true)})
                  </div>
                )}
              </div>
              <div className="App-card-divider" />
              <div className="App-card-options">
                {/* <Link className="App-button-option App-card-option" to="/buy_layer">
                  <Trans>Buy AMP</Trans>
                </Link> */}
                <ExternalLink href="https://app.elektrik.network/#/swap" className="App-card-option button-primary">
                  <Trans>Buy AMP</Trans>
                </ExternalLink>
                {active && (
                  <button className="App-card-option button-primary" onClick={() => showStakeAmpModal()}>
                    <Trans>Stake</Trans>
                  </button>
                )}
                {active && (
                  <button className="App-card-option button-primary" onClick={() => showUnstakeAmpModal()}>
                    <Trans>Unstake</Trans>
                  </button>
                )}
                {active && (
                  <Link className="App-card-option button-primary" to="/begin_account_transfer">
                    <Trans>Transfer Account</Trans>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="App-card primary StakeV2-total-rewards-card">
            <div className="App-card-title font-kufam">
              <Trans>Total Rewards</Trans>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  {nativeTokenSymbol} ({wrappedTokenSymbol})
                </div>
                <div>
                  {formatKeyAmount(processedData, "totalNativeTokenRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalNativeTokenRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">AMP</div>
                <div>
                  {formatKeyAmount(processedData, "totalVesterRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalVesterRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Escrowed AMP</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "totalEsAmpRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalEsAmpRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Multiplier Points</Trans>
                </div>
                <div>{formatKeyAmount(processedData, "bonusAmpTrackerRewards", 18, 4, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked Multiplier Points</Trans>
                </div>
                <div>{formatKeyAmount(processedData, "bnAmpInFeeAmp", 18, 4, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total</Trans>
                </div>
                <div>${formatKeyAmount(processedData, "totalRewardsUsd", USD_DECIMALS, 2, true)}</div>
              </div>
              <div className="App-card-bottom-placeholder">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button className="App-card-option button-primary">
                      <Trans>Compound</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary">
                      <Trans>Claim xcxc</Trans>
                    </button>
                  )}
                  {!active && (
                    <button className="App-card-option button-primary" onClick={() => connectWallet()}>
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
              <div className="App-card-bottom">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button
                      className="App-card-option button-primary"
                      onClick={() => setIsCompoundModalVisible(true)}
                    >
                      <Trans>Compound</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary" onClick={() => setIsClaimModalVisible(true)}>
                      <Trans>Claim</Trans>
                    </button>
                  )}
                  {!active && (
                    <button className="App-card-option button-primary" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title font-kufam">ALP ({chainName})</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>${formatKeyAmount(processedData, "alpPrice", USD_DECIMALS, 3, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "alpBalance", ALP_DECIMALS, 2, true)} ALP ($
                  {formatKeyAmount(processedData, "alpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "alpBalance", ALP_DECIMALS, 2, true)} ALP ($
                  {formatKeyAmount(processedData, "alpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "alpAprTotal", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) APR`}
                            value={`${formatKeyAmount(processedData, "alpAprForNativeToken", 2, 2, true)}%`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed AMP APR"
                            value={`${formatKeyAmount(processedData, "alpAprForEsAmp", 2, 2, true)}%`}
                            showDollar={false}
                          />
                          <br />

                          <Trans>
                            APRs are updated weekly on Wednesday and will depend on the fees collected for the week.
                          </Trans>
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Rewards</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`$${formatKeyAmount(processedData, "totalAlpRewardsUsd", USD_DECIMALS, 2, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol})`}
                            value={`${formatKeyAmount(
                              processedData,
                              "feeAlpTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(processedData, "feeAlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed AMP"
                            value={`${formatKeyAmount(
                              processedData,
                              "stakedAlpTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(
                              processedData,
                              "stakedAlpTrackerRewardsUsd",
                              USD_DECIMALS,
                              2,
                              true
                            )})`}
                            showDollar={false}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "alpSupply", 18, 2, true)} ALP ($
                  {formatKeyAmount(processedData, "alpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "alpSupply", 18, 2, true)} ALP ($
                  {formatKeyAmount(processedData, "alpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                <Link className="App-card-option button-primary" to="/buy_alp">
                  <Trans>Buy ALP</Trans>
                </Link>
                <Link className="App-card-option button-primary" to="/buy_alp#redeem">
                  <Trans>Sell ALP</Trans>
                </Link>
                {/* {hasInsurance && (
                  <a
                    className="App-button-option App-card-option"
                    href="https://app.insurace.io/Insurance/Cart?id=124&referrer=545066382753150189457177837072918687520318754040"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Trans>Purchase Insurance</Trans>
                  </a>
                )} */}
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title font-kufam">
              <Trans>Escrowed AMP</Trans>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>${formatAmount(ampPrice, USD_DECIMALS, 2, true)} </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "esAmpBalance", 18, 2, true)} esAMP ($
                  {formatKeyAmount(processedData, "esAmpBalanceUsd", USD_DECIMALS, 2, true)})
                </div> 
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "esAmpInStakedAmp", 18, 2, true)} esAMP ($
                  {formatKeyAmount(processedData, "esAmpInStakedAmpUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(processedData, "ampAprTotalWithBoost", 2, 2, true)}%`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <>
                            <StatsTooltipRow
                              label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) Pegasus APR`}
                              value={`${formatKeyAmount(processedData, "ampAprForNativeToken", 2, 2, true)}%`}
                              showDollar={false}
                            />
                            {processedData.bnAmpInFeeAmp && processedData.bnAmpInFeeAmp.gt(0) && (
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) Boosted APR`}
                                value={`${formatKeyAmount(processedData, "ampBoostAprForNativeToken", 2, 2, true)}%`}
                                showDollar={false}
                              />
                            )}
                            <StatsTooltipRow
                              label="Escrowed AMP APR"
                              value={`${formatKeyAmount(processedData, "ampAprForEsAmp", 2, 2, true)}%`}
                              showDollar={false}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">{renderMultiplierPointsLabel()}</div>
                <div>{renderMultiplierPointsValue()}</div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "stakedEsAmpSupply", 18, 0, true)} esAMP ($
                  {formatKeyAmount(processedData, "stakedEsAmpSupplyUsd", USD_DECIMALS, 0, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                <div>
                  {formatAmount(esAmpSupply, 18, 0, true)} esAMP (${formatAmount(esAmpSupplyUsd, USD_DECIMALS, 0, true)}
                  )
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                {active && (
                  <button className="App-card-option button-primary" onClick={() => showStakeEsAmpModal()}>
                    <Trans>Stake</Trans>
                  </button>
                )}
                {active && (
                  <button className="App-card-option button-primary" onClick={() => showUnstakeEsAmpModal()}>
                    <Trans>Unstake</Trans>
                  </button>
                )}
                {!active && (
                  <button className="App-card-option button-primary" onClick={() => connectWallet()}>
                    <Trans> Connect Wallet</Trans>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="Tab-title-section">
          <div className="Page-title font-kufam">
            <Trans>Vest</Trans>
          </div>
          <div className="Page-description">
            <Trans>
              Convert esAMP tokens to AMP tokens.
              <br />
              Please read the{" "}
              <a href="https://amped.gitbook.io/amped/rewards" target="_blank" rel="noopener noreferrer">
                vesting details
              </a>{" "}
              before using the vaults.
            </Trans>
          </div>
        </div>
        <div>
          <div className="StakeV2-cards">
            <div className="App-card StakeV2-amp-card">
              <div className="App-card-title font-kufam">
                <Trans>AMP Vault</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Staked Tokens</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={formatAmount(totalRewardTokens, 18, 2, true)}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <>
                            <StatsTooltipRow
                              showDollar={false}
                              label="AMP"
                              value={formatAmount(processedData.ampInStakedAmp, 18, 2, true)}
                            />

                            <StatsTooltipRow
                              showDollar={false}
                              label="esAMP"
                              value={formatAmount(processedData.esAmpInStakedAmp, 18, 2, true)}
                            />
                            <StatsTooltipRow
                              showDollar={false}
                              label="Multiplier Points"
                              value={formatAmount(processedData.bnAmpInFeeAmp, 18, 2, true)}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Reserved for Vesting</Trans>
                  </div>
                  <div>
                    {formatKeyAmount(vestingData, "ampVesterPairAmount", 18, 4, true)} /{" "}
                    {formatAmount(totalRewardTokens, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Vesting Status</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "ampVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                        vestingData,
                        "ampVesterVestedAmount",
                        18,
                        4,
                        true
                      )}`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <div>
                            <Trans>
                              {formatKeyAmount(vestingData, "ampVesterClaimSum", 18, 4, true)} tokens have been
                              converted to AMP from the{" "}
                              {formatKeyAmount(vestingData, "ampVesterVestedAmount", 18, 4, true)} esAMP deposited for
                              vesting.
                            </Trans>
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Claimable</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "ampVesterClaimable", 18, 4, true)} AMP`}
                      position="right-bottom"
                      renderContent={() => (
                        <Trans>
                          {formatKeyAmount(vestingData, "ampVesterClaimable", 18, 4, true)} AMP tokens can be claimed,
                          use the options under the Total Rewards section to claim them.
                        </Trans>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {!active && (
                    <button className="App-card-option button-primary" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary" onClick={() => showAmpVesterDepositModal()}>
                      <Trans>Deposit</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary" onClick={() => showAmpVesterWithdrawModal()}>
                      <Trans>Withdraw</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="App-card StakeV2-amp-card">
              <div className="App-card-title font-kufam">
                <Trans>ALP Vault</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Staked Tokens</Trans>
                  </div>
                  <div>{formatAmount(processedData.alpBalance, 18, 2, true)} ALP</div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Reserved for Vesting</Trans>
                  </div>
                  <div>
                    {formatKeyAmount(vestingData, "alpVesterPairAmount", 18, 4, true)} /{" "}
                    {formatAmount(processedData.alpBalance, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Vesting Status</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "alpVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                        vestingData,
                        "alpVesterVestedAmount",
                        18,
                        4,
                        true
                      )}`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <div>
                            <Trans>
                              {formatKeyAmount(vestingData, "alpVesterClaimSum", 18, 4, true)} tokens have been
                              converted to AMP from the{" "}
                              {formatKeyAmount(vestingData, "alpVesterVestedAmount", 18, 4, true)} esAMP deposited for
                              vesting.
                            </Trans>
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Claimable</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "alpVesterClaimable", 18, 4, true)} AMP`}
                      position="right-bottom"
                      renderContent={() => (
                        <Trans>
                          {formatKeyAmount(vestingData, "alpVesterClaimable", 18, 4, true)} AMP tokens can be claimed,
                          use the options under the Total Rewards section to claim them.
                        </Trans>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {!active && (
                    <button className="App-card-option button-primary" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary" onClick={() => showAlpVesterDepositModal()}>
                      <Trans>Deposit</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-card-option button-primary" onClick={() => showAlpVesterWithdrawModal()}>
                      <Trans>Withdraw</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
