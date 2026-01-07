import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAFdW-wIHdpci42YcngOBP-hhACBKGvW1Y",
  authDomain: "aestheticai-c3795.firebaseapp.com",
  projectId: "aestheticai-c3795",
  storageBucket: "aestheticai-c3795.firebasestorage.app",
  messagingSenderId: "873025464768",
  appId: "1:873025464768:android:49bb9dffb2f52f1aafc025",
};

// Initialize app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth setup
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

// Firestore setup
const db = getFirestore(app);

export {
  app,
  auth, createUserWithEmailAndPassword, db, signInWithEmailAndPassword,
  signOut,
  updateProfile
};

