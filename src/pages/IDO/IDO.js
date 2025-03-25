import React, { useEffect, useState, useCallback } from "react";
import { Link, useHistory } from "react-router-dom";

import IDOContent from "components/IDO/IDOContent";
import Footer from "components/Footer/Footer";
import "./IDO.css";

import { Trans } from "@lingui/macro";
import { useChainId } from "lib/chains";
import { PEGASUS } from "config/chains";
import SEO from "components/Common/SEO";
import { getPageTitle } from "lib/legacy";
import { switchNetwork } from "lib/wallets";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

export default function IDO(props) {
  const { chainId } = useChainId();
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);
  const { isConnected: active } = useWeb3ModalAccount()

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash === "redeem" ? false : true;
    setIsBuying(buying);
  }, [history.location.hash]);

  const onNetworkSelect = useCallback(
    (value) => {
      if (value === chainId) {
        return;
      }
      return switchNetwork(value, active);
    },
    [chainId, active]
  );

  return (
    <div className="default-container page-layout Buy-sell-blp">
      {
        chainId === PEGASUS ?
        <IDOContent {...props} isBuying={isBuying} setIsBuying={setIsBuying} />
        :
        <SEO title={getPageTitle("Bluespade is on IDO")}>
          <div className="page-layout">
            <div className="page-not-found-container">
              <div className="page-not-found">
                <h2>
                  <Trans>Bluespade is conducting IDO on the PEGASUS network.</Trans>
                </h2>
                <p className="ido-go-back">
                  <span onClick={() => onNetworkSelect(PEGASUS)}>Switch to PEGASUS</span>
                </p>
              </div>
            </div>
            <Footer />
          </div>
        </SEO>
      }      
      <Footer />
    </div>
  );
}
