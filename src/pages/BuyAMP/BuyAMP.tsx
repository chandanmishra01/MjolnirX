import React, { useCallback } from "react";
import Footer from "components/Footer/Footer";
import "./BuyAMP.css";
import { Trans, t } from "@lingui/macro";
import Button from "components/Common/Button";
import { ARBITRUM, PEGASUS, getChainName, getConstant } from "config/chains";
import { switchNetwork } from "lib/wallets";
import { useChainId } from "lib/chains";
import Card from "components/Common/Card";
import { importImage } from "lib/legacy";
import ExternalLink from "components/ExternalLink/ExternalLink";

import Banxa from "img/ic_banxa.svg";
import Uniswap from "img/ic_uni_arbitrum.svg";
import Bungee from "img/ic_bungee.png";
import O3 from "img/ic_o3.png";
import ohmArbitrum from "img/ic_olympus_arbitrum.svg";
import { EXTERNAL_LINKS, TRANSFER_EXCHANGES } from "./constants";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

export default function BuyAMP() {
  const { chainId } = useChainId();
  const isPegasus = chainId === PEGASUS;
  const { isConnected: active } = useWeb3ModalAccount()
  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const externalLinks = EXTERNAL_LINKS[chainId];

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
    <div className="BuyAMPALP default-container page-layout">
      <div className="BuyAMPALP-container">
        <div className="section-title-block">
          <div className="section-title-content">
            <div className="Page-title">
              <Trans>{`Buy AMP on ${getChainName(chainId)}`}</Trans>
            </div>
            <div className="Page-description">
              <Trans>Choose to buy from decentralized or centralized exchanges.</Trans>
              <br />
              <Trans>
                To purchase AMP on the Pegasus blockchain, please{" "}
                <span onClick={() => onNetworkSelect(isPegasus ? PEGASUS : ARBITRUM)}>change your network</span>.
              </Trans>
            </div>
          </div>
        </div>
        <div className="cards-row">
          <DecentralisedExchanges chainId={chainId} externalLinks={externalLinks} />
          <CentralisedExchanges chainId={chainId} externalLinks={externalLinks} />
        </div>

        {isPegasus ? (
          <div className="section-title-block mt-top">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy or Transfer ETH to PEGASUS</Trans>
              </div>
              <div className="Page-description">
                <Trans>Buy ETH directly to PEGASUS or transfer it there.</Trans>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-title-block mt-top">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy or Transfer ETH to Goerli</Trans>
              </div>
              <div className="Page-description">
                <Trans>Buy ETH directly to Goerli or transfer it there.</Trans>
              </div>
            </div>
          </div>
        )}

        <div className="cards-row">
          <Card title={t`Buy ${nativeTokenSymbol}`}>
            <div className="App-card-content">
              <div className="BuyAMPALP-description">
                {isPegasus ? (
                  <Trans>
                    You can buy CRO directly on{" "}
                    <ExternalLink href={externalLinks.networkWebsite}>PEGASUS</ExternalLink> using these options:
                  </Trans>
                ) : (
                  <Trans>
                    You can buy ETH directly on{" "}
                    <ExternalLink href={externalLinks.networkWebsite}>Goerli</ExternalLink> using these options:
                  </Trans>
                )}
              </div>
              <div className="buttons-group">
                <Button href={externalLinks.bungee} imgSrc={Bungee}>
                  Bungee
                </Button>
                <Button href={externalLinks.o3} imgSrc={O3}>
                  O3
                </Button>
                <Button href={externalLinks.banxa} imgSrc={Banxa}>
                  Banxa
                </Button>
              </div>
            </div>
          </Card>
          <Card title={t`Transfer ${nativeTokenSymbol}`}>
            <div className="App-card-content">
              {isPegasus ? (
                <div className="BuyAMPALP-description">
                  <Trans>You can transfer CRO from other networks to PEGASUS using any of the below options:</Trans>
                </div>
              ) : (
                <div className="BuyAMPALP-description">
                  <Trans>You can transfer AVAX from other networks to Goerli using any of the below options:</Trans>
                </div>
              )}
              <div className="buttons-group">
                {TRANSFER_EXCHANGES.filter((e) => e.networks.includes(chainId)).map((exchange) => {
                  const icon = importImage(exchange.icon) || "";
                  return (
                    <Button key={exchange.name} href={exchange.link} imgSrc={icon}>
                      {exchange.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DecentralisedExchanges({ chainId, externalLinks }) {
  const isPegasus = chainId === PEGASUS;
  return (
    <Card title={t`Buy AMP from a Decentralized Exchange`}>
      <div className="App-card-content">
        {isPegasus ? (
          <div className="exchange-info-group">
            <div className="BuyAMPALP-description">
              <Trans>Buy AMP from Uniswap (make sure to select PEGASUS):</Trans>
            </div>
            <div className="buttons-group col-1">
              <Button imgSrc={Uniswap} href={externalLinks.buyAmp.uniswap}>
                <Trans>Uniswap</Trans>
              </Button>
            </div>
          </div>
        ) : (
            <div className="exchange-info-group">
              <div className="BuyAMPALP-description">
                <Trans>Buy AMP from Uniswap (make sure to select Goerli):</Trans>
              </div>
              <div className="buttons-group col-1">
                <Button imgSrc={Uniswap} href={externalLinks.buyAmp.uniswap}>
                  <Trans>Uniswap</Trans>
                </Button>
              </div>
            </div>
          )
        }
        <div className="exchange-info-group">
          <div className="BuyAMPALP-description">
            {/* <Trans>Buy AMP using Decentralized Exchange Aggregators:</Trans> */}
          </div>
          <div className="buttons-group">
            {/* {DECENTRALISED_AGGRIGATORS.filter((e) => e.networks.includes(chainId)).map((exchange) => {
              const icon = importImage(exchange.icon) || "";
              const link = exchange.links ? exchange.links[chainId] : exchange.link;
              return (
                <Button key={exchange.name} imgSrc={icon} href={link}>
                  <Trans>{exchange.name}</Trans>
                </Button>
              );
            })} */}
          </div>
        </div>
        {/* <div className="exchange-info-group">
          <div className="BuyAMPALP-description">
            <Trans>Buy AMP using any token from any network:</Trans>
          </div>
          <div className="buttons-group">
            <Button href={externalLinks.bungee} imgSrc={Bungee}>
              Bungee
            </Button>
            <Button href={externalLinks.o3} imgSrc={O3}>
              O3
            </Button>
          </div>
        </div> */}
        {isPegasus && (
          <div className="exchange-info-group">
            <div className="BuyAMPALP-description">
              <Trans>AMP bonds can be bought on Olympus Pro with a discount and a small vesting period:</Trans>
            </div>
            <div className="buttons-group col-1">
              <Button imgSrc={ohmArbitrum} href="https://pro.olympusdao.finance/#/partners/AMP">
                Olympus Pro
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CentralisedExchanges({ chainId, externalLinks }) {
  return (
    <Card title={t`Buy AMP from centralized services`}>
      <div className="App-card-content">
        <div className="exchange-info-group">
          <div className="BuyAMPALP-description">
            {/* <Trans>Buy AMP from centralized exchanges:</Trans> */}
          </div>
          <div className="buttons-group">
            {/* {CENTRALISED_EXCHANGES.filter((e) => e.networks.includes(chainId)).map((exchange) => {
              const icon = importImage(exchange.icon) || "";
              return (
                <Button key={exchange.name} href={exchange.link} imgSrc={icon}>
                  {exchange.name}
                </Button>
              );
            })} */}
          </div>
        </div>

        <div className="exchange-info-group">
          <div className="BuyAMPALP-description">
            {/* <Trans>Buy AMP using FIAT gateways:</Trans> */}
          </div>
          <div className="buttons-group col-2">
            {/* <Button href="https://www.binancecnt.com/en/buy-sell-crypto" imgSrc={Binance}>
              Binance Connect
            </Button>
            <Button href={externalLinks.buyAmp.banxa} imgSrc={Banxa}>
              Banxa
            </Button> */}
          </div>
        </div>
      </div>
    </Card>
  );
}
