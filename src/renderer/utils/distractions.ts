const DISTRACTION_MESSAGES = [
  'STOP WORKING! 🎉',
  'TIME FOR A BREAK! 🎮',
  'YOU SHOULD BE HAVING FUN! 🎪',
  'WORK IS BORING! 🚀',
  'GO WATCH SOME CATS! 🐱',
  'MEMES ARE WAITING! 😂',
  'PRODUCTIVITY IS OVERRATED! 🌟',
  'TAKE A NAP INSTEAD! 😴',
  'SOCIAL MEDIA CALLS! 📱',
  'DISTRACT YOURSELF! 🎭',
];

const DISTRACTION_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.reddit.com/r/amitheasshole',
  'https://www.tiktok.com',
  'https://twitter.com/explore',
  'https://www.instagram.com/explore',
  'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  'https://www.netflix.com',
];

const createDistractionPopup = (distractionContainerRef) => {
  console.log('createDistractionPopup called');

  const popup = document.createElement('div');
  popup.className = 'distraction-popup';
  popup.textContent =
    DISTRACTION_MESSAGES[
      Math.floor(Math.random() * DISTRACTION_MESSAGES.length)
    ];

  console.log('Popup message:', popup.textContent);
  console.log('Window dimensions:', window.innerWidth, window.innerHeight);

  popup.style.left = Math.random() * (window.innerWidth - 300) + 'px';
  popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';

  console.log('Popup position:', popup.style.left, popup.style.top);

  popup.onclick = (e) => {
    console.log('Popup clicked!');
    // Check if clicked on the X button (right side)
    if (e.offsetX > popup.offsetWidth - 30) {
      console.log('Popup closed via X button');
      popup.remove();
    } else {
      console.log('Popup moved to new position');
      // Move the popup when clicked on the main area
      popup.style.left = Math.random() * (window.innerWidth - 300) + 'px';
      popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    }
  };

  console.log('About to append popup to container:', distractionContainerRef.current);
  distractionContainerRef.current?.appendChild(popup);
  console.log('Popup appended to DOM');

  // Auto-remove after 8 seconds
  setTimeout(() => {
    console.log('Auto-removing popup');
    if (popup.parentNode) {
      popup.remove();
      console.log('Popup removed');
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
  rainbow.style.left = Math.random() * (window.innerWidth - 200) + 'px';
  rainbow.style.top = Math.random() * (window.innerHeight - 200) + 'px';

  distractionContainerRef.current?.appendChild(rainbow);

  setTimeout(() => rainbow.remove(), 3000);
};

const createFlyingElements = (distractionContainerRef) => {
  const elements = ['🦄', '🌈', '🎪', '🎮', '🎯', '🎨', '🎭', '🎪'];

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const element = document.createElement('div');
      element.className = 'flying-element';
      element.textContent =
        elements[Math.floor(Math.random() * elements.length)];
      element.style.top = Math.random() * window.innerHeight + 'px';
      element.style.animationDelay = i * 0.5 + 's';

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
const triggerRandomDistraction = (distractionContainerRef) => {
  console.log('triggerRandomDistraction called with:', distractionContainerRef);
  console.log('distractionContainerRef.current:', distractionContainerRef?.current);

  const distractionType = Math.floor(Math.random() * 5);
  console.log('Selected distraction type:', distractionType);

  switch (distractionType) {
    case 0:
      console.log('Creating distraction popup...');
      createDistractionPopup(distractionContainerRef);
      break;
    case 1:
      console.log('Opening distraction website...');
      openDistractionWebsite();
      break;
    case 2:
      console.log('Creating rainbow distraction...');
      createRainbowDistraction(distractionContainerRef);
      break;
    case 3:
      console.log('Creating flying elements...');
      createFlyingElements(distractionContainerRef);
      break;
    case 4:
      console.log('Creating screen flash...');
      flashScreen(distractionContainerRef);
      break;
    default:
      console.log('Default case: creating distraction popup...');
      createDistractionPopup(distractionContainerRef);
  }
};

export default triggerRandomDistraction;
