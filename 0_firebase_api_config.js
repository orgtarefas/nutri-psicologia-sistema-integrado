// Firebase Configuration File
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAO8iQ-Fo16MFjq17MDKvqUFT3n2tlHyFc",
  authDomain: "data-base-online-evox1.firebaseapp.com",
  databaseURL: "https://data-base-online-evox1-default-rtdb.firebaseio.com",
  projectId: "data-base-online-evox1",
  storageBucket: "data-base-online-evox1.firebasestorage.app",
  messagingSenderId: "972957988116",
  appId: "1:972957988116:web:072faae5fdfcceab767e01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export database instance
export { db };