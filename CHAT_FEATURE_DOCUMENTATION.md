# Chat Feature Documentation

## Overview
The chat feature allows users to communicate with admins in real-time. Each user has their own chat thread, and admins can view and reply to all user chats separately.

## Firestore Structure

### Collection: `chats`
Each document represents a chat thread for a user.

**Document ID:** User's Firebase UID

**Document Fields:**
- `userId` (string): User's Firebase UID
- `userName` (string): User's full name
- `userEmail` (string): User's email address
- `messages` (array): Array of message objects
- `lastMessage` (timestamp): Timestamp of the last message
- `lastMessageBy` (string): "user" or "admin" - who sent the last message
- `unreadCount` (number): Number of unread messages for admin
- `createdAt` (timestamp): When the chat was created
- `updatedAt` (timestamp): When the chat was last updated

**Message Object Structure:**
- `text` (string): Message content
- `sender` (string): "user" or "admin"
- `senderName` (string): Name of the sender
- `timestamp` (timestamp): When the message was sent
- `read` (boolean): Whether the message has been read

## Features

### User Side
- Chat button in navbar (MessageCircle icon)
- Opens a dialog with chat interface
- Real-time message updates
- Send messages to admin
- View message history
- Auto-scroll to latest message

### Admin Side
- Chat page at `/admin/chat`
- List of all user chats
- Search functionality to find specific chats
- Unread message count badges
- Select any chat to view and reply
- Real-time updates for all chats
- Separate chat threads for each user

## Firestore Indexes

### Index Required: `updatedAt` (Descending)
**Collection:** `chats`  
**Field:** `updatedAt` (Descending)

This index is needed for the admin chat page to order chats by most recent activity.

**How to Create:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `tradingapp-d1625`
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure:
   - **Collection ID**: `chats`
   - **Fields to index**:
     - Field: `updatedAt`, Order: **Descending**
   - Click **Create**

**Note:** Firebase may automatically create this index when you first use the feature. If you see an error with a link, click it to create the index.

## Security Rules

Make sure your Firestore security rules allow:
- Users to read and write their own chat document
- Admins to read and write all chat documents

Example rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chats/{chatId} {
      // Users can read/write their own chat
      allow read, write: if request.auth != null && request.auth.uid == chatId;
      
      // Admins can read/write all chats
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## Usage

### For Users
1. Click the chat icon (MessageCircle) in the navbar
2. Type your message and press Enter or click Send
3. Wait for admin response
4. Messages update in real-time

### For Admins
1. Navigate to Admin Dashboard → Chat
2. See list of all user chats
3. Click on a chat to open conversation
4. Type reply and send
5. Unread count shows number of unread messages from users

## Real-time Updates

Both user and admin interfaces use Firestore `onSnapshot` listeners for real-time updates. Messages appear instantly without page refresh.

