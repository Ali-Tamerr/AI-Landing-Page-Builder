import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrWY_9oRHxq2nYXXwVLOEVQw93YVeBofc",
  authDomain: "ai-saas-landing-page-auth-95.firebaseapp.com",
  projectId: "ai-saas-landing-page-auth-95",
  storageBucket: "ai-saas-landing-page-auth-95.firebasestorage.app",
  messagingSenderId: "258719850205",
  appId: "1:258719850205:web:2b2046719a9ffe069f4534"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
