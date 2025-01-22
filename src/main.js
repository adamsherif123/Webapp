// src/main.js

import './styles.css'; // global
import { initMenuToggle } from './utils/menu.js';
import { initAlerts } from './utils/alerts.js';
import { initNavbar } from './utils/navbar.js';

// Auth forms
import { initSignupForm } from './auth/signup.js';
import { initLoginForm } from './auth/login.js';
import { initForgotForm } from './auth/forgot.js';
import { initPhoneLogin } from './auth/phone.js';

// Pages
import { initEventForm } from './pages/events.js';
import { initDashboard } from './pages/dashboard.js';
import { initAccountSettings } from './pages/accountSettings.js';

// Global auth state
import { onAuthStateCheck } from './auth/authState.js';


document.addEventListener('DOMContentLoaded', () => {
  // Mobile hamburger
  initMenuToggle();

  // Navbar
  initNavbar();

  // Reusable alerts
  initAlerts();

  // Page-based init
  if (document.getElementById('signup-form')) {
    initSignupForm();
  }
  if (document.getElementById('login-form')) {
    initLoginForm();
  }
  if (document.getElementById('forgot-form')) {
    initForgotForm();
  }
  if (document.getElementById('phone-login-form')) {
    initPhoneLogin();
  }
  if (document.getElementById('event-form')) {
    initEventForm();
  }

  // If we're on the dashboard, call initDashboard()
  if (document.getElementById('ongoing-events-list')) {
    initDashboard();
  }

  // If we have the account settings form
  if (document.getElementById('account-settings-form')) {
    initAccountSettings();
  }

  // Global auth check
  onAuthStateCheck();
});
