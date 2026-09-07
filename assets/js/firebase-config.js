// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  get,
  getDatabase,
  limitToLast,
  onValue,
  orderByChild,
  push,
  ref,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0fJs9dBQhGYQpU_KvRPkYSwL7I9nukVE",
  authDomain: "aile-davranis-analiz-sistemi.firebaseapp.com",
  databaseURL:
    "https://aile-davranis-analiz-sistemi-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "aile-davranis-analiz-sistemi",
  storageBucket: "aile-davranis-analiz-sistemi.firebasestorage.app",
  messagingSenderId: "479679067471",
  appId: "1:479679067471:web:a04788b2c6eb273504013a",
  measurementId: "G-S3TWFREGG7",
};

const SECRET_KEY = "adas_custom_secret_key_2026";

// Firebase Başlatma
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Yardımcı DB Fonksiyonları
export async function dbGet(path) {
  try {
    const dataRef = ref(db, path);
    const snapshot = await get(dataRef);
    return snapshot.val();
  } catch (err) {
    console.error("Firebase Get Hatası:", err);
    throw err;
  }
}

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

// Şifreleme Metotları
export function encryptData(data) {
  if (typeof CryptoJS !== "undefined") {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  }
  return JSON.stringify(data);
}

export function decryptData(ciphertext) {
  try {
    if (typeof CryptoJS !== "undefined") {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
    return JSON.parse(ciphertext);
  } catch (e) {
    return null;
  }
}

export {
  get,
  limitToLast,
  onAuthStateChanged,
  orderByChild,
  push,
  ref,
  remove,
  set,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  update,
};
