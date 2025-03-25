// OverallLeaderboard.js
import React from "react";
import { FaTrophy } from "react-icons/fa";
import { Trans } from "@lingui/macro";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import "./Leaderboard.css";

const TradersLeaderboard = ({ leaderboardData }) => {
  const { isConnected: active, address: walletAccount } = useWeb3ModalAccount();
  const top10Traders = leaderboardData.slice(0, 10);

  return (
    <div>
      <div className="leaderboard-card section-center mt-medium">
        <h2 className="title font-kufam">
          <Trans>Traders Leaderboard</Trans>
        </h2>
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Trader</th>
                <th>Trading Volume</th>
              </tr>
            </thead>
            <tbody>
              {top10Traders.map((entry, index) => (
                <tr key={index}>
                  <td className="glass-effect">
                    {index + 1 <= 3 ? <FaTrophy className={`trophy rank-${index + 1}`} /> : index + 1}
                  </td>
                  <td className="glass-effect">{entry[0]}</td>
                  <td className="glass-effect reward">{parseFloat(entry[1]).toFixed(2)}</td>
                </tr>
              ))}
              {active && (
                <tr className="ownrecord">
                  <td className="glass-effect">
                    {leaderboardData.findIndex(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) != -1
                      ? leaderboardData.findIndex(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) + 1
                      : "-"}
                  </td>
                  <td className="glass-effect">{walletAccount}</td>
                  <td className="glass-effect">
                    {leaderboardData?.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase())
                      ? parseFloat(leaderboardData?.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase())[1]).toFixed(2)
                      : 0}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradersLeaderboard;
