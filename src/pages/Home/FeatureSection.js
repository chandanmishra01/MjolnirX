import React, { useState } from 'react';
import './FeatureSection.css';

const FeatureSection = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('15m');
  const [activeTab, setActiveTab] = useState('Positions');
  const [activeTradeTab, setActiveTradeTab] = useState('Short');
  const [activeOrderType, setActiveOrderType] = useState('Market');
  const [payAmount, setPayAmount] = useState('0.0');
  const [shortAmount, setShortAmount] = useState('0.0');

  const timeframes = ['1m', '5m', '15m', '1h'];
  const panelTabs = ['Positions', 'Orders', 'Trades'];
  const tradeTabs = ['Long', 'Short', 'Swap'];
  const orderTypes = ['Market', 'Limit', 'Trigger'];

  const features = [
    'Advanced charting tools',
    'One-click position management',
    'Real-time market data',
    'Customizable workspace'
  ];

  return (
    <div className="features">
      <div className="bg-elements">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
      </div>

      <div className="features-container">
        <div className="features-content">
          <div className="content-left">
            <h1 className="features-title">
            Own Every  <span className="features-title-confidence">Trade</span>
            </h1>
            
            <p className="features-description">
              Our clean, powerful interface puts everything you need at your fingertips. 
              Open positions, monitor markets, and execute trades with precision and ease.
            </p>
            
            <ul className="features-list">
              {features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-bullet"></div>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>
            
            <a href="#" className="cta-button">Explore Platform</a>
          </div>
          
          <div className="dashboard-preview">
            <div className="dashboard-mockup">
              {/* Dashboard Header */}
              {/* <div className="dashboard-header">
                <div className="dashboard-logo">
                  <div className="logo-icon"></div>
                  <span>Positions Exchange</span>
                </div>
                <div className="nav-items">
                  <span>Dashboard</span>
                  <span>Earn</span>
                  <span>Buy</span>
                  <span>Leaderboard</span>
                  <span>Referrals</span>
                </div>
                <div className="header-buttons">
                  <button className="trade-btn">Trade</button>
                  <button className="connect-btn">Connect Wallet</button>
                </div>
              </div> */}

              <div className="dashboard-content">
                {/* Chart Section */}
                <div className="chart-section">
                  <div className="chart-header">
                    <div className="symbol-info">
                      <span className="symbol-name">🟡 ETHUSDT</span>
                      <div className="timeframes">
                        {timeframes.map(tf => (
                          <button 
                            key={tf}
                            className={`timeframe ${activeTimeframe === tf ? 'active' : ''}`}
                            onClick={() => setActiveTimeframe(tf)}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span>📊 Indicators</span>
                  </div>
                  
                  <div className="chart-area">
                    <div className="price-chart">
                      <div className="chart-line"></div>
                    </div>
                  </div>
                  
                  <div className="bottom-panel">
                    <div className="panel-tabs">
                      {panelTabs.map(tab => (
                        <span 
                          key={tab}
                          className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </span>
                      ))}
                    </div>
                    <div className="positions-table">
                      No open positions
                    </div>
                  </div>
                </div>

                {/* Trading Panel */}
                <div className="trading-panel">
                  <div className="trade-tabs">
                    {tradeTabs.map(tab => (
                      <button 
                        key={tab}
                        className={`trade-tab ${tab.toLowerCase()} ${activeTradeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTradeTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="order-types">
                    {orderTypes.map(type => (
                      <span 
                        key={type}
                        className={`order-type ${activeOrderType === type ? 'active' : ''}`}
                        onClick={() => setActiveOrderType(type)}
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Pay</label>
                    <div className="input-row">
                      <input 
                        type="text" 
                        className="amount-input" 
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                      />
                      <select className="currency-select">
                        <option>USDT</option>
                        <option>ETH</option>
                        <option>BTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Short</label>
                    <div className="input-row">
                      <input 
                        type="text" 
                        className="amount-input" 
                        value={shortAmount}
                        onChange={(e) => setShortAmount(e.target.value)}
                      />
                      <select className="currency-select">
                        <option>BTC</option>
                        <option>ETH</option>
                        <option>USDT</option>
                      </select>
                    </div>
                  </div>

                  <div className="leverage-section">
                    <label className="input-label">Leverage slider</label>
                    <div className="leverage-slider">
                      <div className="leverage-handle"></div>
                    </div>
                  </div>

                  <div className="trade-details">
                    <div className="detail-row">
                      <span>Collateral In</span>
                      <span>USDT</span>
                    </div>
                    <div className="detail-row">
                      <span>Leverage</span>
                      <span>-</span>
                    </div>
                    <div className="detail-row">
                      <span>Entry Price</span>
                      <span>$15</span>
                    </div>
                    <div className="detail-row">
                      <span>Liq. Price</span>
                      <span>-</span>
                    </div>
                    <div className="detail-row">
                      <span>Fees</span>
                      <span>-</span>
                    </div>
                  </div>

                  <button className="connect-wallet-main">Connect Wallet</button>

                  <div className="short-info">
                    <div className="short-title">Long ETH</div>
                    <div className="detail-row">
                      <span>Entry Price</span>
                      <span>$0.000015</span>
                    </div>
                    <div className="detail-row">
                      <span>Exit Price</span>
                      <span>$0.000015</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;