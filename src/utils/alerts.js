// alerts.js

// Grabbing references to the overlay and its content
const alertOverlay = document.getElementById('alert-overlay');
const alertTitle   = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertOk      = document.getElementById('alert-ok');

/**
 * Show a custom alert modal with an optional callback on "OK."
 * 
 * @param {string}   title  - The title to display in the alert
 * @param {string}   message - The message body of the alert
 * @param {Function} [onOk] - Optional callback function when user clicks "OK"
 */
export function showAlert(title, message, onOk) {
  // Set the text for title and message
  if (alertTitle)   alertTitle.textContent   = title;
  if (alertMessage) alertMessage.textContent = message;
  
  // Show the overlay
  if (alertOverlay) {
    alertOverlay.style.display = 'flex';
  }

  // Ensure we have the "OK" button
  if (!alertOk) return;

  // Remove any existing click handler to avoid stacking multiple listeners
  alertOk.onclick = null;

  // Now add the new click logic
  alertOk.onclick = () => {
    // Hide the alert
    if (alertOverlay) {
      alertOverlay.style.display = 'none';
    }
    
    // If there's a callback, run it
    if (onOk) {
      onOk();
    }
  };
}

/**
 * If you want a no-op init function or additional setup, you can define it here.
 * For now, this is empty unless you have more initialization needs.
 */
export function initAlerts() {
  // No-op; only needed if you have additional setup logic for alerts.
}
