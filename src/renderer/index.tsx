import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electronAPI?.once('ipc-example', (arg: any) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electronAPI?.send('ipc-example', ['ping']);
