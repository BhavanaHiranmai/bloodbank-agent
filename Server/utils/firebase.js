const admin = require("firebase-admin");

let messaging = null;

try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    const serviceAccount = JSON.parse(serviceAccountVar);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging();
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT environment variable is not defined");
  }
} catch (err) {
  console.error("Firebase Admin initialization failed:", err.message);
}

module.exports = { messaging };
