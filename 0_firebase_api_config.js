// Firebase Configuration File
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB8tkMR4kx_c4Hj9TNf0EPTEwWMEQc-oDs",
    authDomain: "tratamentoweb.firebaseapp.com",
    projectId: "tratamentoweb",
    storageBucket: "tratamentoweb.firebasestorage.app",
    messagingSenderId: "894728971208",
    appId: "1:894728971208:web:52278dc3754180626c16fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('Firebase inicializado! Project ID:', firebaseConfig.projectId);

export { 
    db, 
    auth,
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
};
