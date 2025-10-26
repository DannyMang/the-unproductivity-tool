import { Heart, Youtube, MessageCircle, Music, Camera, X, Spade, Bird, Type, Zap } from 'lucide-react';

const DISTRACTION_URLS = [
  { url: 'https://www.youtube.com/watch?v=rCrwxcZUork', icon: 'youtube' },
  { url: 'https://www.reddit.com/r/amitheasshole', icon: 'message-circle' },
  { url: 'https://www.tiktok.com', icon: 'music' },
  { url: 'https://twitter.com/explore', icon: 'message-circle' },
  { url: 'https://www.instagram.com/explore', icon: 'camera' },
];

const focusApp = () => {
  window.electronAPI?.focusWindow();
};

const openDistractionWebsite = () => {
  const selectedSite =
    DISTRACTION_URLS[Math.floor(Math.random() * DISTRACTION_URLS.length)];
  window.electronAPI?.openExternal(selectedSite.url);
  return selectedSite.icon;
};

const flashScreen = (distractionContainerRef) => {
  const flash = document.createElement('div');
  flash.className = 'flash-overlay';

  document.body.appendChild(flash);

  setTimeout(() => flash.remove(), 200);

  // Flash multiple times
  for (let i = 1; i <= 3; i++) {
    setTimeout(() => {
      const anotherFlash = document.createElement('div');
      anotherFlash.className = 'flash-overlay';
      document.body.appendChild(anotherFlash);
      setTimeout(() => anotherFlash.remove(), 200);
    }, i * 300);
  }
};

// Helper function to get SVG paths for Lucide icons
const getIconSvg = (iconName) => {
  const icons = {
    'youtube': '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 18c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>',
    'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
    'music': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
    'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>',
    'Spade': '<path d="M12 2l-2.5 6.5L3 10l4.5 3L5 20l7-5 7 5-2.5-7L21 10l-6.5-1.5L12 2z"></path>',
    'Bird': '<path d="M18 2l-1 4.5L13 2l-1 4.5L8 2l1 4.5L2 12l6.5 2.5L12 21l3.5-6.5L22 12l-7-5.5L16 2z"></path>',
    'Type': '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>',
    'Zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
  };
  return icons[iconName] || icons['Zap'];
};

const createGameWidgetDistraction = (distractionContainerRef) => {
  const games = [
    { name: 'Blackjack', icon: 'Spade', color: '#1a1a1a' },
    { name: 'Flappy Bird', icon: 'Bird', color: '#fbbf24' },
    { name: 'Monkeytype', icon: 'Type', color: '#10b981' },
    { name: 'Snake Game', icon: 'Zap', color: '#8b5cf6' },
  ];

  const selectedGame = games[Math.floor(Math.random() * games.length)];

  const widget = document.createElement('div');
  widget.className = 'game-widget-distraction';

  // Create widget content with Lucide icons
  widget.innerHTML = `
    <div class="game-widget-header">
      <span class="game-widget-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${selectedGame.color}; margin-right: 8px;">
          ${getIconSvg(selectedGame.icon)}
        </svg>
        ${selectedGame.name}
      </span>
      <span class="game-widget-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
    </div>
    <div class="game-widget-content">
      <div class="game-widget-preview">
        <h3>${selectedGame.name}</h3>
        <p>Coming soon...</p>
        <div class="game-widget-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${selectedGame.color};">
            ${getIconSvg(selectedGame.icon)}
          </svg>
        </div>
      </div>
    </div>
  `;

  // Position widget randomly on screen
  const maxX = window.innerWidth - 650; // 600px width + 50px margin
  const maxY = window.innerHeight - 450; // 400px height + 50px margin

  widget.style.left = `${Math.max(50, Math.random() * maxX)}px`;
  widget.style.top = `${Math.max(50, Math.random() * maxY)}px`;

  // Add close functionality
  const closeBtn = widget.querySelector('.game-widget-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    widget.remove();
  });

  // Add drag to reposition functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const header = widget.querySelector('.game-widget-header');

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.classList.contains('game-widget-close')) return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === header || header.contains(e.target)) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      // Keep widget within screen bounds
      const newX = Math.max(0, Math.min(window.innerWidth - 650, currentX));
      const newY = Math.max(0, Math.min(window.innerHeight - 450, currentY));

      widget.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  distractionContainerRef.current?.appendChild(widget);

  // Ensure window is focused when game widget appears
  setTimeout(() => {
    focusApp();
  }, 100);
};

// Timeout management (imported from App component through global scope)
declare global {
  interface Window {
    distractionTimeout?: {
      canTriggerDistraction: () => boolean;
      startCooldown: () => void;
      getRemainingCooldownTime: () => number;
    };
  }
}

const triggerRandomDistraction = (distractionContainerRef) => {
  console.log('triggerRandomDistraction called with:', distractionContainerRef);
  console.log(
    'distractionContainerRef.current:',
    distractionContainerRef?.current,
  );

  // Check if distraction is allowed (additional safety check)
  if (
    window.distractionTimeout &&
    !window.distractionTimeout.canTriggerDistraction()
  ) {
    const remainingTime = window.distractionTimeout.getRemainingCooldownTime();
    console.log(
      `Distraction blocked by timeout system: ${remainingTime}s remaining`,
    );
    return false;
  }

  // Focus the app first so user sees the distraction
  focusApp();

  const distractionType = Math.floor(Math.random() * 3); // Reduced to 3 distraction types
  console.log('Selected distraction type:', distractionType);

  switch (distractionType) {
    case 0:
      console.log('Opening distraction website...');
      openDistractionWebsite();
      break;
    case 1:
      console.log('Creating screen flash...');
      flashScreen(distractionContainerRef);
      break;
    case 2:
      console.log('Creating game widget distraction...');
      createGameWidgetDistraction(distractionContainerRef);
      break;
    default:
      console.log('Default case: opening distraction website...');
      openDistractionWebsite();
  }

  // Start cooldown after successful distraction
  if (window.distractionTimeout) {
    window.distractionTimeout.startCooldown();
  }

  return true;
};

export default triggerRandomDistraction;