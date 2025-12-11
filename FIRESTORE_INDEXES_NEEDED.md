# Firestore Indexes Required

## All Indexes Needed for This Project

You need to create **multiple composite indexes** for different queries. Here are all of them:

### Index 1: userId + createdAt
**For queries:** Filter by userId, order by createdAt
- Collection: `trades`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Used in:**
- Order History component
- Last Order query

### Index 2: status + userId + createdAt ⚠️ (This is the one you're missing)
**For queries:** Filter by status AND userId, order by createdAt
- Collection: `trades`
- Fields:
  - `status` (Ascending)
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Used in:**
- Active Orders component (when filtering by status="active")

### Index 3: createdAt (Single field - usually auto-created)
**For queries:** Order all trades by createdAt
- Collection: `trades`
- Fields:
  - `createdAt` (Descending)

**Used in:**
- Admin Trades page

## How to Create Index 2 (The Missing One)

### Method 1: Click the Error Link
The error message provides a direct link. Click it:
```
https://console.firebase.google.com/v1/r/project/tradingapp-d1625/firestore/indexes?create_composite=Ck9wcm9qZWN0cy90cmFkaW5nYXBwLWQxNjI1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFkZXMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

### Method 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `tradingapp-d1625`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure:
   - **Collection ID**: `trades`
   - **Fields to index** (add in this order):
     1. Field: `status`, Order: **Ascending**
     2. Field: `userId`, Order: **Ascending**
     3. Field: `createdAt`, Order: **Descending**
   - Click **Create**

## Index Building Time

- **Building Time**: 2-5 minutes (can take up to 10 minutes for large datasets)
- **Status**: Check Firebase Console → Indexes tab
  - "Building" = Still creating
  - "Enabled" = Ready to use
- **Why it takes time**: Firebase needs to scan and index all existing documents

## Why You're Still Getting the Error

1. **Index is still building**: Check Firebase Console to see if it's "Building" or "Enabled"
2. **Wrong index created**: Make sure you created the index with ALL three fields (status, userId, createdAt)
3. **Cache issue**: Try clearing browser cache or hard refresh (Ctrl+Shift+R)
4. **Multiple tabs**: Close other tabs and refresh

## Verify All Indexes Are Created

Go to Firebase Console → Firestore Database → Indexes tab and verify you have:

✅ Index 1: `trades` - userId (Ascending), createdAt (Descending)
✅ Index 2: `trades` - status (Ascending), userId (Ascending), createdAt (Descending)
✅ Index 3: `trades` - createdAt (Descending) - usually auto-created

## Troubleshooting

### If index is "Building" for more than 10 minutes:
- Check if you have a lot of documents in the `trades` collection
- Large collections take longer to index
- Wait a bit longer or check Firebase status

### If error persists after index is "Enabled":
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Close all tabs and reopen
4. Check the index fields match exactly (order matters!)

### If you see different error links:
- Each different query combination needs its own index
- Click each error link to create the required indexes
- Firestore will tell you exactly which index is missing

