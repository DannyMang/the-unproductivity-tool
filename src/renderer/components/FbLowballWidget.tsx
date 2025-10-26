import React, { useState } from 'react';
import { X, Send, Users, Search, Loader2 } from 'lucide-react';
import './FbLowballWidget.css';
import fbMarketIcon from '../../../assets/images/fbmarketicon.png';

interface FbLowballWidgetProps {
  isVisible: boolean;
  onClose: () => void;
}

function FbLowballWidget({ isVisible, onClose }: FbLowballWidgetProps) {
  const [searchItem, setSearchItem] = useState('');
  const [numPeople, setNumPeople] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; sessionId?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchItem.trim()) {
      setResult({ success: false, message: 'Please enter a search item' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/lowball-marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchItem: searchItem.trim(),
          numPeople: numPeople
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Lowballing started for "${searchItem}" targeting ${numPeople} people!`,
          sessionId: data.sessionId
        });
        // Clear form on success
        setSearchItem('');
        setNumPeople(3);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to start lowballing'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to backend server. Make sure it\'s running on localhost:3000'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSearchItem('');
    setNumPeople(3);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fb-lowball-widget-overlay">
      <div className="fb-lowball-widget">
        <div className="fb-lowball-widget-header">
          <div className="fb-lowball-widget-title">
            <img src={fbMarketIcon} alt="Facebook Marketplace" className="fb-lowball-icon" />
            <div>
              <h2>Marketplace Lowballer</h2>
              <p>Automated lowball messaging</p>
            </div>
          </div>
          <button onClick={handleClose} className="fb-lowball-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="fb-lowball-form">
          <div className="fb-lowball-form-group">
            <label htmlFor="searchItem">
              <Search size={16} />
              Search Item
            </label>
            <input
              id="searchItem"
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="e.g., iPhone 13, MacBook Pro, etc."
              disabled={isLoading}
            />
          </div>

          <div className="fb-lowball-form-group">
            <label htmlFor="numPeople">
              <Users size={16} />
              Number of People to Message
            </label>
            <input
              id="numPeople"
              type="number"
              min="1"
              max="15"
              value={numPeople}
              onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
            <small>Default: 3 people (max: 15)</small>
          </div>

          <button
            type="submit"
            className="fb-lowball-submit-btn"
            disabled={isLoading || !searchItem.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Starting Lowballing...
              </>
            ) : (
              <>
                <Send size={16} />
                Start Lowballing
              </>
            )}
          </button>
        </form>

        {result && (
          <div className={`fb-lowball-result ${result.success ? 'success' : 'error'}`}>
            <p>{result.message}</p>
            {result.success && result.sessionId && (
              <small>Session ID: {result.sessionId}</small>
            )}
          </div>
        )}

        <div className="fb-lowball-widget-footer">
          <p>
            ⚠️ This will automatically search Facebook Marketplace and send lowball offers to up to {numPeople} sellers.
            <br />
            <small>Make sure you're logged into Facebook in your browser.</small>
          </p>
        </div>
      </div>
    </div>
  );
}

export default FbLowballWidget;