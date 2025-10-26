import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './FbWidget.css';
import fbMarketIcon from '../../../assets/images/fbmarketicon.png';
import ryanHeadshot from '../../../assets/images/ryanheadshot.jpg';
import ryanNya from '../../../assets/images/ryannya.jpg';
import animeRyan from '../../../assets/images/animeryan.jpg';

function FbWidget({ isMinimized, onMinimizeToggle }) {
  // Example data for multiple offers
  const offers = [
    { priceListed: 100, priceOffered: 90, status: 'Offer Sent', statusColor: 'orange', headshot: ryanHeadshot },
    { priceListed: 200, priceOffered: 180, status: 'Successful', statusColor: 'green', headshot: ryanNya },
    { priceListed: 150, priceOffered: 130, status: 'Pending', statusColor: 'yellow', headshot: animeRyan },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`widgetContainer ${isMinimized ? 'minimized' : ''}`}>
      <div className="widgetHeader">
        <div className="normFlex">
          <img id="fbicon" src={fbMarketIcon} alt="Facebook Marketplace" />
          {!isMinimized && (
            <div>
              <h2>Lowballer</h2>
              <p id="fbstatus">Active</p>
            </div>
          )}
        </div>
        <button onClick={onMinimizeToggle} className="hideButton">
          {isMinimized ? 'Show' : 'Hide'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="carousel">
            <button onClick={handlePrev} className="carouselButton">
              <ChevronLeft size={18} />
            </button>
            <div className="carouselContent">
              <div className="normFlex">
                <img
                  id="ryanheadshot"
                  src={offers[currentIndex].headshot}
                  alt="Ryan Headshot"
                />
                <div className="spacedFlexColumn">
                  <div className="priceSection">
                    <p className="priceLabel">Listed:</p>
                    <p className="priceValue">${offers[currentIndex].priceListed}</p>
                  </div>
                  <div className="priceSection">
                    <p className="priceLabel">Offered:</p>
                    <p className="priceValue">${offers[currentIndex].priceOffered}</p>
                  </div>
                  <div className="statusSection">
                    <p className="statusLabel">Status:</p>
                    <p className={`statusBadge status-${offers[currentIndex].statusColor}`}>
                      {offers[currentIndex].status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="carouselButton">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="carouselProgress">
            {offers.map((_, index) => (
              <div
                key={index}
                className={`progressDot ${index === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FbWidget;
