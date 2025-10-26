import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import triggerRandomDistraction from './utils/distractions';
import icon from '../../assets/icon.png';

import FbWidget from './components/FbWidget';
import DoordashWidget from './components/doordash/DoordashWidget';
// Components
import GlassyNavbar from './components/GlassyNavbar';

// Game Components
import FlappyBird from './components/Games/FlappyBird';
import Blackjack from './components/Games/Blackjack';
import Monkeytype from './components/Games/Monkeytype';
import SnakeGame from './components/Games/SnakeGame';

// Automation Components
import DoordashOrder from './components/Automation/DoordashOrder';
import FacebookMarketplace from './components/Automation/FacebookMarketplace';

// Test that the import worked
console.log('Distractions module imported:', typeof triggerRandomDistraction);

// Timeout management constants
const COOLDOWN_PERIOD = 60 * 1000; // 1 minute in milliseconds

// Global timeout state management
let isOnCooldown = false;
let cooldownTimeoutId: NodeJS.Timeout | null = null;
let lastDistractionTime = 0;

// Helper functions for timeout management
const canTriggerDistraction = (): boolean => {
  const now = Date.now();
  return !isOnCooldown && (now - lastDistractionTime) >= COOLDOWN_PERIOD;
};

const startCooldown = () => {
  isOnCooldown = true;
  lastDistractionTime = Date.now();

  // Clear any existing timeout
  if (cooldownTimeoutId) {
    clearTimeout(cooldownTimeoutId);
  }

  // Set new timeout to end cooldown
  cooldownTimeoutId = setTimeout(() => {
    isOnCooldown = false;
    cooldownTimeoutId = null;
    console.log('Cooldown ended - distractions can now be triggered');
  }, COOLDOWN_PERIOD);

  console.log('Cooldown started - no distractions for 1 minute');
};

const getRemainingCooldownTime = (): number => {
  if (!isOnCooldown) return 0;
  const elapsed = Date.now() - lastDistractionTime;
  const remaining = Math.max(0, COOLDOWN_PERIOD - elapsed);
  return Math.ceil(remaining / 1000); // Return seconds
};

// Expose timeout functions globally for other modules to use
if (typeof window !== 'undefined') {
  window.distractionTimeout = {
    canTriggerDistraction,
    startCooldown,
    getRemainingCooldownTime,
  };
}

// Add electron API types for contextBridge
declare global {
  interface Window {
    electronAPI?: {
      send: (channel: string, data?: any) => void;
      on: (
        channel: string,
        func: (...args: any[]) => void,
      ) => (() => void) | undefined;
      openExternal: (url: string) => void;
    };
    distractionTimeout?: {
      canTriggerDistraction: () => boolean;
      startCooldown: () => void;
      getRemainingCooldownTime: () => number;
    };
  }
}

