// Firebase core
import { initializeApp } from "firebase/app";

// Auth
import { getAuth } from "firebase/auth";

// 🔥 Firestore (this is required for db)
import { getFirestore } from "firebase/firestore";

// Your config (keep YOUR actual values here)
const firebaseConfig = {
  apiKey: "AIzaSyB-1ltMOFQK-J5a0pSfimXpwy0-dWDUCBc",
  authDomain: "beyond-cse-7dabd.firebaseapp.com",
  projectId: "beyond-cse-7dabd",
  storageBucket: "beyond-cse-7dabd.firebasestorage.app",
  messagingSenderId: "1074069420289",
  appId: "1:1074069420289:web:fe10a92d15fbd980648300",
};

// Initialize app
const app = initializeApp(firebaseConfig);

// ✅ Export Auth
export const auth = getAuth(app);

// ✅ Export Firestore DB (THIS FIXES ERROR)
export const db = getFirestore(app);