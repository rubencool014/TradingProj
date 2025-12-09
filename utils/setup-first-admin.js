/**
 * Utility script to create the first admin
 * 
 * This can be run in the browser console or as a Node.js script
 * 
 * Usage in Browser Console:
 * 1. Sign in to your application
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Run: setupFirstAdmin('your-email@example.com', 'your-user-uid')
 * 
 * Or use the setup page at /setup-admin
 */

import { db } from "@/lib/firebase";
import { doc, setDoc, collection, query, getDocs } from "firebase/firestore";

/**
 * Creates the first admin in the system
 * @param {string} email - Admin email address
 * @param {string} uid - Firebase user UID
 * @returns {Promise<boolean>} - Success status
 */
export async function setupFirstAdmin(email, uid) {
  try {
    // Check if any admins already exist
    const adminsQuery = query(collection(db, "admins"));
    const snapshot = await getDocs(adminsQuery);
    
    if (!snapshot.empty) {
      console.warn("Admins already exist. Use the admin panel to add more admins.");
      return false;
    }

    // Create the first admin
    await setDoc(doc(db, "admins", uid), {
      email,
      role: "admin",
      createdAt: new Date().toISOString(),
      isFirstAdmin: true,
    });

    console.log("First admin created successfully!");
    return true;
  } catch (error) {
    console.error("Error creating first admin:", error);
    return false;
  }
}

/**
 * Alternative method: Create first admin via Firebase Console
 * 
 * Steps:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your project
 * 3. Go to Firestore Database
 * 4. Create a new collection called "admins"
 * 5. Add a document with:
 *    - Document ID: [Your Firebase User UID]
 *    - Fields:
 *      - email: (string) your-email@example.com
 *      - role: (string) admin
 *      - createdAt: (timestamp) current timestamp
 *      - isFirstAdmin: (boolean) true
 */

