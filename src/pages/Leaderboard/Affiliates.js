// OverallLeaderboard.js
import React from 'react';
import { FaTrophy } from "react-icons/fa";
import { Trans } from "@lingui/macro";

const AffiliatesLeaderboard = ({ leaderboardData }) => (
  <div>
    <div className="leaderboard-card section-center mt-medium">
      <h2 className="title font-kufam">
        <Trans>Affiliates Leaderboard</Trans>
      </h2>
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Trader</th>
              <th>Trading Volume USDT</th>
              <th>Affiliates</th>
              <th>Liquidity Added</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr key={index}>
                <td className="glass-effect">
                  {entry.rank <= 3 ? <FaTrophy className={`trophy rank-${entry.rank}`} /> : entry.rank}
                </td>
                <td className="glass-effect">{entry.trader}</td>
                <td className="glass-effect">
                  {entry.volume.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="glass-effect reward">
                  {entry.volume.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="glass-effect">{entry.reward.toFixed(2)} USDT</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AffiliatesLeaderboard;