"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function UserChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [chatId, setChatId] = useState(null);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Get or create chat document
        const chatDocRef = doc(db, "chats", user.uid);
        const chatDoc = await getDoc(chatDocRef);
        
        if (!chatDoc.exists()) {
          // Create new chat
          await setDoc(chatDocRef, {
            userId: user.uid,
            userName: userDoc.data()?.fullName || userDoc.data()?.name || user.displayName || "User",
            userEmail: user.email,
            messages: [],
            lastMessage: null,
            lastMessageBy: null,
            unreadCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        setChatId(user.uid);

        // Listen for real-time updates
        const unsubscribeChat = onSnapshot(chatDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const chatData = snapshot.data();
            setMessages(chatData.messages || []);
            
            // Reset unread count when user opens chat
            if (open && chatData.unreadCount > 0) {
              updateDoc(chatDocRef, { unreadCount: 0 });
            }
          }
        });

        return () => unsubscribeChat();
      } catch (error) {
        console.error("Error setting up chat:", error);
        toast({
          title: "Error",
          description: "Failed to load chat. Please try again.",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribe();
  }, [open, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId || !userData) return;

    setLoading(true);
    try {
      const chatDocRef = doc(db, "chats", chatId);
      
      // Ensure chat document exists
      const chatDoc = await getDoc(chatDocRef);
      if (!chatDoc.exists()) {
        // Create chat document if it doesn't exist
        await setDoc(chatDocRef, {
          userId: chatId,
          userName: userData.fullName || userData.name || "User",
          userEmail: auth.currentUser?.email || "",
          messages: [],
          lastMessage: null,
          lastMessageBy: null,
          unreadCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const newMessage = {
        text: message.trim(),
        sender: "user",
        senderName: userData.fullName || userData.name || "User",
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Get current messages to calculate unread count
      const currentData = chatDoc.exists() ? chatDoc.data() : { messages: [], unreadCount: 0 };
      const currentUnreadCount = currentData.unreadCount || 0;

      await updateDoc(chatDocRef, {
        messages: arrayUnion(newMessage),
        lastMessage: serverTimestamp(),
        lastMessageBy: "user",
        unreadCount: currentUnreadCount + 1, // Increment unread count
        updatedAt: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = "Failed to send message. Please try again.";
      
      // Provide more specific error messages
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your Firestore security rules.";
      } else if (error.code === "unavailable") {
        errorMessage = "Service unavailable. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Chat with Admin"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="sr-only">Chat</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[380px] h-[80vh] sm:h-[500px] max-h-[500px] flex flex-col p-0 m-4 sm:m-6 mx-auto">
          <DialogHeader className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Chat with Admin
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4 sm:px-5 py-3 sm:py-4 min-h-0" ref={scrollRef}>
            <div className="space-y-3 sm:space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 sm:py-8">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-xs sm:text-sm break-words">{msg.text}</p>
                      <p
                        className={`text-[10px] sm:text-xs mt-1 ${
                          msg.sender === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="px-4 sm:px-5 pb-3 sm:pb-4 pt-3 sm:pt-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 text-sm sm:text-base"
              />
              <Button type="submit" disabled={loading || !message.trim()} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

