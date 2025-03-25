// OverallLeaderboard.js
import React from 'react';
import { FaTrophy } from "react-icons/fa";
import { Trans } from "@lingui/macro";
import {
  useWeb3ModalAccount,
} from "@web3modal/ethers5/react";

const OverallLeaderboard = ({ leaderboardData, tradePoints, alpPoints }) => {
  const { isConnected: active, address: walletAccount } = useWeb3ModalAccount();
  const top10OverallAccounts = leaderboardData.slice(0, 10);

  // Function to determine LL Prize based on rank
  const getLLPrize = (rank) => {
    switch (rank) {
      case 1: return "15,000 LL";
      case 2: return "10,000 LL";
      case 3: return "7,500 LL";
      case 4: return "5,000 LL";
      case 5: return "3,500 LL";
      case 6: return "2,500 LL";
      case 7: return "2,000 LL";
      case 8: return "1,750 LL";
      case 9: return "1,500 LL";
      case 10: return "1,250 LL";
      default: return "-";
    }
  };

  return (
    <div>
      <div className="leaderboard-card section-center mt-medium">
        <h2 className="title font-kufam">
          <Trans>Overall Leaderboard</Trans>
        </h2>
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Trader</th>
                <th>Total Points</th>
                <th>Trading Volume</th>
                <th>LP Points</th>
                <th>LL Prize</th>
              </tr>
            </thead>
            <tbody>
              {top10OverallAccounts.map((entry, index) => (
                <tr key={index}>
                  <td className="glass-effect">
                    {index + 1 <= 3 ? <FaTrophy className={`trophy rank-${index + 1}`} /> : index + 1}
                  </td>
                  <td className="glass-effect">{entry[0]}</td>
                  <td className="glass-effect reward">
                    {parseFloat(entry[1]).toFixed(2)}
                  </td>
                  <td className="glass-effect reward">
                    {tradePoints?.find(([address]) => address === entry[0]) ? parseFloat(tradePoints.find(([address]) => address === entry[0])[1]).toFixed(2) : 0}
                  </td>
                  <td className="glass-effect reward">
                    {alpPoints?.find(([address]) => address === entry[0]) ? parseFloat(alpPoints.find(([address]) => address === entry[0])[1]).toFixed(2) : 0}
                  </td>
                  <td className="glass-effect reward">
                    {getLLPrize(index + 1)}
                  </td>
                </tr>
              ))}
              {active && (
                <tr className='ownrecord'>
                  <td className="glass-effect">{(leaderboardData.findIndex(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) != -1) ? leaderboardData.findIndex(([address]) =>  address.toLowerCase() === walletAccount.toLowerCase()) + 1 : '-'}</td>
                  <td className="glass-effect">{walletAccount}</td>
                  <td className="glass-effect">{leaderboardData?.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) ? parseFloat(leaderboardData.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase())[1]).toFixed(2) : 0}</td>
                  <td className="glass-effect">{tradePoints?.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) ? parseFloat(tradePoints.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase())[1]).toFixed(2) : 0}</td>
                  <td className="glass-effect">{alpPoints?.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) ? parseFloat(alpPoints.find(([address]) => address.toLowerCase() === walletAccount.toLowerCase())[1]).toFixed(2) : 0}</td>
                  <td className="glass-effect">
                    {getLLPrize(leaderboardData.findIndex(([address]) => address.toLowerCase() === walletAccount.toLowerCase()) + 1)}
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

export default OverallLeaderboard;
