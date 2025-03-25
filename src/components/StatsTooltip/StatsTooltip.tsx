import { Trans } from "@lingui/macro";
import { BigNumber } from "ethers";
import { USD_DECIMALS } from "lib/legacy";
import "./StatsTooltip.css";
import { formatAmount } from "lib/numbers";
import { getChainName } from "config/chains";
import { useChainId } from "lib/chains";

type Props = {
  title: string;
  total?: BigNumber;
  goerliValue?: BigNumber;
  baseValue?: BigNumber;
  showDollar?: boolean;
  decimalsForConversion: number;
  symbol: string;
  isFloatNum?: boolean;
};

export default function StatsTooltip({
  title,
  total,
  goerliValue,
  baseValue,
  showDollar = true,
  decimalsForConversion = USD_DECIMALS,
  symbol,
  isFloatNum = false,
}: Props) {
  const { chainId } = useChainId()
  return (
    <>
      <p className="Tooltip-row">
        <span className="label">
          {`On ${getChainName(chainId)}:`}
        </span>
        <span className="amount">
          {!isFloatNum && showDollar && "$"}
          {isFloatNum && ""+ baseValue}
          {!isFloatNum && formatAmount(baseValue, decimalsForConversion, 0, true)}
          {!showDollar && symbol && " " + symbol}
        </span>
      </p>
      {/* <p className="Tooltip-row">
        <span className="label">
          <Trans>{title} on Goerli:</Trans>
        </span>
        <span className="amount">
          {!isFloatNum && showDollar && "$"}
          {isFloatNum && ""+goerliValue}
          {!isFloatNum && formatAmount(goerliValue, decimalsForConversion, 0, true)}
          {!showDollar && symbol && " " + symbol}
        </span>
      </p> */}
      <div className="Tooltip-divider" />
      <p className="Tooltip-row">
        <span className="label">
          <Trans>Total:</Trans>
        </span>
        <span className="amount">
          {!isFloatNum && showDollar && "$"}
          {isFloatNum && "" + total}
          {!isFloatNum && formatAmount(total, decimalsForConversion, 0, true)}
          {!showDollar && symbol && " " + symbol}
        </span>
      </p>
    </>
  );
}
