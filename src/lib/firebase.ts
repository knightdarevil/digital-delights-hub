import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyBOyZ0OK1xFmAaIFuegg8OvAJT1XxKiPmE",
  authDomain: "web2025-18d39.firebaseapp.com",
  projectId: "web2025-18d39",
  storageBucket: "web2025-18d39.firebasestorage.app",
  messagingSenderId: "132604429373",
  appId: "1:132604429373:web:d8e407d0f8ceaab7809654",
  measurementId: "G-0F3G012NP8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
