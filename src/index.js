// styles
import './styles.css';

// Import Firebase auth and Firestore from the initialization file
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, getDoc, doc } from "firebase/firestore";

// Handle signup
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Add user to pending collection for admin approval
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    approved: false
                });

                alert('Signup successful. Waiting for admin approval.');
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
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
                        alert('Login successful. You are approved.');
                        // Proceed to redirect the user or perform other actions
                    } else {
                        alert('Your account is not yet approved. Please wait for admin approval.');
                        // Optionally sign out the user
                        auth.signOut();
                    }
                } else {
                    alert('User record not found. Please contact support.');
                    auth.signOut();
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }     
});
