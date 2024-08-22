// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD-MFE7PEy4_Z1nNnejr_ziRRs_rOIy2o",
  authDomain: "yookah-a02f0.firebaseapp.com",
  projectId: "yookah-a02f0",
  storageBucket: "yookah-a02f0.appspot.com",
  messagingSenderId: "894588898266",
  appId: "1:894588898266:web:9c92f438052580d99b8ee3",
  measurementId: "G-CBRVDC7G59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
//const db = import.meta.env.PROD ? getFirestore(app, "iowa") : getFirestore(app);
const db = getFirestore(app, "prod")
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
const functions = getFunctions(app);
export { auth, googleProvider, db, functions, storage }
