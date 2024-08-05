// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAf00bYoVB1Qi_1wBCqDPsSZForgddOLE",
  authDomain: "my-pantry-tracker-2024.firebaseapp.com",
  projectId: "my-pantry-tracker-2024",
  storageBucket: "my-pantry-tracker-2024.appspot.com",
  messagingSenderId: "180116935201",
  appId: "1:180116935201:web:7ff9a1ba464f4efa558960",
  measurementId: "G-3EEWXT2KEV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { firestore, storage };
