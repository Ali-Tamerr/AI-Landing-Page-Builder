import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase conditionally to prevent SSR EvalError in Cloudflare Workers
const isBrowser = typeof window !== 'undefined';

const app = isBrowser
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

const auth = (app ? getAuth(app) : null) as Auth | null;
const db = (app ? getFirestore(app) : null) as Firestore | null;

export { auth, db };


