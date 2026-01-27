import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Firebase configuration with fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCC5HlXO9j3YkPsBLj5aVlTXhdJkLGvbmU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "athar-446da.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "athar-446da",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "athar-446da.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "659732184803",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:659732184803:web:2bab05198750dafd020fd6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-G6ELXLG4BJ"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Analytics - only initialize in browser and wrap in try-catch
export let analytics = null
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    try {
      analytics = getAnalytics(app)
    } catch (e) {
      console.log('Analytics not available')
    }
  }).catch(() => {
    console.log('Analytics module not available')
  })
}

export default app
