import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAg6YuOCJnA6wu9Ovj3w6GlpC2xVuSpL1s",
  authDomain: "tradingapp-d1625.firebaseapp.com",
  databaseURL: "https://tradingapp-d1625-default-rtdb.firebaseio.com",
  projectId: "tradingapp-d1625",
  storageBucket: "tradingapp-d1625.firebasestorage.app",
  messagingSenderId: "1832556834",
  appId: "1:1832556834:web:41df4d9da6472d3ceead7b",
  measurementId: "G-5CS5967SL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Set auth persistence
setPersistence(auth, browserLocalPersistence);

// Enable offline persistence for Firestore (only in browser)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      // Browser doesn't support persistence
      console.warn("Firestore persistence not supported in this browser");
    } else {
      console.error("Firestore persistence error:", err);
    }
  });
}

export { auth, db, analytics };
