import React from "react";
import Footer from "components/Footer/Footer";
import "./Home.css";

import discord from "img/home/discord.svg";
import telegram from "img/home/telegram.svg";
import twitter from "img/home/x.svg";
import github from "img/home/github.svg";

import benefit1 from "img/home/benefit-1.svg";
import benefit2 from "img/home/benefit-2.svg";
import benefit3 from "img/home/benefit-3.svg";
import benefit4 from "img/home/benefit-4.svg";

import earning1 from "img/home/earning-1.svg";
import earning2 from "img/home/earning-2.svg";
import earning3 from "img/home/earning-3.svg";

import arrow from "img/home/arrow.svg";

import video from "img/home/video.mp4";
import macbook from "img/home/macbook.png";
import iphone from "img/home/iphone.png";
import rectangle from "img/home/rectangle.png";

import bg1 from "img/home/bg-1.png";
import bg2 from "img/home/bg-2.png";

import logoImg from "img/logo_with_name.svg";
import { Link } from "react-router-dom";

export default function Home() {
  const dataBenefits = [
    {
      title: "Transparent",
      icon: benefit1,
      des: "Our platform ensures that every trade, transaction, and operation is openly visible, fostering trust and integrity in your trading journey.",
    },
    {
      title: "Fast",
      icon: benefit2,
      des: "The cutting-edge technology of the LightLink network guarantees lightning-fast transaction confirmations, making trading exceptionally quick.",
    },
    {
      title: "Cost-efficient",
      icon: benefit3,
      des: "Our gas-free trading environment means more of your investment goes into trading, not fees, making your trading experience cost-efficient and more profitable.",
    },
    {
      title: "Amplify your crypto",
      icon: benefit4,
      des: "Amplify your trading potential with leveraged trading on Amped Finance. Our platform allows for significant leverage, giving you the power to maximize your trading strategy and potential returns.",
    },
  ];

  const dataEarning = [
    {
      title: "Stake",
      icon: earning1,
      des: "Stake AMP tokens to rewards: a share in 30% of protocol fees, escrowed AMP (esAMP) for further staking or vesting, and Multiplier Points (MP) to boost yields without inflation.",
      link: "/earn",
    },
    {
      title: "Provision",
      icon: earning2,
      des: "Contribute to the ALP pool for impermanent loss-free liquidity provision, earning 70% of protocol fees and esAMP tokens, with the flexibility to withdraw anytime.",
      link: "/earn",
    },
    {
      title: "Trade",
      icon: earning3,
      des: "Engage in perpetual swaps trading with up to 8x leverage, maximizing trading potential and returns on the Amped Finance platform.",
      link: "/trade",
    },
  ];

  return (
    <div className="landing">
      <div className="landing-section-video">
        <div className="landing-top default-container">
          <div className="landing-top-join">Join the on-chain trading revolution</div>
          <div className="landing-top-title font-kufam">
            Instant, Gasless
            <br />
            Decentralised Trading
          </div>
          <div className="landing-top-des">
            Discover just how easy on-chain trading can be, with ultra-fast transactions and zero gas fees. It's not
            just trading – it's a revolution in how perpetual swaps are traded.
          </div>
          <div className="socials default-container">
            <a href="https://discord.gg/nNKqweuAXj" target="_blank">
              <img src={discord} alt="" />
            </a>
            <a href="https://t.me/ampedfinance" target="_blank">
              <img src={telegram} alt="" />
            </a>
            <a href="https://twitter.com/ampedfinance" target="_blank">
              <img src={twitter} alt="" />
            </a>
            <a href="https://github.com/amped-finance" target="_blank">
              <img src={github} alt="" />
            </a>
          </div>
        </div>
        <video autoPlay loop muted playsInline className="landing-video-bg">
          <source src={video} type="video/mp4" />
        </video>
        <div className="landing-bg-top"></div>
        <div className="landing-bg-bottom"></div>
        <div className="landing-bg-left"></div>
        <div className="landing-bg-right"></div>
      </div>
      <div className="landing-video-bottom default-container">
        <img src={logoImg} className="landing-video-bottom-logo" alt="" />
        <div className="landing-video-bottom-content">
          <div className="landing-video-bottom-des">
            Amped Finance offers a seamless, gasless trading experience, coupled with the opportunity to earn by
            providing liquidity. Experience efficient trading and profit sharing in one dynamic platform.
          </div>
          <div className="landing-video-bottom-buttons">
            <Link className="button-secondary" to="/trade">
              Trade
            </Link>
            <Link className="button-primary" to="/earn">
              Earn
            </Link>
          </div>
        </div>
      </div>
      <div className="benefits-section default-container">
        <div className="benefits-title font-kufam">Benefits</div>
        <div className="benefits-des">
          Amped Finance is a decentralised platform offering community-provided liquidity, transparently visible to all.
          The LightLink network provides a gasless trading experience, maximising the efficiency of your capital.
        </div>
        <div className="benefits-list">
          {dataBenefits.map((item, index) => (
            <div className="benefit-item" key={index}>
              <div className="benefit-item-top">
                <div className="benefit-item-title">{item.title}</div>
                <img src={item.icon} alt="" className="benefit-item-img" />
              </div>
              <div className="benefit-item-des">{item.des}</div>
            </div>
          ))}
        </div>
        <div className="gateway">
          <div className="gateway-title font-kufam">Your Gateway to Advanced DeFi Trading</div>
          <div className="gateway-des">
            At Amped Finance, we’re not just building a platform; we’re creating a community where traders can thrive in
            a secure, efficient, and innovative environment. Our alignment with LightLink’s advanced blockchain
            technology ensures that we stay at the forefront of the DeFi revolution.
          </div>
        </div>
        <div className="macbook">
          <img src={macbook} alt="" />
        </div>
      </div>
      <div className="trade-section default-container">
        <div className="trade-title font-kufam">Trade Anywhere</div>
        <div className="trade-des">
          Access the full power of decentralized trading anytime, anywhere, right from your smartphone. Our responsive
          design ensures a seamless, user-friendly experience, keeping you connected to the market at all times.
        </div>
        <div className="trade-content">
          <div className="trade-earning">
            <div className="earning-title font-kufam">Earning Opportunities</div>
            <div className="earning-list">
              {dataEarning.map((item, index) => (
                <div className="earning-item" key={index}>
                  <img className="earning-item-icon" src={item.icon} alt="" />
                  <div className="earning-item-content">
                    <div className="earning-item-content-top">
                      <div className="earning-item-content-title">{item.title}</div>
                      <Link href={item.link}>
                        <img src={arrow} alt="" />
                      </Link>
                    </div>
                    <div className="earning-item-content-des">{item.des}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <img src={iphone} className="trade-iphone" alt="" />
      </div>
      <div className="get-amped-section default-container">
        <div className="rectangle">
          <img src={rectangle} alt="" />
          <div className="rectangle-bg-bottom"></div>
          <div className="rectangle-content">
            <div className="rectangle-title font-kufam">Get Amped</div>
            <div className="rectangle-des">
              Experience the state-of-the-art on-chain trading platform that lets you amplify your crypto.
            </div>
            <Link to="/dashboard" className="btn-lunch-app">
              Launch App
            </Link>
          </div>
        </div>
      </div>
      <div className="landing-bg">
        <img src={bg2} className="landing-bg-2" alt="" />
        <img src={bg1} className="landing-bg-1" alt="" />
      </div>
      <Footer />
    </div>
  );
}
