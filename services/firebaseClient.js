import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";
import "firebase/compat/storage";
const firebaseConfig = {
    apiKey: "AIzaSyBwgyneKtR1NZIkEAPcf5mhP5Z5L3WfxUE",
    authDomain: "lova-style-coach.firebaseapp.com",
    projectId: "lova-style-coach",
    storageBucket: "lova-style-coach.firebasestorage.app",
    messagingSenderId: "659872866512",
    appId: "1:659872866512:web:d1552e8c0da2c8e236bed5",
    measurementId: "G-TDLKQDDHJN"
};
// Initialize Firebase
// Using compat app initialization
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
let analytics;
if (typeof window !== 'undefined') {
    try {
        analytics = firebase.analytics();
    }
    catch (e) {
        console.warn("Firebase analytics init failed", e);
    }
}
export { analytics };
export default app;
