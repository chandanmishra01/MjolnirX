import React, { useMemo } from "react";
import { Trans } from "@lingui/macro";
import cx from "classnames";

import { useAllPositions } from "domain/legacy";
import { USD_DECIMALS } from "lib/legacy";

import "./PositionsOverview.css";
import { formatAmount } from "lib/numbers";
import { useChainId } from "lib/chains";
import { getTimeRemaining } from "lib/dates";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";
import { ethers } from "ethers"

export default function PositionsOverview() {
  const { chainId } = useChainId();
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])

  const positions = useAllPositions(chainId, library);

  return (
    <div className="Positions-overview">
      <p>
        <Trans>
          Open positions: {positions.length}
          <br />
          Under risk: {positions.filter((p) => p.danger).length}
        </Trans>
      </p>
      <table className="Positions-overview-table">
        <thead>
          <tr>
            <th>
              <Trans>account</Trans>
            </th>
            <th>
              <Trans>size</Trans>
            </th>
            <th>
              <Trans>collateral</Trans>
            </th>
            <th>
              <Trans>fee</Trans>
            </th>
            <th>
              <Trans>time to liq</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {positions &&
            positions
              .filter((p) => p.danger)
              .map((position) => {
                const { size, account, collateral, fee, danger } = position;

                const diffToLiq = position.collateral.sub(position.fee);
                const fundingFee = 80;
                const feesPerHour = position.size.mul(fundingFee).div(1000000);
                const hoursToLiq = diffToLiq.div(feesPerHour);
                const liqTime = hoursToLiq.toNumber() * 60 * 60 + Date.now() / 1000;
                return (
                  <tr>
                    <td>{account}</td>
                    <td>${formatAmount(size, USD_DECIMALS, 2, true)}</td>
                    <td>${formatAmount(collateral, USD_DECIMALS, 2, true)}</td>
                    <td className={cx({ negative: danger })}>${formatAmount(fee, USD_DECIMALS, 2, true)}</td>
                    <td>
                      {getTimeRemaining(liqTime)} (${formatAmount(feesPerHour, USD_DECIMALS, 2, true)}/h)
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
