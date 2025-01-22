// src/utils/alerts.js

const alertOverlay = document.getElementById('alert-overlay');
const alertTitle   = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertOk      = document.getElementById('alert-ok');

/**
 * Show a custom alert modal with optional callback on "OK."
 * 
 * @param {string} title
 * @param {string} message
 * @param {Function} [onOk] optional callback function
 */
export function showAlert(title, message, onOk) {
  // Set text content
  if (alertTitle)   alertTitle.textContent   = title;
  if (alertMessage) alertMessage.textContent = message;

  // Show overlay
  if (alertOverlay) alertOverlay.style.display = 'flex';

  // If we have an "OK" button
  if (alertOk) {
    // Clone the button to remove old listeners
    const newButton = alertOk.cloneNode(true);
    alertOk.parentNode.replaceChild(newButton, alertOk);
    
    // Now newButton is fresh, no old listeners
    if (onOk) {
      newButton.addEventListener('click', () => {
        // Hide the alert
        alertOverlay.style.display = 'none';
        // Then run the callback
        onOk();
      });
    } else {
      // If no callback provided, just hide the alert
      newButton.addEventListener('click', () => {
        alertOverlay.style.display = 'none';
      });
    }
  }
}

/**
 * If you want a default "OK" behavior, you could do it here,
 * but the above approach is more flexible. 
 */
export function initAlerts() {
  // Possibly do nothing if your approach is all in showAlert
}
