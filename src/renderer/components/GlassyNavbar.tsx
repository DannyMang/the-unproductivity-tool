import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bird, Club, Keyboard, Worm, ShoppingCart, Store } from 'lucide-react';
import './GlassyNavbar.css';
import Logo from '../../../assets/images/theunproductivitytoollogo.png';

// Game URLs for iframe embedding
const gameUrls: { [key: string]: string } = {
  'Flappy Bird': 'https://flappybird.io/',
  Blackjack: 'https://playpager.com/blackjack-game/',
  'Typing Test': 'https://www.keybr.com/',
  'Snake Game': 'https://googlesnakemods.com/v/current/',
};

// Function to create a specific game widget
const createGameWidget = (gameName: string, emoji: string) => {
  const widget = document.createElement('div');
  widget.className = 'game-widget-distraction';

  const gameUrl = gameUrls[gameName];

  // Create widget content with iframe
  widget.innerHTML = `
    <div class="game-widget-header">
      <span class="game-widget-title">${emoji} ${gameName}</span>
      <span class="game-widget-close">×</span>
    </div>
    <div class="game-widget-content">
      <div class="game-widget-iframe-container">
        <iframe
          src="${gameUrl}"
          class="game-widget-iframe"
          title="${gameName}"
          frameborder="0"
          allowfullscreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        ></iframe>
      </div>
    </div>
  `;

  // Position widget randomly on screen
  const maxX = window.innerWidth - 850; // 800px width + 50px margin
  const maxY = window.innerHeight - 750; // 700px height + 50px margin

  widget.style.left = `${Math.max(50, Math.random() * maxX)}px`;
  widget.style.top = `${Math.max(50, Math.random() * maxY)}px`;

  // Add close functionality
  const closeBtn = widget.querySelector('.game-widget-close');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    widget.remove();
  });

  // Add drag to reposition functionality
  let isDragging = false;
  let currentX: number;
  let currentY: number;
  let initialX: number;
  let initialY: number;
  let xOffset = 0;
  let yOffset = 0;

  const header = widget.querySelector('.game-widget-header');

  // Declare functions before using them
  function dragStart(e: MouseEvent) {
    if ((e.target as Element).classList.contains('game-widget-close')) return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === header || header.contains(e.target as Node)) {
      isDragging = true;
    }
  }

  function drag(e: MouseEvent) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      // Keep widget within screen bounds
      const newX = Math.max(0, Math.min(window.innerWidth - 850, currentX));
      const newY = Math.max(0, Math.min(window.innerHeight - 750, currentY));

      widget.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  }

  function dragEnd(e: MouseEvent) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  header?.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  // Find the distraction container
  const distractionContainer = document.getElementById('distraction-container');
  if (distractionContainer) {
    distractionContainer.appendChild(widget);
  }
};

interface NavItem {
  title: string;
  items: {
    label: string;
    path: string;
    description: string;
    icon: React.ReactNode;
    isGame?: boolean;
    gameName?: string;
    gameEmoji?: string;
  }[];
}

function GlassyNavbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      title: 'Games',
      items: [
        {
          label: 'Flappy Bird',
          path: '/games/flappy-bird',
          description: 'Classic tap-to-fly clone.',
          icon: <Bird size={20} />,
          isGame: true,
          gameName: 'Flappy Bird',
          gameEmoji: '',
        },
        {
          label: 'Blackjack',
          path: '/games/blackjack',
          description: 'Play to 21 with simple bets.',
          icon: <Club size={20} />,
          isGame: true,
          gameName: 'Blackjack',
          gameEmoji: '',
        },
        {
          label: 'Typing Test',
          path: '/games/typing-test',
          description: 'Keyboard practice with stats.',
          icon: <Keyboard size={20} />,
          isGame: true,
          gameName: 'Typing Test',
          gameEmoji: '',
        },
        {
          label: 'Snake Game',
          path: '/games/snake',
          description: 'Grow the snake, avoid the walls.',
          icon: <Worm size={20} />,
          isGame: true,
          gameName: 'Snake Game',
          gameEmoji: '',
        },
      ],
    },
    {
      title: 'Automation',
      items: [
        {
          label: 'Doordash Order',
          path: '/automation/doordash-order',
          description: 'Auto-place a saved order.',
          icon: <ShoppingCart size={20} />,
        },
        {
          label: 'Facebook Marketplace',
          path: '/automation/facebook-marketplace',
          description: 'Search & watch listings.',
          icon: <Store size={20} />,
        },
      ],
    },
  ];

  const clearDropdownTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = (title: string) => {
    clearDropdownTimeout();
    setActiveDropdown(title);
    setIsKeyboardMode(false);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent, title: string) => {
    setIsKeyboardMode(true);

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveDropdown(activeDropdown === title ? null : title);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActiveDropdown(null);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setActiveDropdown(null);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setActiveDropdown(null);
    }
  };

  const handleLinkClick = () => {
    setActiveDropdown(null);
  };

  const handleGameClick = (gameName: string, gameEmoji: string) => {
    createGameWidget(gameName, gameEmoji);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.navbar-container')) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      clearDropdownTimeout();
    };
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname]);

  return (
    <nav className="navbar-container" onMouseLeave={handleMouseLeave}>
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/">
            <div className="logoFlex">
              <img id="logo" src={Logo}></img>
              <h1>The Unproductivity Tool</h1>
            </div>
          </Link>
        </div>

        <div className="navbar-nav">
          {navItems.map((item) => (
            <div
              key={item.title}
              className={`nav-item ${activeDropdown === item.title ? 'active' : ''}`}
              data-section={item.title.toLowerCase()}
              onMouseEnter={() => handleMouseEnter(item.title)}
            >
              <button
                type="button"
                className="nav-trigger"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === item.title ? null : item.title,
                  )
                }
                onKeyDown={(e) => handleKeyDown(e, item.title)}
                aria-haspopup="true"
                aria-expanded={activeDropdown === item.title}
              >
                {item.title}
                <span className="nav-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              {activeDropdown === item.title && (
                <div
                  className="mega-menu-panel"
                  onKeyDown={handleMenuKeyDown}
                  role="menu"
                >
                  <div className="mega-menu-content">
                    {item.items.map((subItem) => {
                      if (subItem.isGame) {
                        return (
                          <button
                            type="button"
                            key={subItem.path}
                            className="mega-menu-card game-card"
                            onClick={() =>
                              handleGameClick(
                                subItem.gameName!,
                                subItem.gameEmoji!,
                              )
                            }
                            role="menuitem"
                            tabIndex={isKeyboardMode ? 0 : -1}
                          >
                            <div className="card-icon lucide-icon">
                              {subItem.icon}
                            </div>
                            <div className="card-content">
                              <div className="card-title">{subItem.label}</div>
                              <div className="card-description">
                                {subItem.description}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className="mega-menu-card"
                          onClick={handleLinkClick}
                          role="menuitem"
                          tabIndex={isKeyboardMode ? 0 : -1}
                        >
                          <div className="card-icon lucide-icon">
                            {subItem.icon}
                          </div>
                          <div className="card-content">
                            <div className="card-title">{subItem.label}</div>
                            <div className="card-description">
                              {subItem.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default GlassyNavbar;
