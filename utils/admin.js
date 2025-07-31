import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function createAdmin(email) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    await setDoc(doc(db, "admins", user.uid), {
      email,
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error creating admin:", error);
    return false;
  }
}

// Use this function in Firebase Console to add your first admin
export async function addAdminInConsole(uid, email) {
  try {
    await setDoc(doc(db, "admins", uid), {
      email,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error adding admin:", error);
    return false;
  }
}
