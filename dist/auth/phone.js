// src/auth/phone.js

import { auth, db } from '../firebase.js';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

export function initPhoneLogin() {
  const phoneForm = document.getElementById('phone-login-form');
  if (!phoneForm) return; // We only run this if phone-login.html is loaded

  // If there's no #recaptcha-container, show a warning or just return
  const recaptchaContainer = document.getElementById('recaptcha-container');
  if (!recaptchaContainer) {
    console.warn('Phone login page missing #recaptcha-container');
    return;
  }

  // Set up a global or local RecaptchaVerifier
  window.recaptchaVerifier = new RecaptchaVerifier(
    'recaptcha-container', 
    { 
      size: 'invisible',
      callback: (response) => {
        // reCAPTCHA solved automatically
      }
    }, 
    auth
  );

  let confirmationResultGlobal = null;

  phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const verificationCodeContainer = document.getElementById('verification-code-container');
    const codeIsHidden = (verificationCodeContainer.style.display === 'none');

    if (codeIsHidden) {
      // 1) Send code
      const phoneNumber = document.getElementById('login-phone').value;
      const appVerifier = window.recaptchaVerifier;

      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        confirmationResultGlobal = confirmationResult;

        // Reveal code input
        verificationCodeContainer.style.display = 'block';
        // Update button text
        const sendCodeBtn = document.getElementById('send-code-btn');
        sendCodeBtn.textContent = 'Verify Code';

        showAlert("SMS Code Sent!", "Please check your phone.");
      } catch (error) {
        showAlert("Error sending code", error.message);
      }

    } else {
      // 2) Verify the code
      const verificationCode = document.getElementById('verification-code').value;
      if (!verificationCode) {
        showAlert("Error", "Please enter the verification code.");
        return;
      }

      try {
        const userCredential = await confirmationResultGlobal.confirm(verificationCode);
        const user = userCredential.user;

        // Check in Firestore if approved
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.approved) {
            window.location.href = '/dashboard.html';
          } else {
            showAlert("Account not yet approved", 
                      "Please wait for admin approval. Usually <24 hours.");
          }
        } else {
          showAlert("User record not found", "Please contact support or sign up first.");
        }
      } catch (error) {
        showAlert("Verification error", error.message);
      }
    }
  });
}
