// src/auth/authState.js
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

export function onAuthStateCheck() {
  // 1) Immediately set welcome title if user is already known
  setWelcomeTitleImmediate();

  // 2) Then also listen for changes in auth state
  onAuthStateChanged(auth, (user) => {
    document.body.classList.remove('auth-loading');

    // If user is not logged in, maybe redirect from restricted pages
    redirectIfNotLoggedIn(user);

    // If user is logged in, set welcome title
    setWelcomeTitle(user);
  });
}

/** 
 * Immediately sets the welcome title if auth.currentUser is not null.
 */
function setWelcomeTitleImmediate() {
  const user = auth.currentUser;
  setWelcomeTitle(user);
}

/** 
 * Actually sets the welcome title text
 */
function setWelcomeTitle(user) {
  const welcomeTitle = document.getElementById('welcome-title');
  if (!welcomeTitle) return;

  if (user) {
    welcomeTitle.textContent = `Welcome, ${user.displayName || 'User'}!`;
    welcomeTitle.style.display = 'block';
  } else {
    welcomeTitle.textContent = ''; // or hide it if not logged in
    welcomeTitle.style.display = 'none';
  }
}

/**
 * Restrict certain pages if user is not logged in
 */
function redirectIfNotLoggedIn(user) {
  const restrictedPages = [
    'dashboard.html',
    'createevent.html',
    'about-logged-in.html',
    'myevents.html'
  ];
  if (!user) {
    const path = window.location.pathname;
    const isRestricted = restrictedPages.some(page => path.endsWith(page));
    if (isRestricted) {
      window.location.href = '/login.html';
    }
  }
}
