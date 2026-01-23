// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBHVQ8mlx19LyFO-VDdfsVg81TkIlHI8Ys",
  authDomain: "spaza-track.firebaseapp.com",
  projectId: "spaza-track",
  storageBucket: "spaza-track.firebasestorage.app",
  messagingSenderId: "218620982982",
  appId: "1:218620982982:web:68d09afa17d8b6111409c7",
  measurementId: "G-YZJ9KZ628Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;