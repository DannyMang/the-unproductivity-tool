import { useEffect, useRef } from 'react';
import './App.css';
import triggerRandomDistraction from './utils/distractions';

// Test that the import worked
console.log('Distractions module imported:', typeof triggerRandomDistraction);

function InvisibleOverlay() {
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
      const { type, app, message } = data;
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
    const unsubscribe = window.electronAPI?.on('TRIGGER_DISTRACTION', handleDistraction);
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

export default function App() {
  return <InvisibleOverlay />;
}
