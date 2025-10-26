const DISTRACTION_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.reddit.com/r/amitheasshole',
  'https://www.tiktok.com',
  'https://twitter.com/explore',
  'https://www.instagram.com/explore',
  'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  'https://www.netflix.com',
];


const focusApp = () => {
  window.electronAPI?.focusWindow();
};

const openDistractionWebsite = () => {
  const url =
    DISTRACTION_URLS[Math.floor(Math.random() * DISTRACTION_URLS.length)];
  window.electronAPI?.openExternal(url);
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

const createGameWidgetDistraction = (distractionContainerRef) => {
  const games = [
    { name: 'Blackjack', emoji: '♠️' },
    { name: 'Flappy Bird', emoji: '🐦' },
    { name: 'Monkeytype', emoji: '🐒' },
    { name: 'Snake Game', emoji: '🐍' }
  ];

  const selectedGame = games[Math.floor(Math.random() * games.length)];

  const widget = document.createElement('div');
  widget.className = 'game-widget-distraction';

  // Create widget content
  widget.innerHTML = `
    <div class="game-widget-header">
      <span class="game-widget-title">${selectedGame.emoji} ${selectedGame.name}</span>
      <span class="game-widget-close">×</span>
    </div>
    <div class="game-widget-content">
      <div class="game-widget-preview">
        <h3>${selectedGame.name}</h3>
        <p>Coming soon...</p>
        <div class="game-widget-placeholder">
          <span class="game-widget-emoji">${selectedGame.emoji}</span>
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
  if (window.distractionTimeout && !window.distractionTimeout.canTriggerDistraction()) {
    const remainingTime = window.distractionTimeout.getRemainingCooldownTime();
    console.log(`Distraction blocked by timeout system: ${remainingTime}s remaining`);
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
