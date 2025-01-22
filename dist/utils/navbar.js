// src/navbar.js
/**
 * Initializes the navbar functionality:
 * - Toggles visibility of logged-in and logged-out buttons based on authentication state.
 * - Highlights the active navbar button based on the current page.
 * - Handles the mobile menu toggle.
 */
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { signOut } from 'firebase/auth';

export function initNavbar() {
    // 1. Immediately check if a user is already logged in
    setNavbarUserNameImmediate();

    // 2. Then also listen for changes in auth state (login/logout)
    onAuthStateChanged(auth, (user) => {
      setNavbarUserName(user);
    });

    // 3. Highlight the active nav link
    highlightActiveNav();

    // Handle the "Log Out" link to show the confirm modal
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault(); // stop the default navigation
        const logoutConfirmOverlay = document.getElementById('logout-confirm-overlay');
        if (logoutConfirmOverlay) {
          logoutConfirmOverlay.style.display = 'flex';
        }
      });
    }

    // Also handle "Yes"/"No" in that overlay
    const logoutYes = document.getElementById('logout-yes');
    const logoutNo  = document.getElementById('logout-no');

    if (logoutYes) {
      logoutYes.addEventListener('click', async () => {
        // hide the overlay
        const overlay = document.getElementById('logout-confirm-overlay');
        if (overlay) overlay.style.display = 'none';

        // sign out with Firebase
        try {
          await signOut(auth);
          // redirect to homepage or login page
          window.location.href = '/';
        } catch (error) {
          console.error('Logout error:', error);
          // optionally show an error alert if needed
        }
      });
    }

    if (logoutNo) {
      logoutNo.addEventListener('click', () => {
        const overlay = document.getElementById('logout-confirm-overlay');
        if (overlay) overlay.style.display = 'none';
      });
    }
}


/**
 * If we already have a logged-in user (auth.currentUser),
 * set the display name right away (no delay).
 */
function setNavbarUserNameImmediate() {
  const user = auth.currentUser;  // might be null or a user object
  setNavbarUserName(user);
}

/**
 * Helper that updates the #nav-displayname text
 * based on the user object (or null).
 */
function setNavbarUserName(user) {
  const displayNameElement = document.getElementById('nav-displayname');
  if (!displayNameElement) return;

  if (user) {
    displayNameElement.textContent = user.displayName || 'User';
  } else {
    displayNameElement.textContent = '';
  }
}

/**
   * Highlights the current page's navbar button by adding the 'active-nav' class.
   */
function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop(); 
  // e.g., "createevent.html"

  const navButtons = document.querySelectorAll('.navbar__btn');
  navButtons.forEach(btn => {
    const dataPage = btn.getAttribute('data-page');

    // If currentPage matches either data-page or data-alt-page, add 'active-nav' class
    if (dataPage === currentPage) {
      btn.classList.add('active-nav');
    } else {
      btn.classList.remove('active-nav');
    }
  });
}