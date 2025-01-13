import { auth, db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const welcomeTitle = document.getElementById('welcome-title');

        welcomeTitle.textContent = `Welcome, ${userData.organizationName || 'User'}`;
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  });
});
