import { useEffect, useRef } from 'react';
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
  }
}

// Distraction overlay component that runs in the background
function DistractionOverlay() {
  const distractionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Distraction overlay initialized');

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

      try {
        console.log('About to call triggerRandomDistraction...');
        triggerRandomDistraction(distractionContainerRef);
        console.log('triggerRandomDistraction called successfully');
      } catch (error) {
        console.error('Error calling triggerRandomDistraction:', error);
      }
    };

    // Set up IPC listener for distractions
    console.log('Setting up IPC listener for TRIGGER_DISTRACTION...');
    const unsubscribe = window.electronAPI?.on(
      'TRIGGER_DISTRACTION',
      handleDistraction,
    );
    console.log('IPC listener set up:', unsubscribe ? 'success' : 'failed');

    // Add Electron API mock for development
    if (!window.electronAPI) {
      window.electronAPI = {
        send: (channel: string, data?: any) => {
          console.log('Mock IPC send:', channel, data);
          // Simulate a distraction trigger every 10 seconds for testing
          if (channel === 'START_MONITORING') {
            setInterval(() => {
              handleDistraction(null as any, {
                type: 'test',
                app: 'Test App',
                message: 'Test!',
              });
            }, 10000);
          }
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

    // Test distractions directly every 5 seconds (for debugging)
    console.log('Setting up direct distraction test (every 5 seconds)...');
    const testDistractionInterval = setInterval(() => {
      console.log('DIRECT TEST: Triggering distraction...');
      if (distractionContainerRef.current) {
        console.log('Container ref exists, calling distraction function');
        triggerRandomDistraction(distractionContainerRef);
      } else {
        console.log('Container ref is null');
      }
    }, 5000);

    return () => {
      // Clean up IPC listeners
      const unsubscribe = window.electronAPI?.on(
        'TRIGGER_DISTRACTION',
        () => {},
      );
      unsubscribe?.();

      // Clean up test interval
      clearInterval(testDistractionInterval);
    };
  }, []);

  return (
    <div className="invisible-overlay">
      <div id="distraction-container" ref={distractionContainerRef} />
    </div>
  );
}

function Home() {
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
          onClick={() => {
            console.log('TEST: Manual distraction triggered');
            const container = document.getElementById('distraction-container');
            if (container) {
              triggerRandomDistraction({ current: container });
            } else {
              console.error('Distraction container not found');
            }
          }}
          style={{
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          🎉 Test Distraction
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
