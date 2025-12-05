// Firebase Configuration Instructions
// ------------------------------------------------------------------
// To make the Login and Database work with real data, you need to:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project named "PropertyPick"
// 3. Enable "Authentication" (Phone Sign-in) and "Firestore Database"
// 4. Copy the config object below and replace the placeholders.

const firebaseConfig = {
    apiKey: "AIzaSyD4crY0x8_sAr6Re6-kJQeN8c1TJRE28nM",
    authDomain: "propertypick-c3da9.firebaseapp.com",
    projectId: "propertypick-c3da9",
    storageBucket: "propertypick-c3da9.firebasestorage.app",
    messagingSenderId: "535200877856",
    appId: "1:535200877856:web:d010312e483120cad25b45"
};

// NOTE: Currently, the app is running in "Mock Mode" using LocalStorage.
// This means it works perfectly on your computer without internet/server.
// When you are ready to go live, you can uncomment the Firebase code in app.js.
