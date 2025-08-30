import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMQOvS8MSycFTvmVTfiydDuENUtON_PaM",
  authDomain: "project-manga-web.firebaseapp.com",
  projectId: "project-manga-web",
  storageBucket: "project-manga-web.firebasestorage.app",
  messagingSenderId: "922304614133",
  appId: "1:922304614133:web:311984868f9c73e1b13fbc"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider, db, storage };
