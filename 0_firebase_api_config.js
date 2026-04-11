// Firebase Configuration File
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";
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

// Configuração do projeto Firebase: tratamentoweb
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

// 🔐 Initialize App Check with reCAPTCHA v3
const SITE_KEY = "6LfxeLEsAAAAABNCDaVNHce2WYM45NlQSa8us17c";

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(SITE_KEY),
    isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);
const auth = getAuth(app);

console.log('Firebase inicializado! Project ID:', firebaseConfig.projectId);
console.log('App Check ativado com reCAPTCHA v3 - Site Key:', SITE_KEY);

export { 
    db, 
    auth,
    appCheck,
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
