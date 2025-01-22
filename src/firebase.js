// Import the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// If needed: import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4gErbx-vRa0Hg5bCGUjbsiz7D7t_Dhv4",
    authDomain: "moves-website-8e7dd.firebaseapp.com",
    projectId: "moves-website-8e7dd",
    storageBucket: "moves-website-8e7dd.firebasestorage.app",
    messagingSenderId: "417553981682",
    appId: "1:417553981682:web:a65e162883586dca54b06b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db};
