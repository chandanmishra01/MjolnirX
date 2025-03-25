import React, { useState, useEffect }  from "react";
import { ethers } from "ethers";
import "./Leaderboard.css";
import { FaTrophy } from "react-icons/fa";
import { BsFillDiamondFill } from "react-icons/bs";
import { useLocalStorage } from "react-use";
import { Trans, t } from "@lingui/macro";
import SEO from "components/Common/SEO";
import { getPageTitle, isHashZero } from "lib/legacy";
import ExternalLink from "components/ExternalLink/ExternalLink";
import Footer from "components/Footer/Footer";
import Tab from "components/Tab/Tab";
import { LEADERBOARD_SELECTED_TAB_KEY } from "config/localStorage";
import OverallLeaderboard from "./OverallLeaderboard";
import TradersLeaderboard from "./Trader";
import AffiliatesLeaderboard from "./Affiliates";
import LiquidityLeaderboard from "./Liquidity";
import { useAlpPoints, useAlpPointsRemoval, useOrderPoints, useTradePoints } from "domain/legacy";
import { useChainId } from "lib/chains";
import { startBlock, endBlock } from "domain/legacy";

const TOTAL = "Total";
const TRADERS = "Traders";
const AFFILIATES = "Affiliates";
const ALP = "ALP";
// const TAB_OPTIONS = [TOTAL, TRADERS, AFFILIATES, ALP];
const TAB_OPTIONS = [TOTAL, TRADERS, ALP];

function Leaderboard() {
  const { chainId } = useChainId();
  const alpPoints = useAlpPoints(chainId);
  const alpPointsRemoval = useAlpPointsRemoval(chainId);
  const orderPoints = useOrderPoints(chainId);
  const tradePoints = useTradePoints(chainId);

  const [blockNumber, setBlockNumber] = useState(null);

  useEffect(() => {
    const provider = new ethers.providers.JsonRpcProvider("https://replicator.phoenix.lightlink.io/rpc/v1");
    provider.getBlockNumber()
      .then(blockNumber => {
        console.log("current block no", blockNumber);
        setBlockNumber(blockNumber);
      })
      .catch(error => {
        console.error("Error fetching block number:", error);
      });
  }, []);

  const allALpPoints = alpPoints?.concat(alpPointsRemoval);
  const groupedALpPoints = {};
  allALpPoints?.forEach((item) => {
    if (item) {
      if (!groupedALpPoints[item.account]) {
        groupedALpPoints[item.account] = 0;
      }
      if (item.type === 1) {
        console.log((blockNumber - item.blockNumber) / 7200)
        groupedALpPoints[item.account] += (Number(item.points) / 10 ** 30) * (0.2 * ((blockNumber - item.blockNumber) / 7200));
      }
      else if (item.type === 2) {
        groupedALpPoints[item.account] -= (Number(item.points) / 10 ** 30) * (0.2 * ((blockNumber - item.blockNumber) / 7200));
      }
    }
  });
  const groupedALpPointsArray = Object.entries(groupedALpPoints);
  groupedALpPointsArray.sort((a, b) => b[1] - a[1]);
  // const top10ALpAccounts = groupedALpPointsArray.slice(0, 10);

  const allTradePoints = tradePoints?.concat(orderPoints);
  const groupedTradePoints = {};
  allTradePoints?.forEach((item) => {
    if (item) {
      if (!groupedTradePoints[item.account]) {
        groupedTradePoints[item.account] = 0;
      }
      groupedTradePoints[item.account] += Number(item.points) / 10 ** 30 * 2.5;
    }
  });
  const groupedTradePointsArray = Object.entries(groupedTradePoints);
  groupedTradePointsArray.sort((a, b) => b[1] - a[1]);
  // const top10Traders = groupedTradePointsArray.slice(0, 10);

  const overallLeaderboardData = groupedTradePointsArray.concat(groupedALpPointsArray);
  const groupedOverallLeaderboardData = overallLeaderboardData.reduce((acc, [address, value]) => {
    // If the address already exists in the accumulator, add the value
    if (acc[address]) {
      acc[address] += value;
    } else {
      // Otherwise, initialize it with the value
      acc[address] = value;
    }
    return acc;
  }, {});
  const overallLeadetboardDataArray = Object.entries(groupedOverallLeaderboardData);
  overallLeadetboardDataArray.sort((a, b) => b[1] - a[1]);
  console.log("Overall Leaderboard Data", overallLeadetboardDataArray);

  const [activeTab, setActiveTab] = useLocalStorage(LEADERBOARD_SELECTED_TAB_KEY, TOTAL);
  const TAB_OPTION_LABELS = {
    [TOTAL]: t`Overall`,
    [TRADERS]: t`Traders`,
    [AFFILIATES]: t`Affiliates`,
    [ALP]: t`Liquidity`,
  };

  const renderOverallTab = () => <OverallLeaderboard leaderboardData={overallLeadetboardDataArray} tradePoints={groupedTradePointsArray} alpPoints={groupedALpPointsArray} />;

  const renderTradersTab = () => <TradersLeaderboard leaderboardData={groupedTradePointsArray} />;

  const renderAffiliatesTab = () => <AffiliatesLeaderboard leaderboardData={overallLeadetboardDataArray} />;

  const renderLiquidityTab = () => <LiquidityLeaderboard leaderboardData={groupedALpPointsArray} />;

  const renderContent = () => {
    switch (activeTab) {
      case TOTAL:
        return renderOverallTab();
      case TRADERS:
        return renderTradersTab();
      case AFFILIATES:
        return renderAffiliatesTab();
      case ALP:
        return renderLiquidityTab();
      default:
        return null;
    }
  };

  return (
    <SEO title={getPageTitle("Leaderboard")}>
      <div className="default-container page-layout Leaderboard" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "100vh" }}>
        <div className="section-title-block" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div className="section-title-icon" />
          <div className="section-title-content">
            <div className="Page-title font-kufam" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaTrophy className="trophy-icon" />
              <Trans>Leaderboard</Trans>
            </div>
            <div className="Page-description" style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
              <Trans>
                <div style={{ marginBottom: "16px" }}>
                  Compete among other traders on the Amped Finance Leaderboard and earn exciting rewards.
                </div>
                <div style={{ marginBottom: "16px" }}>
                  For more information, please read the{" "}
                  <ExternalLink href="https://medium.com/@ampedfinance/user-guide-for-trading-leaderboard-dc380228cdc4">Leaderboard Guide</ExternalLink> for details.
                </div>
                <div style={{ marginBottom: "16px" }}>
                  Season 1 will commence on Monday the 9th of September and conclude on Monday the 30th of September.
                </div>
                <div>
                  There are 50,000 LL tokens to be distributed among participants who make the leaderboard! The higher your rank, the more you will receive.
                </div>
              </Trans>
            </div>
          </div>
        </div>

        {/* Center the tab container but keep buttons their original size */}
        <div className="leaderboard-tab-container" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <Tab
            options={TAB_OPTIONS}
            optionLabels={TAB_OPTION_LABELS}
            option={activeTab}
            setOption={setActiveTab}
            onChange={setActiveTab}
          />
        </div>
        {renderContent()}
      </div>
      <Footer />
    </SEO>
  );
}

export default Leaderboard;
