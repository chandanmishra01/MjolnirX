import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Trans } from "@lingui/macro";

import poeBigIcon from "img/ic_poe.svg";
import plpBigIcon from "img/ic_plp.svg";

import { isHomeSite } from "lib/legacy";

import APRLabel from "../APRLabel/APRLabel";
import { HeaderLink } from "../Header/HeaderLink";
import { getChainName } from "config/chains";
import { switchNetwork } from "lib/wallets";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";
import "./TokenCard.css"
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

export default function TokenCard({ showRedirectModal, redirectPopupTimestamp }) {
  const isHome = isHomeSite();
  const { chainId } = useChainId();
  const { isConnected: active } = useWeb3ModalAccount()

  const changeNetwork = useCallback(
    (network) => {
      if (network === chainId) {
        return;
      }
      if (!active) {
        setTimeout(() => {
          return switchNetwork(network, active);
        }, 500);
      } else {
        return switchNetwork(network, active);
      }
    },
    [chainId, active]
  );

  const BuyLink = ({ className, to, children, network }) => {
    if (isHome && showRedirectModal) {
      return (
        <HeaderLink
          to={to}
          className={className}
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          {children}
        </HeaderLink>
      );
    }

    return (
      <Link to={to} className={className} onClick={() => changeNetwork(network)}>
        {children}
      </Link>
    );
  };
  
  return (
    <div className="Home-token-card-options">
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={poeBigIcon} alt="bluBigIcon" /> MJX
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            <Trans>MJX is the utility and governance token. Accrues 30% of the platform's generated fees.</Trans>
          </div>
          <div className="Home-token-card-option-apr">
            {`${getChainName(chainId)} APR:`} <APRLabel chainId={chainId} label="ampAprTotal" key={getChainName(chainId)} />{" "}
            {/* <Trans>Goerli APR:</Trans> <APRLabel chainId={GOERLI_TESTNET} label="ampAprTotal" key="GOERLI_TESTNET" /> */}
          </div>
          <div className="Home-token-card-option-action">
            <div className="buy">
              <ExternalLink href="https://app.elektrik.network/#/swap" className="button-primary disabled">
                <Trans>Buy</Trans>
              </ExternalLink>
              {/* <BuyLink to="/buy_layer" className="default-btn" network={chainId}>
                <Trans>Buy</Trans>
              </BuyLink>
               <BuyLink to="/buy_layer" className="default-btn" network={GOERLI_TESTNET}>
                <Trans>Buy on Goerli</Trans>
              </BuyLink> */}
            </div>
            <ExternalLink href="#" className="button-secondary disabled">
              <Trans>Read more</Trans>
            </ExternalLink>
          </div>
        </div>
      </div>
      <div className="Home-token-card-option">
        <div className="Home-token-card-option-icon">
          <img src={plpBigIcon} alt="blpBigIcon" /> MLP
        </div>
        <div className="Home-token-card-option-info">
          <div className="Home-token-card-option-title">
            <Trans>MLP is the liquidity provider token. Accrues 70% of the platform's generated fees.</Trans>
          </div>
          <div className="Home-token-card-option-apr">
            {`${getChainName(chainId)} APR:`} <APRLabel chainId={chainId} label="alpAprTotal" key={getChainName(chainId)} />{" "}
            {/* <Trans>Goerli APR:</Trans> <APRLabel chainId={GOERLI_TESTNET} label="alpAprTotal" key="GOERLI_TESTNET" /> */}
          </div>
          <div className="Home-token-card-option-action">
            <div className="buy">
              <BuyLink to="/buy_mlp" className="button-primary" network={chainId}>
                <Trans>Buy</Trans>
              </BuyLink>
              {/* <BuyLink to="/buy_alp" className="default-btn" network={GOERLI_TESTNET}>
                <Trans>Buy on Goerli</Trans>
              </BuyLink> */}
            </div>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="button-secondary disabled"
            >
              <Trans>Read more</Trans>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
