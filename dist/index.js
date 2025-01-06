const menu = document.querySelector('#mobile-menu')
const menuLinks = document.querySelector('.navbar__menu')

if (menu && menuLinks) {
    menu.addEventListener('click', function() {
        menu.classList.toggle('is-active');
        menuLinks.classList.toggle('active');
    });
}

// styles
import './styles.css';

// Import Firebase auth and Firestore from the initialization file
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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

                alert('Signup successful. You can log in as soon as we approve your account!');
            } catch (error) {
                console.error('Signup error:', error.code, error.message);
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
                        window.location.href = '/dashboard.html';
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

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        console.log('yo');
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            const email = document.getElementById('forgot-email').value;

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            try {
            // Send the password reset email
                await sendPasswordResetEmail(auth, email);
                alert('Password reset email sent. Please check your inbox.');
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    } 
    
});
