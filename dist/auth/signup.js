// src/auth/signup.js

import { auth, db } from '../firebase.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

export function initSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  // 1) Show/hide "other-organization-type" logic
  const orgTypeSelect = document.getElementById('organization-type');
  const otherOrgTypeContainer = document.getElementById('other-organization-type-container');
  const otherOrgTypeInput = document.getElementById('other-organization-type');

  if (orgTypeSelect) {
    orgTypeSelect.addEventListener('change', function () {
      if (this.value === "Other") {
        otherOrgTypeContainer.style.display = "block";
        otherOrgTypeInput.required = true;
      } else {
        otherOrgTypeContainer.style.display = "none";
        otherOrgTypeInput.required = false;
        otherOrgTypeInput.value = "";
      }
    });

    // Initial color
    if (orgTypeSelect.value === "") {
      orgTypeSelect.style.color = '#908d8d';
    } else {
      orgTypeSelect.style.color = 'black';
    }

    // Update color on change
    orgTypeSelect.addEventListener('change', function () {
      if (this.value === "") {
        this.style.color = '#908d8d';
      } else {
        this.style.color = 'black';
      }
    });
  }

  // 2) Multi-select for linking Moves App accounts
  const users = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", "Michael Scott"];
  const input = document.getElementById("multi-select-input");
  const suggestionsBox = document.getElementById("suggestions-box");
  const selectedUsersContainer = document.getElementById("selected-users");
  let selectedUsers = [];

  if (input) {
    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      suggestionsBox.innerHTML = "";
      if (query) {
        const filteredUsers = users.filter(user => 
          user.toLowerCase().includes(query) && !selectedUsers.includes(user)
        );
        filteredUsers.forEach(user => {
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
  }

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
    selectedUsers = selectedUsers.filter(selected => selected !== user);
    selectedUsersContainer.removeChild(tagElement);
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multi-select-container")) {
      suggestionsBox.innerHTML = "";
    }
  });

  // 3) Actually handle signup with Email/Pass + Firestore
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    if (password !== confirmPassword) {
      showAlert('Error', "Passwords do not match!");
      return;
    }

    const organizationName = document.getElementById('organization-name').value;
    const organizationType = orgTypeSelect ? orgTypeSelect.value : "";
    const phoneNumber = document.getElementById('organization-phone').value || null;
    const description = document.getElementById('organization-description').value || null;
    const loc = document.getElementById('organization-location').value || null;
    const photoInput = document.getElementById('organization-photo');
    let photoURL = null;

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user's displayName to organizationName
      await updateProfile(user, {
        displayName: organizationName
      });

      // If you want to upload photo to Firebase Storage (like before), do it here.
      // For now, we skip actual upload:
      if (photoInput && photoInput.files[0]) {
        // placeholder
        photoURL = 'https://via.placeholder.com/300';
      }

      await setDoc(doc(db, "venues", user.uid), {
        email: user.email,
        phoneNumber,
        organizationName,
        organizationType: (organizationType === "Other") 
          ? (otherOrgTypeInput.value) 
          : organizationType,
        description,
        location: loc,
        linkedAccounts: selectedUsers,
        photoURL,
        approved: false,
      });

      showAlert("Signup successful!", 
        "You can log in as soon as we approve your account. This should take less than 24 hours.");

    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      showAlert("Error", error.message);
    }
  });
}
