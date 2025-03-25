import React from "react";
import { Trans } from "@lingui/macro";
import Footer from "components/Footer/Footer";
import "./Buy.css";
import TokenCard from "components/TokenCard/TokenCard";
import buyAMPIcon from "img/buy_amp.svg";
import SEO from "components/Common/SEO";
import { getPageTitle } from "lib/legacy";

export default function BuyAMPALP() {
  return (
    <SEO title={getPageTitle("Buy ALP or AMP")}>
      <div className="BuyAMPALP page-layout">
        <div className="BuyAMPALP-container default-container">
          <div className="section-title-block">
            <div className="section-title-icon">
              <img src={buyAMPIcon} alt="buyAMPIcon" />
            </div>
            <div className="section-title-content">
              <div className="Page-title font-kufam">
                <Trans>Buy AMP or ALP</Trans>
              </div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
