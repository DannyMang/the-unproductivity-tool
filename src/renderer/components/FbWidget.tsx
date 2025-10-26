import React, { useState } from 'react';
import './FbWidget.css';
import fbMarketIcon from '../../../assets/images/fbmarketicon.png';
import ryanHeadshot from '../../../assets/images/ryanheadshot.jpg';
import ryanNya from '../../../assets/images/ryannya.jpg';
import animeRyan from '../../../assets/images/animeryan.jpg';

function FbWidget() {
  // Example data for multiple offers
  const offers = [
    { priceListed: 100, priceOffered: 90, status: 'Offer Sent', headshot: ryanHeadshot },
    { priceListed: 200, priceOffered: 180, status: 'Successful', headshot: ryanNya },
    { priceListed: 150, priceOffered: 130, status: 'Pending', headshot: animeRyan },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="widgetContainer">
      <div className="normFlex">
        <img id="fbicon" src={fbMarketIcon} alt="Facebook Marketplace" />
        <div>
          <h2>Lowballer</h2>
          <p id="fbstatus">Active</p>
        </div>
      </div>

      {/* Carousel implementation */}
      <button onClick={handlePrev} className="carouselButton">‹</button>
      <div className="carousel">
        <div>
          <div className="normFlex">
            <img
              id="ryanheadshot"
              src={offers[currentIndex].headshot}
              alt="Ryan Headshot"
            />
            <div className="spacedFlexColumn">
              <div>
                <p>Price Listed: {offers[currentIndex].priceListed}</p>
                <p>Price Offered: {offers[currentIndex].priceOffered}</p>
              </div>
              <div>
                <p>Status:</p>
                <p id="fbstatus">{offers[currentIndex].status}</p>
              </div>
            </div>
          </div>

          <div className="carouselCounter">
            {currentIndex + 1} / {offers.length}
          </div>
        </div>
      </div>
      <button onClick={handleNext} className="carouselButton">›</button>
    </div>
  );
}

export default FbWidget;
