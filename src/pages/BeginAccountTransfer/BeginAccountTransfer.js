import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { ethers } from "ethers";

import { getContract } from "config/contracts";

import Modal from "components/Modal/Modal";
import Footer from "components/Footer/Footer";

import Token from "abis/Token.json";
import Vester from "abis/Vester.json";
import RewardTracker from "abis/RewardTracker.json";
import RewardRouter from "abis/RewardRouter.json";

import { FaCheck, FaTimes } from "react-icons/fa";

import { Trans, t } from "@lingui/macro";

import "./BeginAccountTransfer.css";
import { callContract, contractFetcher } from "lib/contracts";
import { approveTokens } from "domain/tokens";
import { useChainId } from "lib/chains";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

function ValidationRow({ isValid, children }) {
  return (
    <div className="ValidationRow">
      <div className="ValidationRow-icon-container">
        {isValid && <FaCheck className="ValidationRow-icon" />}
        {!isValid && <FaTimes className="ValidationRow-icon" />}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function BeginAccountTransfer(props) {
  const { setPendingTxns } = props;
  const { isConnected: active, address: account } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])
  const { chainId } = useChainId();

  const [receiver, setReceiver] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferSubmittedModalVisible, setIsTransferSubmittedModalVisible] = useState(false);
  let parsedReceiver = ethers.constants.AddressZero;
  if (ethers.utils.isAddress(receiver)) {
    parsedReceiver = receiver;
  }

  const ampAddress = getContract(chainId, "AMP");
  const ampVesterAddress = getContract(chainId, "AmpVester");
  const alpVesterAddress = getContract(chainId, "AlpVester");

  const rewardRouterAddress = getContract(chainId, "RewardRouter");

  const { data: ampVesterBalance } = useSWR([active, chainId, ampVesterAddress, "balanceOf", account], {
    fetcher: contractFetcher(library, Token),
  });

  const { data: alpVesterBalance } = useSWR([active, chainId, alpVesterAddress, "balanceOf", account], {
    fetcher: contractFetcher(library, Token),
  });

  const stakedAmpTrackerAddress = getContract(chainId, "StakedAmpTracker");
  const { data: cumulativeAmpRewards } = useSWR(
    [active, chainId, stakedAmpTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const stakedAlpTrackerAddress = getContract(chainId, "StakedAlpTracker");
  const { data: cumulativeAlpRewards } = useSWR(
    [active, chainId, stakedAlpTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const { data: transferredCumulativeAmpRewards } = useSWR(
    [active, chainId, ampVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, Vester),
    }
  );

  const { data: transferredCumulativeAlpRewards } = useSWR(
    [active, chainId, alpVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, Vester),
    }
  );

  const { data: pendingReceiver } = useSWR([active, chainId, rewardRouterAddress, "pendingReceivers", account], {
    fetcher: contractFetcher(library, RewardRouter),
  });

  const { data: ampAllowance } = useSWR([active, chainId, ampAddress, "allowance", account, stakedAmpTrackerAddress], {
    fetcher: contractFetcher(library, Token),
  });

  const { data: ampStaked } = useSWR(
    [active, chainId, stakedAmpTrackerAddress, "depositBalances", account, ampAddress],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const needApproval = ampAllowance && ampStaked && ampStaked.gt(ampAllowance);

  const hasVestedAmp = ampVesterBalance && ampVesterBalance.gt(0);
  const hasVestedAlp = alpVesterBalance && alpVesterBalance.gt(0);
  const hasStakedAmp =
    (cumulativeAmpRewards && cumulativeAmpRewards.gt(0)) ||
    (transferredCumulativeAmpRewards && transferredCumulativeAmpRewards.gt(0));
  const hasStakedAlp =
    (cumulativeAlpRewards && cumulativeAlpRewards.gt(0)) ||
    (transferredCumulativeAlpRewards && transferredCumulativeAlpRewards.gt(0));
  const hasPendingReceiver = pendingReceiver && pendingReceiver !== ethers.constants.AddressZero;

  const getError = () => {
    if (!account) {
      return t`Wallet is not connected`;
    }
    if (hasVestedAmp) {
      return t`Vested AMP not withdrawn`;
    }
    if (hasVestedAlp) {
      return t`Vested ALP not withdrawn`;
    }
    if (!receiver || receiver.length === 0) {
      return t`Enter Receiver Address`;
    }
    if (!ethers.utils.isAddress(receiver)) {
      return t`Invalid Receiver Address`;
    }
    if (hasStakedAmp || hasStakedAlp) {
      return t`Invalid Receiver`;
    }
    if ((parsedReceiver || "").toString().toLowerCase() === (account || "").toString().toLowerCase()) {
      return t`Self-transfer not supported`;
    }

    if (
      (parsedReceiver || "").length > 0 &&
      (parsedReceiver || "").toString().toLowerCase() === (pendingReceiver || "").toString().toLowerCase()
    ) {
      return t`Transfer already initiated`;
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isTransferring) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (needApproval) {
      return t`Approve AMP`;
    }
    if (isApproving) {
      return t`Approving...`;
    }
    if (isTransferring) {
      return t`Transferring`;
    }

    return t`Begin Transfer`;
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

    setIsTransferring(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());

    callContract(chainId, contract, "signalTransfer", [parsedReceiver], {
      sentMsg: t`Transfer submitted!`,
      failMsg: t`Transfer failed.`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsTransferSubmittedModalVisible(true);
      })
      .finally(() => {
        setIsTransferring(false);
      });
  };

  const completeTransferLink = `/complete_account_transfer/${account}/${parsedReceiver}`;
  const pendingTransferLink = `/complete_account_transfer/${account}/${pendingReceiver}`;

  return (
    <div className="BeginAccountTransfer Page page-layout">
      <Modal
        isVisible={isTransferSubmittedModalVisible}
        setIsVisible={setIsTransferSubmittedModalVisible}
        label={t`Transfer Submitted`}
      >
        <Trans>Your transfer has been initiated.</Trans>
        <br />
        <br />
        <Link className="App-cta" to={completeTransferLink}>
          <Trans>Continue</Trans>
        </Link>
      </Modal>
      <div className="Page-title-section">
        <div className="Page-title">
          <Trans>Transfer Account</Trans>
        </div>
        <div className="Page-description">
          <Trans>
            Please only use this for full account transfers.
            <br />
            This will transfer all your AMP, esAMP, ALP and Multiplier Points to your new account.
            <br />
            Transfers are only supported if the receiving account has not staked AMP or ALP tokens before.
            <br />
            Transfers are one-way, you will not be able to transfer staked tokens back to the sending account.
          </Trans>
        </div>
        {hasPendingReceiver && (
          <div className="Page-description">
            <Trans>
              You have a <Link to={pendingTransferLink}>pending transfer</Link> to {pendingReceiver}.
            </Trans>
          </div>
        )}
      </div>
      <div className="Page-content">
        <div className="input-form">
          <div className="input-row">
            <label className="input-label">
              <Trans>Receiver Address</Trans>
            </label>
            <div>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="text-input"
              />
            </div>
          </div>
          <div className="BeginAccountTransfer-validations">
            <ValidationRow isValid={!hasVestedAmp}>
              <Trans>Sender has withdrawn all tokens from AMP Vesting Vault</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasVestedAlp}>
              <Trans>Sender has withdrawn all tokens from ALP Vesting Vault</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasStakedAmp}>
              <Trans>Receiver has not staked AMP tokens before</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasStakedAlp}>
              <Trans>Receiver has not staked ALP tokens before</Trans>
            </ValidationRow>
          </div>
          <div className="input-row">
            <button
              className="App-cta Exchange-swap-button"
              disabled={!isPrimaryEnabled()}
              onClick={() => onClickPrimary()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
