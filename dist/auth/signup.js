import { auth, db, storage } from '../firebase.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showAlert } from '../utils/alerts.js';

export function initSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  // Make sure you define these if you're going to use them
  const orgTypeSelect = document.getElementById('organization-type');
  const otherOrgTypeInput = document.getElementById('other-organization-type');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Gather credentials
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    if (password !== confirmPassword) {
      showAlert('Error', "Passwords do not match!");
      return;
    }

    // Gather organization fields
    const organizationName = document.getElementById('organization-name').value;
    const organizationType = orgTypeSelect ? orgTypeSelect.value : "";
    const otherOrgType = otherOrgTypeInput?.value || "";
    const phoneNumber = document.getElementById('organization-phone').value || '';
    const description = document.getElementById('organization-description').value || '';
    const loc = document.getElementById('organization-location').value || '';

    // 1) Reference the file input element
    const photoInputElement = document.getElementById('organization-photo');
    // 2) Extract the file object, if it exists
    const photoFile = photoInputElement?.files?.length ? photoInputElement.files[0] : null;

    let photoURL = null;

    try {
      // 3) Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 4) Optionally update the user's displayName
      await updateProfile(user, { displayName: organizationName });

      // 5) Create a new Firestore doc for this venue
      //    (Set a placeholder photo URL if needed)
      if (photoFile) {
        photoURL = 'https://via.placeholder.com/300';
      }

      await setDoc(doc(db, "venues", user.uid), {
        vid: user.uid,
        approved: false,
        description: description,
        email: user.email,
        location: loc,
        organizationName: organizationName,
        organizationType: (organizationType === "Other") ? otherOrgType : organizationType,
        phoneNumber: phoneNumber,
        photoURL: photoURL
      });

      // 6) If the user uploaded a photo, store it in Storage and update Firestore
      if (photoFile) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}.jpg`);
        await uploadBytes(storageRef, photoFile);

        const downloadURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "venues", user.uid), {
          photoURL: downloadURL
        });
      }

      // 7) Show success alert
      showAlert(
        "Signup successful!",
        "You can log in as soon as we approve your account. This should take less than 24 hours."
      );

    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      showAlert("Error", error.message);
    }
  });
}
