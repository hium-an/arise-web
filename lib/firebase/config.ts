import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

// Warn about missing env vars in browser console (client-only)
if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => `NEXT_PUBLIC_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
  if (missing.length > 0) {
    console.error(`[Firebase] Missing env vars: ${missing.join(', ')}`)
  }
}

// Firebase Web SDK is client-only.
// On the server, return an empty placeholder — auth.ts also guards usage so
// no Firebase network call is ever made during SSR.
const app: FirebaseApp =
  typeof window !== 'undefined'
    ? getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
    : ({} as FirebaseApp)

export default app
