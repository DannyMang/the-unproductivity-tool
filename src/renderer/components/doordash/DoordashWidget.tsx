import React, { useState } from 'react';
import './DoordashWidget.css';
import doordashLogo from "../../../../assets/images/doordashlogo.png";
import animeRyan from '../../../../assets/images/animeryan.jpg';

function DoordashWidget() {

  return (
    <div className="widgetContainer">
        <div className="columnSpaced">
            <div className="columnFlex">
                <img src={doordashLogo} id="doordashlogo"></img>
                <h2>Preparing your order...</h2>
                <p>Arrives between <b>67:67pm</b> and <b>69:69pm</b></p>
            </div>
            <a href="https://www.youtube.com/watch?v=2yJgwwDcgV8">Track your order here →</a>
        </div>
        <img src={animeRyan} className="productImage"></img>
    </div>
  );
}

export default DoordashWidget;
