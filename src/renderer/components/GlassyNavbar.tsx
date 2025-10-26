import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bird, Club, Keyboard, Worm, ShoppingCart, Store } from 'lucide-react';
import './GlassyNavbar.css';
import Logo from "../../../assets/images/theunproductivitytoollogo.png";

interface NavItem {
  title: string;
  items: {
    label: string;
    path: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const GlassyNavbar: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
        },
        {
          label: 'Blackjack',
          path: '/games/blackjack',
          description: 'Play to 21 with simple bets.',
          icon: <Club size={20} />,
        },
        {
          label: 'Monkeytype',
          path: '/games/monkeytype',
          description: 'Typing practice with stats.',
          icon: <Keyboard size={20} />,
        },
        {
          label: 'Snake Game',
          path: '/games/snake',
          description: 'Grow the snake, avoid the walls.',
          icon: <Worm size={20} />,
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

  const handleLinkClick = () => {
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
                  onKeyDown={handleDropdownKeyDown}
                  role="menu"
                >
                  <div className="mega-menu-content">
                    {item.items.map((subItem) => (
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default GlassyNavbar;
