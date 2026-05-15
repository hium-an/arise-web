import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth'
import app from './config'

// Firebase Auth is client-only — do not initialize on the server.
// All callers (AuthProvider, login, signup) are 'use client' components.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = typeof window !== 'undefined' ? getAuth(app) : (null as any)
export const googleProvider = new GoogleAuthProvider()

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider)
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}
