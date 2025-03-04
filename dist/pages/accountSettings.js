// src/pages/accountSettings.js
import { auth, db } from '../firebase.js';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

// Example multi-select data
const dummyUsers = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", "Michael Scott"];

export function initAccountSettings() {
  const settingsForm = document.getElementById('account-settings-form');
  if (!settingsForm) return; // not on this page

  // We'll track the user data for the multi-select
  let selectedUsers = [];
  const selectedUsersContainer = document.getElementById('selected-users-settings');
  const input = document.getElementById('multi-select-input-settings');
  const suggestionsBox = document.getElementById('suggestions-box-settings');

  function addSelectedUser(user) {
    if (!selectedUsers.includes(user)) {
      selectedUsers.push(user);
      const tag = document.createElement("div");
      tag.className = "tag";
      tag.innerHTML = `${user} <span>&times;</span>`;
      tag.querySelector("span").addEventListener("click", () => removeSelectedUser(user, tag));
      selectedUsersContainer.appendChild(tag);
    }
  }
  function removeSelectedUser(user, tagElement) {
    selectedUsers = selectedUsers.filter(u => u !== user);
    selectedUsersContainer.removeChild(tagElement);
  }

  // Hook up input => suggestions
  if (input) {
    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      suggestionsBox.innerHTML = "";
      if (query) {
        const filtered = dummyUsers.filter(
          user => user.toLowerCase().includes(query) && !selectedUsers.includes(user)
        );
        filtered.forEach(user => {
          const suggestionDiv = document.createElement("div");
          suggestionDiv.textContent = user;
          suggestionDiv.addEventListener("click", () => {
            addSelectedUser(user);
            input.value = "";  
            suggestionsBox.innerHTML = "";
          });
          suggestionsBox.appendChild(suggestionDiv);
        });
      }
    });
    // close suggestions if clicked outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".multi-select-container")) {
        suggestionsBox.innerHTML = "";
      }
    });
  }

  // Org Type / "Other" logic
  const orgTypeSelect = document.getElementById('settings-organization-type');
  const otherTypeContainer = document.getElementById('settings-other-type-container');
  const otherTypeInput = document.getElementById('settings-other-type');
  if (orgTypeSelect) {
    orgTypeSelect.addEventListener('change', function () {
      if (this.value === "Other") {
        otherTypeContainer.style.display = "block";
        otherTypeInput.required = true;
      } else {
        otherTypeContainer.style.display = "none";
        otherTypeInput.required = false;
        otherTypeInput.value = "";
      }
    });
  }

  // We might also update a photo preview
  const photoPreview = document.getElementById('settings-photo-preview');
  const photoInput = document.getElementById('settings-photo');
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          photoPreview.src = e.target.result;
        };
        reader.readAsDataURL(photoInput.files[0]);
      }
    });
  }

  // On load, fetch user data
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'venues', user.uid));
      if (!snap.exists()) {
        showAlert('Error', 'Your user record was not found.');
        return;
      }
      const data = snap.data();
      // Fill form
      document.getElementById('settings-email').value = user.email || '';
      document.getElementById('settings-phone').value = data.phoneNumber || '';
      document.getElementById('settings-organization-name').value = data.organizationName || '';
      
      if (data.organizationType) {
        orgTypeSelect.value = data.organizationType;
        if (data.organizationType === 'Other') {
          otherTypeContainer.style.display = 'block';
          otherTypeInput.value = data.organizationType; 
        }
      }
      document.getElementById('settings-description').value = data.description || '';
      document.getElementById('settings-location').value = data.location || '';

      // Linked accounts
      if (Array.isArray(data.linkedAccounts)) {
        selectedUsers = data.linkedAccounts.slice(); // clone
        selectedUsers.forEach(u => addSelectedUser(u));
      }

      // If user has a photoURL, show it
      if (data.photoURL && photoPreview) {
        photoPreview.src = data.photoURL;
      }

      // Also show the user’s org name on left
      const displayNameEl = document.getElementById('profile-display-name');
      if (displayNameEl) {
        displayNameEl.textContent = data.organizationName || 'Your Organization';
      }

    } catch (err) {
      console.error(err);
      showAlert('Error', err.message);
    }
  });

  // On Save
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      showAlert('Error', 'No user logged in.');
      return;
    }

    const phone = document.getElementById('settings-phone').value || null;
    const orgName = document.getElementById('settings-organization-name').value || '';
    const orgTypeVal = orgTypeSelect.value || '';
    const otherVal = otherTypeInput.value.trim();
    const finalType = (orgTypeVal === 'Other') ? otherVal : orgTypeVal;

    const desc = document.getElementById('settings-description').value || null;
    const loc = document.getElementById('settings-location').value || null;

    // Possibly handle photo upload
    let newPhotoURL = null;
    if (photoInput && photoInput.files[0]) {
      // TODO: actual storage upload
      newPhotoURL = user.photoURL; // dummy
    }

    try {
      // Update Firestore
      await updateDoc(doc(db, 'venues', user.uid), {
        phoneNumber: phone,
        organizationName: orgName,
        organizationType: finalType,
        description: desc,
        location: loc,
        linkedAccounts: selectedUsers,
        ...(newPhotoURL && { photoURL: newPhotoURL })
      });

      await updateProfile(user, {
        displayName: orgName
      });

      // Also update the left side name, if you want a live preview
      const displayNameEl = document.getElementById('profile-display-name');
      if (displayNameEl) displayNameEl.textContent = orgName || 'Your Organization';

      showAlert('Saved!', 'Your changes have been updated.');
    } catch (err) {
      console.error(err);
      showAlert('Error', err.message);
    }
  });
}
