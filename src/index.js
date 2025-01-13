const menu = document.querySelector('#mobile-menu')
const menuLinks = document.querySelector('.navbar__menu')

if (menu && menuLinks) {
    menu.addEventListener('click', function() {
        menu.classList.toggle('is-active');
        menuLinks.classList.toggle('active');
    });
}

import './styles.css';


import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { setDoc, getDoc, doc, addDoc, collection } from "firebase/firestore";

// Handle signup
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const organizationName = document.getElementById('organization-name').value;
            const organizationType = document.getElementById('organization-type').value;
            const otherOrganizationType = document.getElementById('other-organization-type').value;

            const phoneNumber = document.getElementById('organization-phone').value || null;
            const description = document.getElementById('organization-description').value || null;
            const location = document.getElementById('organization-location').value || null;

            const photoInput = document.getElementById('organization-photo');
            let photoURL = null;

            const selectedUsers = Array.from(document.querySelectorAll('#selected-users .tag')).map(tag => tag.textContent.trim());

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                if (photoInput.files[0]) {
                    const storageRef = firebase.storage().ref(); // Replace with your Firebase storage ref
                    const fileRef = storageRef.child(`organization_photos/${user.uid}`);
                    await fileRef.put(photoInput.files[0]);
                    photoURL = await fileRef.getDownloadURL();
                }

                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    phoneNumber: phoneNumber,
                    organizationName: organizationName,
                    organizationType: organizationType === "Other" ? otherOrganizationType : organizationType,
                    description: description,
                    location: location,
                    linkedAccounts: selectedUsers,
                    photoURL: photoURL,
                    approved: false, // Default approval status
                });

                alert('Signup successful. You can log in as soon as we approve your account! (this should take less than 24 hours)');
                window.location.href = './';
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

    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            // Mandatory fields
            const eventName = document.getElementById('event-name').value;
            const startTime = document.getElementById('start-time').value;
            const endTime = document.getElementById('end-time').value;
            const location = document.getElementById('search-input').value;
            const eventType = document.getElementById('event-type').value;

            // Handle "Other" event type
            const otherEventTypeInput = document.getElementById('other-event-type');
            const finalEventType = eventType === 'Other' ? otherEventTypeInput.value : eventType;

            // Optional fields
            const venueName = document.getElementById('venue-name').value || null;
            const inviteType = document.getElementById('invite-type').value || null;

            // Handle invitees if "Invites Only" is selected
            let invitees = [];
            if (inviteType === 'invites') {
                const inviteesSelect = document.getElementById('invitees-select');
                invitees = Array.from(inviteesSelect.selectedOptions).map(option => option.value);
            }

            const ticketing = document.getElementById('ticketing').value;
            const ticketPrice =
                ticketing === 'Yes'
                    ? document.getElementById('ticket-price').value || null
                    : null;
            const capacity =
                ticketing === 'Yes'
                    ? document.getElementById('capacity').value || null
                    : null;

            const eventDescription = document.getElementById('event-description').value || null;

            try {
                // Build event object WITHOUT image
                const eventData = {
                    eventName,
                    startTime,
                    endTime,
                    location,
                    eventType: finalEventType,
                    venueName,
                    inviteType,
                    invitees,
                    ticketing,
                    ticketPrice,
                    capacity,
                    eventDescription,
                    createdAt: new Date().toISOString(), // Add timestamp
                };

                // Save to Firestore
                await addDoc(collection(db, 'events'), eventData);

                alert('Event created successfully!');
                eventForm.reset(); // Reset the form
            } catch (error) {
                console.error('Error creating event:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

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
    
            welcomeTitle.textContent = `Welcome, ${userData.organizationName || 'User'}!`;
          } else {
            console.error('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
    });


});

