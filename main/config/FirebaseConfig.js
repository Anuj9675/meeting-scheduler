// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "meeting-scheduler-1c7b7.firebaseapp.com",
  databaseURL: "https://meeting-scheduler-1c7b7-default-rtdb.firebaseio.com",
  projectId: "meeting-scheduler-1c7b7",
  storageBucket: "meeting-scheduler-1c7b7.appspot.com",
  messagingSenderId: "321998790985",
  appId: "1:321998790985:web:4f14e6b8e4dd53006bfa98",
  measurementId: "G-0HMMWXSK4W"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
