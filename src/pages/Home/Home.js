import React, { useState, useEffect, useRef } from "react";
import PrecisionSection from "./PrecisionSection";
import Footer from "components/Footer/Footer";
import FeatureSection from "./FeatureSection";
import "./Home.css";
import CTACard from "./CTACard";
import logo from "img/logo.svg"
// import btcLogo from "./img/btc.svg";
// import ethLogo from "./img/eth.svg";
// import usdtLogo from "./img/usdt.svg";

export default function Home() {
  const [activeChain, setActiveChain] = useState(null);

  const chains = [
    { id: 'btc', name: 'Bitcoin', logo: "/img/btc.svg", class: 'node-eth' },
    { id: 'eth', name: 'Ethereum', logo: "/img/eth.svg", class: 'node-bsc' },
    { id: 'usdt', name: 'Tether', logo: "/img/usdt.svg", class: 'node-polygon' },
    { id: 'usdc', name: 'USDC', logo: "/img/usdc.png", class: 'node-usdc' },
  ];

  const features = [
    { icon: '⚡', text: 'Zero gas fees on all trades' },
    { icon: '🔗', text: 'Cross-chain perpetual swaps' },
    { icon: '💧', text: 'Deep liquidity pools' },
    { icon: '🛡️', text: '100% decentralized protocol' }
  ];

  const metrics = [
    { value: '$10M+', label: 'Trading Volume' },
    { value: '100+', label: 'Active Trader' },
    { value: '0.01%', label: 'Lowest Fees' }
  ];

  const handleChainHover = (chainId) => setActiveChain(chainId);
  const handleChainLeave = () => setActiveChain(null);

  return (
    <>
      <div className="hero-wrapper">
        {/* Background Effects */}
        <div className="chain-network">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="chain-link" style={{ animationDelay: `-${(i + 1) * 0.5}s` }} />
          ))}
        </div>
        <div className="pattern-overlay"></div>

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <div className="hero-badge">
                  <span>⚡</span> Native DeFi
                </div>

                <h1 className="hero-title">
                  Forged For <span className="highlight">Perpetuals</span> Powered By <span className="highlight">Hemi</span>
                </h1>

                <p className="hero-subtitle">
                Trade perpetuals with precision and speed — forged on Mjolnir, powered by Hemi for instant execution, deep liquidity, and multi-chain performance.
                </p>

                {/* <div className="features-list">
                  {features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <div className="feature-icon">{feature.icon}</div>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div> */}

                <div className="hero-actions">
                  <a href="#/trade" className="btn btn-primary btn-hero">Start Trading →</a>
                  <a href="#" className="btn btn-outline btn-hero">View Docs</a>
                </div>

                <div className="metrics-row">
                  {metrics.map((metric, index) => (
                    <div key={index} className="metric">
                      <span className="metric-value">{metric.value}</span>
                      <span className="metric-label">{metric.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="multichain-visual">
                <div className="chains-container">
                  

                  {/* Chain Orbits */}
                  <div className="chain-orbit orbit-1">
                    {chains.slice(0, 1).map((chain) => (
                      <div
                        key={chain.id}
                        className={`chain-node ${chain.class} ${activeChain === chain.id ? 'active' : ''}`}
                        onMouseEnter={() => handleChainHover(chain.id)}
                        onMouseLeave={handleChainLeave}
                        title={chain.name}
                      >
                        <div className="chain-logo">
        <img
          src={chain.logo}
          alt={`${chain.name} Logo`}
          className="chain-logo-img"
        />
      </div>
                      </div>
                    ))}
                  </div>

                  <div className="chain-orbit orbit-2">
                    {chains.slice(1, 2).map((chain) => (
                      <div
                        key={chain.id}
                        className={`chain-node ${chain.class} ${activeChain === chain.id ? 'active' : ''}`}
                        onMouseEnter={() => handleChainHover(chain.id)}
                        onMouseLeave={handleChainLeave}
                        title={chain.name}
                      >
                          <div className="chain-logo">
        <img
          src={chain.logo}
          alt={`${chain.name} Logo`}
          className="chain-logo-img"
        />
      </div>
                      </div>
                    ))}
                  </div>

                  <div className="chain-orbit orbit-3">
                    {chains.slice(2, 4).map((chain) => (
                      <div
                        key={chain.id}
                        className={`chain-node ${chain.class} ${activeChain === chain.id ? 'active' : ''}`}
                        onMouseEnter={() => handleChainHover(chain.id)}
                        onMouseLeave={handleChainLeave}
                        title={chain.name}
                      >
                          <div className="chain-logo">
        <img
          src={chain.logo}
          alt={`${chain.name} Logo`}
          className="chain-logo-img"
          width={"45px"}
        />
      </div>
                      </div>
                    ))}
                  </div>

                  <div className="chain-node node-center">
  <div className="center-logo">
    <img src={logo} alt="Mjolnir Logo" className="center-logo-img" />
  </div>
</div>

                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`connection-line line-${i + 1}`}
                      style={{ animationDelay: `-${(i + 1) * 0.5}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PrecisionSection />
      <FeatureSection/>
      <CTACard/>
      <Footer />
    </>
  );
}
