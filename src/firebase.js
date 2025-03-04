// Import the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// If needed: import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3VmsjW-vXTctJIgCkRq2fek8xAjowits",
    authDomain: "slimver1b.firebaseapp.com",
    projectId: "slimver1b",
    storageBucket: "slimver1b.appspot.com",
    messagingSenderId: "875795575190",
    appId: "1:875795575190:web:1290332c20dbec1a36adb7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
