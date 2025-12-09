# Setting Up the First Admin

This guide explains how to create the first administrator account in the system.

## Method 1: Using the Setup Page (Recommended)

This is the easiest method for creating the first admin.

### Steps:

1. **Sign up or Sign in** to your application
   - Go to `/sign-up` to create a new account, or
   - Go to `/sign-in` if you already have an account

2. **Navigate to the Setup Page**
   - Go to `/setup-admin` in your browser
   - Or visit: `http://localhost:3000/setup-admin` (for local development)

3. **Create the First Admin**
   - The page will check if any admins exist
   - If no admins exist, you'll see a form to create the first admin
   - Enter your email (or it will use your current account email)
   - Click "Create First Admin"

4. **Access Admin Panel**
   - After creation, you'll be redirected to the admin panel
   - You can now add more admins through the admin panel at `/admin/manage`

### Important Notes:

- This page can only be used **once** - when no admins exist in the system
- Once the first admin is created, this page will show a message that setup is complete
- You must be signed in to use this page
- The admin account will be created using your current Firebase user account

---

## Method 2: Using Firebase Console

If you prefer to use Firebase Console directly:

### Steps:

1. **Get Your User UID**
   - Sign in to your application
   - Open browser console (F12)
   - Run: `firebase.auth().currentUser.uid` (if using Firebase SDK directly)
   - Or check the Firebase Authentication console for your user's UID

2. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Select your project

3. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click "Start collection" if Firestore is not set up yet

4. **Create the Admins Collection**
   - Collection ID: `admins`
   - Document ID: [Your Firebase User UID]
   - Add the following fields:
     - `email` (string): your-email@example.com
     - `role` (string): admin
     - `createdAt` (timestamp): current timestamp
     - `isFirstAdmin` (boolean): true

5. **Save the Document**
   - Click "Save"
   - Your first admin is now created!

6. **Sign Out and Sign In Again**
   - Sign out of your application
   - Sign in again to refresh your admin status
   - You should now have access to the admin panel

---

## Method 3: Using Browser Console Script

You can also run a script directly in the browser console:

### Steps:

1. **Sign in** to your application

2. **Open Browser Console** (F12)

3. **Run the following code:**

```javascript
// Get current user
const user = firebase.auth().currentUser;
if (!user) {
  console.error("You must be signed in!");
} else {
  // Check if admins exist
  firebase.firestore().collection("admins").get().then((snapshot) => {
    if (!snapshot.empty) {
      console.warn("Admins already exist!");
      return;
    }
    
    // Create first admin
    firebase.firestore().collection("admins").doc(user.uid).set({
      email: user.email,
      role: "admin",
      createdAt: new Date().toISOString(),
      isFirstAdmin: true
    }).then(() => {
      console.log("First admin created successfully!");
      console.log("Please refresh the page or sign out and sign in again.");
    }).catch((error) => {
      console.error("Error creating admin:", error);
    });
  });
}
```

4. **Refresh the page** or sign out and sign in again to access the admin panel

---

## After Creating the First Admin

Once the first admin is created:

1. **Access Admin Panel**: Go to `/admin` to access the admin dashboard
2. **Add More Admins**: Use the "Manage" page at `/admin/manage` to add additional admins
3. **Manage Users**: View and manage users at `/admin/users`
4. **View Feedback**: Check user feedback at `/admin/feedback`
5. **Manage Trades**: Monitor trades at `/admin/trades`

---

## Troubleshooting

### "Setup Complete" message appears
- This means an admin already exists
- You need to sign in with an admin account or have an existing admin add you

### "Authentication Required" message
- Make sure you're signed in to the application
- Go to `/sign-in` first, then return to `/setup-admin`

### Can't access admin panel after setup
- Try signing out and signing in again
- Clear your browser cookies and sign in again
- Check that the admin document was created correctly in Firestore

### Need to reset and start over
- Go to Firebase Console → Firestore Database
- Delete the `admins` collection
- Then use the setup page again to create the first admin

---

## Security Notes

- The setup page (`/setup-admin`) is only accessible when no admins exist
- Once the first admin is created, only existing admins can add new admins
- Always use strong passwords for admin accounts
- Consider using two-factor authentication for admin accounts
- Regularly review admin access and remove unnecessary admin accounts

