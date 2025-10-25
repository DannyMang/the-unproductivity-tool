import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';

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

function Home() {
  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>
      <h1>The Unproductivity Tool</h1>
      <p style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', lineHeight: '1.6' }}>
        A collection of fun games and automation tools to help you be more productive... or not!
      </p>
      <div className="Hello">
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
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <GlassyNavbar />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Games Routes */}
        <Route path="/games/flappy-bird" element={<FlappyBird />} />
        <Route path="/games/blackjack" element={<Blackjack />} />
        <Route path="/games/monkeytype" element={<Monkeytype />} />
        <Route path="/games/snake" element={<SnakeGame />} />

        {/* Automation Routes */}
        <Route path="/automation/doordash-order" element={<DoordashOrder />} />
        <Route path="/automation/facebook-marketplace" element={<FacebookMarketplace />} />
      </Routes>
    </Router>
  );
}
