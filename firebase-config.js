import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, ref, set, push, onValue, remove, update, child, get 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYY2-RZfe4RnRpE8ghToWnGfJQNcJF41g",
  authDomain: "rfid-access-and-security.firebaseapp.com",
  databaseURL: "https://rfid-access-and-security-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfid-access-and-security",
  storageBucket: "rfid-access-and-security.firebasestorage.app",
  messagingSenderId: "237024145430",
  appId: "1:237024145430:web:d843ba8c21ed9af2248537",
  measurementId: "G-N0D7V05P5S"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { 
    db, 
    auth, 
    ref, 
    set, 
    push, 
    onValue, 
    remove, 
    update, 
    child, 
    get, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
};