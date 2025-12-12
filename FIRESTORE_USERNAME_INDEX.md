# Firestore Index for Username Query

## Index Required

When users sign up, the system checks if a username is already taken by querying Firestore. This requires a Firestore index.

### Index Details

**Collection:** `users`  
**Field:** `username` (Ascending)

### How to Create the Index

#### Method 1: Automatic (Recommended)
When you first try to sign up with a username, Firebase will show an error with a link to create the index. Simply click the link.

#### Method 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `tradingapp-d1625`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure:
   - **Collection ID**: `users`
   - **Fields to index**:
     - Field: `username`, Order: **Ascending**
   - Click **Create**

### Index Building Time
- **Building Time**: Usually 1-2 minutes
- **Status**: Check Firebase Console → Indexes tab

### Query Used
```javascript
query(
  collection(db, "users"),
  where("username", "==", username.toLowerCase())
)
```

This index is required for the username uniqueness check during sign-up.

