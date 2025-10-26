const DISTRACTION_MESSAGES = [
  'STOP WORKING! Time for fun!',
  'TIME FOR A BREAK! Relax a bit',
  'YOU SHOULD BE HAVING FUN! Enjoy yourself',
  'WORK IS BORING! Do something exciting',
  'GO WATCH SOME CATS! They are waiting',
  'MEMES ARE WAITING! Time to laugh',
  'PRODUCTIVITY IS OVERRATED! Take it easy',
  'TAKE A NAP INSTEAD! Rest well',
  'SOCIAL MEDIA CALLS! Check notifications',
  'DISTRACT YOURSELF! Have some fun',
];

const DISTRACTION_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.reddit.com/r/amitheasshole',
  'https://www.tiktok.com',
  'https://x.com',
  'https://www.instagram.com/explore',
  'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  'https://www.netflix.com',
];

const createDistractionPopup = (distractionContainerRef) => {
  const popup = document.createElement('div');
  popup.className = 'distraction-popup';
  popup.textContent =
    DISTRACTION_MESSAGES[
      Math.floor(Math.random() * DISTRACTION_MESSAGES.length)
    ];
  popup.style.left = `${Math.random() * (window.innerWidth - 300)}px`;
  popup.style.top = `${Math.random() * (window.innerHeight - 200)}px`;

  popup.onclick = (e) => {
    // Check if clicked on the X button (right side)
    if (e.offsetX > popup.offsetWidth - 30) {
      popup.remove();
    } else {
      // Move the popup when clicked on the main area
      popup.style.left = `${Math.random() * (window.innerWidth - 300)}px`;
      popup.style.top = `${Math.random() * (window.innerHeight - 200)}px`;
    }
  };

  distractionContainerRef.current?.appendChild(popup);

  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 8000);
};

const openDistractionWebsite = () => {
  const url =
    DISTRACTION_URLS[Math.floor(Math.random() * DISTRACTION_URLS.length)];
  window.electronAPI?.openExternal(url);
};

const createRainbowDistraction = (distractionContainerRef) => {
  const rainbow = document.createElement('div');
  rainbow.className = 'rainbow-distraction';
  rainbow.style.left = `${Math.random() * (window.innerWidth - 200)}px`;
  rainbow.style.top = `${Math.random() * (window.innerHeight - 200)}px`;

  distractionContainerRef.current?.appendChild(rainbow);

  setTimeout(() => rainbow.remove(), 3000);
};

const createFlyingElements = (distractionContainerRef) => {
  // Use text-based fun elements instead of emojis
  const elements = ['✨', '⭐', '🌟', '💫', '🎯', '🎨', '🎪', '🎮'];

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const element = document.createElement('div');
      element.className = 'flying-element';
      element.textContent =
        elements[Math.floor(Math.random() * elements.length)];
      element.style.top = `${Math.random() * window.innerHeight}px`;
      element.style.animationDelay = `${i * 0.5}s`;

      distractionContainerRef.current?.appendChild(element);

      setTimeout(() => element.remove(), 10000);
    }, i * 1000);
  }
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
const focusApp = () => {
  window.electronAPI?.focusWindow();
};

const triggerRandomDistraction = (distractionContainerRef) => {
  // Focus the app first so user sees the distraction
  focusApp();

  const distractionType = Math.floor(Math.random() * 5);
  switch (distractionType) {
    case 0:
      createDistractionPopup(distractionContainerRef);
      break;
    case 1:
      openDistractionWebsite();
      break;
    case 2:
      createRainbowDistraction(distractionContainerRef);
      break;
    case 3:
      createFlyingElements(distractionContainerRef);
      break;
    case 4:
      flashScreen(distractionContainerRef);
      break;
    default:
      createDistractionPopup(distractionContainerRef);
  }
};

export default triggerRandomDistraction;
