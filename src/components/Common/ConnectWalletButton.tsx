import { ReactNode } from "react";
import cx from "classnames";
import "./Button.css";

type Props = {
  imgSrc?: string;
  children: ReactNode;
  onClick: () => void;
  className?: string;
};

export default function ConnectWalletButton({ imgSrc, children, onClick, className }: Props) {
  let classNames = cx("btn btn-primary btn-sm connect-wallet button-secondary btn-header", className);
  return (
    <button className={classNames} onClick={onClick}>
      {imgSrc && <img className="btn-image" src={imgSrc} alt="Connect Wallet" />}
      <span className="btn-label-connect">{children}</span>
    </button>
  );
}
