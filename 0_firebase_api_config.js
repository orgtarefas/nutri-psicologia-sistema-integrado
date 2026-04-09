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

console.log('Firebase inicializado! Project ID:', firebaseConfig.projectId);

// Export tudo que será usado nos outros arquivos
export { 
    db, 
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
};
