import React from "react";
import cx from "classnames";
import { t } from "@lingui/macro";
import "./Footer.css";
import logoImg from "img/logo.svg";
import twitterIcon from "img/x.svg";
import discordIcon from "img/discord.svg";
import telegramIcon from "img/ic_telegram.svg";
import gitbookIcon from "img/ic_gitbook.svg";
import mediumIcon from "img/ic_medium.svg";
import githubIcon from "img/github.svg";
import { NavLink } from "react-router-dom";
import { isHomeSite } from "lib/legacy";

const footerLinks = {
  home: [
    { text: t`Terms and Conditions`, link: "/terms-and-conditions" },
    { text: t`Referral Terms`, link: "https://amped.gitbook.io/amped/referrals", external: true },
    { text: t`Media Kit`, link: "https://amped.gitbook.io/amped/", external: true },
    // { text: "Jobs", link: "/jobs", isAppLink: true },
  ],
  app: [
    { text: t`Terms and Conditions`, link: "/terms-and-conditions" },
    { text: t`Referral Terms`, link: "/referral-terms" },
    { text: t`Media Kit`, link: "https://amped.gitbook.io/amped/", external: true },
    // { text: "Jobs", link: "/jobs" },
  ],
};

const socialLinks = [
  { link: "https://twitter.com/ampedfinance", name: "Twitter", icon: twitterIcon },
  { link: "https://medium.com/@ampedfinance", name: "Medium", icon: mediumIcon },
  { link: "https://amped.gitbook.io", name: "Gitbook", icon: gitbookIcon },
  { link: "https://t.me/ampedfinance", name: "Telegram", icon: telegramIcon },
  { link: "https://discord.gg/nNKqweuAXj", name: "Discord", icon: discordIcon },
  { link: "https://github.com/amped-finance", name: "Github", icon: githubIcon },

];

type Props = { showRedirectModal?: (to: string) => void; redirectPopupTimestamp?: () => void };

export default function Footer({ showRedirectModal, redirectPopupTimestamp }: Props) {
  const isHome = isHomeSite();

  return (
    <div className="Footer">
      <div className={cx("Footer-wrapper", { home: isHome })}>
        <div className="Footer-logo">
          <img src={logoImg} alt="MetaMask" />
        </div>
        <div className="Footer-social-link-block">
          {socialLinks.map((platform) => {
            return (
              <a
                key={platform.name}
                className="App-social-link"
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={platform.icon} alt={platform.name} />
              </a>
            );
          })}
        </div>
        <div className="Footer-links">
          {/* {footerLinks[isHome ? "home" : "app"].map(({ external, text, link }) => {
            if (external) {
              return (
                <a key={text} target="_blank" href={link} className="Footer-link" rel="noopener noreferrer">
                  {text}
                </a>
              );
            }
            return (
              <NavLink key={link} to={link} className="Footer-link" activeClassName="active">
                {text}
              </NavLink>
            );
          })} */}
          © 2023 Amped Finance. All rights reserved
        </div>
      </div>
    </div>
  );
}
