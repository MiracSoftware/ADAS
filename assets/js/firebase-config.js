// ADAS/assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  child,
  get,
  getDatabase,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0fJs9dBQhGYQpU_KvRPkYSwL7I9nukVE",
  authDomain: "aile-davranis-analiz-sistemi.firebaseapp.com",
  databaseURL: "https://aile-davranis-analiz-sistemi-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "aile-davranis-analiz-sistemi",
  storageBucket: "aile-davranis-analiz-sistemi.firebasestorage.app",
  messagingSenderId: "479679067471",
  appId: "1:479679067471:web:a04788b2c6eb273504013a",
  measurementId: "G-S3TWFREGG7"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const SECRET_KEY = "adas_custom_secret_key_2026";
const app = initializeApp(firebaseConfig);
export const db = firebase.database();
export const auth = firebase.auth();

export async function dbGet(path) {
  try {
    const snapshot = await db.ref(path).once("value");
    return snapshot.val();
  } catch (err) {
    console.error("Firebase Get Hatası:", err);
    throw err;
  }
}

// Anlık dinleme fonksiyonu
export function dbListen(path, callback) {
  const targetRef = ref(db, path);
  return onValue(
    targetRef,
    (snapshot) => {
      callback(snapshot.val());
    },
    (error) => {
      console.error("Anlık dinleme hatası:", error);
    },
  );
}

export {
  get,
  limitToLast,
  onAuthStateChanged,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  signInWithEmailAndPassword,
  signOut,
  update,
};

export function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

export function decryptData(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (e) {
    return null;
  }
}
