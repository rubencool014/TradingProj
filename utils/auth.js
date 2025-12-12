// utils/auth.js
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";

/**
 * Checks if a user profile is complete (has all required fields)
 */
export async function isProfileComplete(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    return !!(
      userData.fullName &&
      userData.username &&
      userData.gender &&
      userData.country &&
      userData.securityQuestion &&
      userData.securityAnswer
    );
  } catch (error) {
    console.error("Error checking profile completion:", error);
    return false;
  }
}

/**
 * Ensures the current user has a valid token before making API calls
 * This helps prevent authentication errors
 */
export async function ensureValidToken() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    
    // Get fresh token (Firebase will refresh if needed)
    await user.getIdToken(true);
    await updateSessionCookie();
    return true;
  } catch (error) {
    console.error("Error ensuring valid token:", error);
    return false;
  }
}

/**
 * Updates the session cookie with the current Firebase ID token
 * Also updates the isAdmin cookie if applicable
 */
export async function updateSessionCookie() {
  try {
    const user = auth.currentUser;
    if (!user) {
      // Clear cookies if user is not authenticated
      Cookies.remove("session", { path: '/' });
      Cookies.remove("isAdmin", { path: '/' });
      return;
    }

    // Get fresh ID token (Firebase automatically refreshes if needed)
    const token = await user.getIdToken(true); // Force refresh if expired
    
    // Update session cookie with proper settings for production
    Cookies.set("session", token, { 
      expires: 7,
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
      path: '/'
    });
    
    // Check and update admin status
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      const isAdmin = adminDoc.exists();
      if (isAdmin) {
        Cookies.set("isAdmin", "true", { 
          expires: 7,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
          path: '/'
        });
      } else {
        Cookies.remove("isAdmin", { path: '/' });
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Don't fail the whole operation if admin check fails
    }
  } catch (error) {
    console.error("Error updating session cookie:", error);
    // If token refresh fails, clear cookies
    Cookies.remove("session", { path: '/' });
    Cookies.remove("isAdmin", { path: '/' });
  }
}

/**
 * Creates or updates a user document in Firestore for OAuth users
 * This ensures Google sign-in users have a user document with initial balance
 */
export async function createOrUpdateUserDocument(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // User doesn't exist, create new user document with minimal data
      const timestamp = Date.now();
      const uniqueId = `${timestamp.toString().slice(-4).padStart(4, "0")}`;
      
      await setDoc(userRef, {
        name: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email,
        userId: uniqueId,
        balance: {
          usd: 0,
        },
        creditScore: 100, // Initial credit score
        createdAt: new Date().toISOString(),
        // Profile incomplete - will need to complete profile
        profileComplete: false,
      });
    } else {
      // User exists, update email/name if they've changed
      const userData = userDoc.data();
      const updates = {};
      
      if (user.email && userData.email !== user.email) {
        updates.email = user.email;
      }
      
      if (user.displayName && userData.name !== user.displayName) {
        updates.name = user.displayName;
      }
      
      // Check if profile is complete
      const profileComplete = !!(
        userData.fullName &&
        userData.username &&
        userData.gender &&
        userData.country &&
        userData.securityQuestion &&
        userData.securityAnswer
      );
      updates.profileComplete = profileComplete;
      
      if (Object.keys(updates).length > 0) {
        await setDoc(userRef, updates, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error creating/updating user document:", error);
    // Don't throw - this shouldn't block authentication
  }
}

/**
 * Sets up a token refresh listener that updates cookies whenever the token changes
 * Call this once in your root layout or app component
 */
export function setupTokenRefresh() {
  if (typeof window === "undefined") return;

  let tokenRefreshInterval = null;

  // Listen for ID token changes (this fires when tokens are refreshed automatically)
  const unsubscribeToken = auth.onIdTokenChanged(async (user) => {
    if (user) {
      // User is signed in, update the cookie with fresh token
      await updateSessionCookie();
      
      // Clear any existing interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      
      // Set up periodic refresh (every 50 minutes, tokens expire after 1 hour)
      tokenRefreshInterval = setInterval(async () => {
        if (auth.currentUser) {
          try {
            // Force token refresh
            await auth.currentUser.getIdToken(true);
            await updateSessionCookie();
          } catch (error) {
            console.error("Error refreshing token:", error);
            // If refresh fails, clear interval
            if (tokenRefreshInterval) {
              clearInterval(tokenRefreshInterval);
              tokenRefreshInterval = null;
            }
          }
        } else {
          // User logged out, clear interval
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
          }
        }
      }, 50 * 60 * 1000); // Refresh every 50 minutes
    } else {
      // User is signed out, clear cookies and interval
      Cookies.remove("session", { path: '/' });
      Cookies.remove("isAdmin", { path: '/' });
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
    }
  });

  // Also listen for auth state changes to handle initial load
  const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Initial load - update cookie immediately
      await updateSessionCookie();
    }
  });

  // Return cleanup function
  return () => {
    unsubscribeToken();
    unsubscribeAuth();
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }
  };
}