// Distraction overlay component that runs in the background
function DistractionOverlay() {
  const distractionContainerRef = useRef<HTMLDivElement>(null);

  // Safe distraction trigger that respects cooldown
  const safeTriggerDistraction = useCallback((source: string) => {
    if (!canTriggerDistraction()) {
      const remainingTime = getRemainingCooldownTime();
      console.log(`Distraction blocked from ${source}: ${remainingTime}s remaining on cooldown`);
      return false;
    }

    try {
      console.log(`Triggering distraction from ${source}...`);
      triggerRandomDistraction(distractionContainerRef);
      startCooldown();
      console.log(`Distraction triggered successfully from ${source}`);
      return true;
    } catch (error) {
      console.error(`Error calling triggerRandomDistraction from ${source}:`, error);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('Distraction overlay initialized with timeout system');

    // Start monitoring for target applications
    const startMonitoring = () => {
      console.log('Sending START_MONITORING to main process...');
      window.electronAPI?.send('START_MONITORING');
      console.log('START_MONITORING sent');
    };

    // Listen for distraction triggers from main process
    const handleDistraction = (_: any, data: any) => {
      console.log('RECEIVED TRIGGER_DISTRACTION event:', data);

      // Handle undefined or missing data safely
      let type = 'unknown';
      let app = 'Unknown App';
      let message = 'Distraction time!';

      if (data && typeof data === 'object') {
        type = data.type || 'unknown';
        app = data.app || 'Unknown App';
        message = data.message || 'Distraction time!';
      }

      console.log('DISTRACTION TRIGGERED:', { type, app, message });

      // Use safe trigger that respects cooldown
      safeTriggerDistraction(`main process (${app})`);
    };

    // Set up IPC listener for distractions
    console.log('Setting up IPC listener for TRIGGER_DISTRACTION...');
    const unsubscribe = window.electronAPI?.on(
      'TRIGGER_DISTRACTION',
      handleDistraction,
    );
    console.log('IPC listener set up:', unsubscribe ? 'success' : 'failed');

    // Add Electron API mock for development (without automatic distractions)
    if (!window.electronAPI) {
      window.electronAPI = {
        send: (channel: string, data?: any) => {
          console.log('Mock IPC send:', channel, data);
          // No automatic test distractions - only send when explicitly called
        },
        on: (channel: string, func: (...args: any[]) => void) => {
          console.log('Mock IPC listener setup for:', channel);
          return () => {
            console.log('Mock IPC listener removed for:', channel);
          };
        },
        openExternal: (url: string) => {
          console.log('Mock opening URL:', url);
          window.open(url, '_blank');
        },
      };
    }

    startMonitoring();

    return () => {
      // Clean up IPC listeners
      const unsubscribe = window.electronAPI?.on(
        'TRIGGER_DISTRACTION',
        () => {},
      );
      unsubscribe?.();
    };
  }, [safeTriggerDistraction]);

  return (
    <div className="invisible-overlay">
      <div id="distraction-container" ref={distractionContainerRef} />
    </div>
  );
}

function Home() {
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [canTest, setCanTest] = useState(true);

  // Update cooldown status every second
  useEffect(() => {
    const updateCooldown = () => {
      const remaining = getRemainingCooldownTime();
      setRemainingCooldown(remaining);
      setCanTest(canTriggerDistraction());
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualTest = () => {
    const container = document.getElementById('distraction-container');
    if (container) {
      if (safeTriggerDistraction('manual test button')) {
        // Update state immediately after triggering
        setRemainingCooldown(60);
        setCanTest(false);
      }
    } else {
      console.error('Distraction container not found');
    }
  };

  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>
      <h1>The Unproductivity Tool</h1>
      <p
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        A collection of fun games and automation tools to help you be more
        productive... or not!
      </p>
      <div className="Hello">
        <button
          type="button"
          onClick={handleManualTest}
          disabled={!canTest}
          style={{
            backgroundColor: canTest ? '#ff6b6b' : '#cccccc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '10px',
            borderRadius: '5px',
            cursor: canTest ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            opacity: canTest ? 1 : 0.6,
            transition: 'all 0.3s ease',
          }}
        >
          🎉 {canTest ? 'Test Distraction' : `Cooldown: ${remainingCooldown}s`}
        </button>
        <a
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Read our docs
          </button>
        </a>
        <a
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="folded hands">
              🙏
            </span>
            Donate
          </button>
        </a>
      </div>
      <FbWidget></FbWidget>
      <DoordashWidget></DoordashWidget>
    </div>
  );
}

export default function App() {
  return (
    <>
      <DistractionOverlay />
      <Router>
        <GlassyNavbar />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Catch all route for SPA */}
          <Route path="*" element={<Home />} />

          {/* Games Routes */}
          <Route path="/games/flappy-bird" element={<FlappyBird />} />
          <Route path="/games/blackjack" element={<Blackjack />} />
          <Route path="/games/monkeytype" element={<Monkeytype />} />
          <Route path="/games/snake" element={<SnakeGame />} />

          {/* Automation Routes */}
          <Route
            path="/automation/doordash-order"
            element={<DoordashOrder />}
          />
          <Route
            path="/automation/facebook-marketplace"
            element={<FacebookMarketplace />}
          />
        </Routes>
      </Router>
    </>
  );
}
