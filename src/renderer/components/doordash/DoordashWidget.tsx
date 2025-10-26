import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import './DoordashWidget.css';
import doordashLogo from "../../../../assets/images/doordashlogo.png";
import animeRyan from '../../../../assets/images/animeryan.jpg';

function DoordashWidget({ isMinimized, onMinimizeToggle }) {
  // Calculate realistic delivery times (calculated on each render)
  const calculateDeliveryTime = () => {
    const now = new Date();
    const minDelivery = new Date(now.getTime() + 20 * 60000); // 20 minutes from now
    const maxDelivery = new Date(now.getTime() + 35 * 60000); // 35 minutes from now

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return {
      min: formatTime(minDelivery),
      max: formatTime(maxDelivery)
    };
  };

  const deliveryTimes = calculateDeliveryTime();

  return (
    <div className={`widgetContainer ${isMinimized ? 'minimized' : ''}`}>
        <div className="widgetHeader">
            <div className="normFlex">
                <img src={doordashLogo} id="doordashlogo"></img>
                {!isMinimized && (
                    <div className="orderInfo">
                        <h2>Order on the way!</h2>
                        <div className="deliveryTime">
                            <Clock size={12} />
                            <span>Arrives <b>{deliveryTimes.min}</b> - <b>{deliveryTimes.max}</b></span>
                        </div>
                    </div>
                )}
            </div>
            <button onClick={onMinimizeToggle} className="hideButton">
                {isMinimized ? 'Show' : 'Hide'}
            </button>
        </div>
        {!isMinimized && (
            <div className="doordashContent">
                <div className="orderDetails">
                    <div className="deliveryStatus">
                        <div className="statusBadge active">In Transit</div>
                        <p className="driverInfo">
                            <User size={12} />
                            Driver is 5 min away
                        </p>
                    </div>
                    <div className="locationInfo">
                        <MapPin size={12} />
                        <span>Delivering to your location</span>
                    </div>
                    <a href="https://www.youtube.com/watch?v=2yJgwwDcgV8" className="trackButton">
                        Track Order →
                    </a>
                </div>
                <div className="productContainer">
                    <img src={animeRyan} className="productImage" alt="Order item" />
                    <div className="productDetails">
                        <p className="itemCount">3 items</p>
                        <p className="orderTotal">$24.99</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default DoordashWidget;
