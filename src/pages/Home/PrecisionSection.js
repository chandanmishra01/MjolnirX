import React, { useState, useRef, useEffect } from 'react';
import './PrecisionSection.css'

const PrecisionSection = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Features data
  const features = [
    {
      id: 'precision',
      title: 'Precision Trading',
      description: 'Open positions with precision using our smart order types and streamlined, easy-to-use interface.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #ff6c15, #ff8c42)'
    },
    {
      id: 'liquidity',
      title: 'Deep Liquidity',
      description: 'Tap into deep liquidity for seamless entries and exits—even in the most volatile market conditions.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M6 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4.22 19.37-.95-.32c-.78-.26-1.6-.6-2.27-1.18s-1.29-1.31-1.53-2.17c-.18-.65-.33-1.38-.33-2.2V9.5c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2V16l5.29-5.29c.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83L14.73 19c-.39.39-.9.58-1.41.58s-1.02-.19-1.41-.58l-2.83-2.83z"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #ff4500, #ff6c15)'
    },
    {
      id: 'cost',
      title: 'Cost-efficient',
      description: 'Our platform optimizes your capital by minimizing fees and boosting both efficiency and profitability.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #ff8c42, #ffa366)'
    },
    {
      id: 'transparent',
      title: 'Transparent',
      description: 'Our platform guarantees complete transparency, building trust and integrity into every trade.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #ff6c15, #ff4500)'
    }
  ];
  // Intersection Observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleCardHover = (cardId) => {
    setHoveredCard(cardId);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <section 
      ref={sectionRef}
      className={`precision-section ${isVisible ? 'animate-in' : ''}`}
    >
      {/* Background Effects */}
      <div className="section-background">
        <div className="geometric-shapes">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`geometric-shape shape-${i + 1}`}
            />
          ))}
        </div>
        
        <div className="mesh-gradient"></div>
        
        <div className="subtle-lines">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`line line-${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
          Engineered for <span className="highlight">Accuracy</span>
          </h2>
          <p className="section-subtitle">
          Our platform blends advanced technology with a user-friendly design to provide a seamless trading experience for both beginners and seasoned traders.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`feature-card ${hoveredCard === feature.id ? 'hovered' : ''}`}
              onMouseEnter={() => handleCardHover(feature.id)}
              onMouseLeave={handleCardLeave}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="card-background">
                <div className="card-glow"></div>
                <div className="card-border"></div>
              </div>

              <div className="card-content">
                <div className="icon-container">
                  <div className="icon-background" style={{ background: feature.gradient }}>
                    <span className="feature-icon">{feature.icon}</span>
                  </div>
                  <div className="icon-pulse"></div>
                </div>

                <div className="text-content">
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-description">{feature.description}</p>
                </div>

                <div className="card-footer">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <div className="learn-more">
                    {/* <span>Learn more</span> */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path 
                        d="M6 3L11 8L6 13" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover Effects */}
              <div className="hover-effects">
                <div className="corner-accent top-left"></div>
                <div className="corner-accent top-right"></div>
                <div className="corner-accent bottom-left"></div>
                <div className="corner-accent bottom-right"></div>
              </div>
            </div>
          ))}
        </div>    
      </div>
    </section>
  );
};

export default PrecisionSection;