import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile, // ✅ DITO siya dapat
} from "firebase/auth";

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFdW-wIHdpci42YcngOBP-hhACBKGvW1Y",
  authDomain: "aestheticai-c3795.firebaseapp.com",
  projectId: "aestheticai-c3795",
  storageBucket: "aestheticai-c3795.firebasestorage.app",
  messagingSenderId: "873025464768",
  appId: "1:873025464768:android:49bb9dffb2f52f1aafc025"
};

// ✅ Gumamit ng existing app kung meron na
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Gumamit ng existing auth kung meron na, else initialize
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export {
  app,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
   updateProfile,
};
