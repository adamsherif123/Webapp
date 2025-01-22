// src/auth/login.js

import { auth, db } from '../firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

export function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      // Attempt to sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check approval status in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.approved) {
          // e.g., go to dashboard
          window.location.href = '/dashboard.html';
        } else {
          showAlert("Account not yet approved", 
                    "Please wait for admin approval (less than 24 hours).");
        }
      } else {
        showAlert("User record not found", "Please contact support");
      }

    } catch (error) {
      showAlert('Login failed', 
                "Your email and password combination does not match our records.");
    }
  });
}
