// src/auth/forgot.js

import { auth } from '../firebase.js';
import { sendPasswordResetEmail } from 'firebase/auth';
import { showAlert } from '../utils/alerts.js';

export function initForgotForm() {
  const forgotForm = document.getElementById('forgot-form');
  if (!forgotForm) return;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgot-email').value;
    if (!email) {
      showAlert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showAlert("Reset link sent!", "Please check your inbox.");
    } catch (error) {
      showAlert("Error", "Invalid email");
    }
  });
}
