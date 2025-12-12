"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminChat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for all chats
    const chatsQuery = query(
      collection(db, "chats"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatsList);

      // Update selected chat if it exists
      if (selectedChat) {
        const updatedChat = chatsList.find((c) => c.id === selectedChat.id);
        if (updatedChat) {
          setSelectedChat(updatedChat);
          setMessages(updatedChat.messages || []);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages(chat.messages || []);

    // Mark messages as read
    if (chat.unreadCount > 0) {
      updateDoc(doc(db, "chats", chat.id), { unreadCount: 0 });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const chatDocRef = doc(db, "chats", selectedChat.id);
      
      // Ensure chat document exists
      const chatDoc = await getDoc(chatDocRef);
      if (!chatDoc.exists()) {
        toast({
          title: "Error",
          description: "Chat document not found. Please refresh the page.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const newMessage = {
        text: message.trim(),
        sender: "admin",
        senderName: "Admin",
        timestamp: new Date().toISOString(),
        read: false,
      };

      await updateDoc(chatDocRef, {
        messages: arrayUnion(newMessage),
        lastMessage: serverTimestamp(),
        lastMessageBy: "admin",
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
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return "Today";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6 h-[calc(100vh-4rem)] flex flex-col overflow-hidden max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-shrink-0 px-2 sm:px-0">
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">User Chats</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 min-h-0 overflow-hidden px-2 sm:px-0">
        {/* Chat List */}
        <Card className={`lg:col-span-1 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-8 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredChats.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <p className="text-sm sm:text-base">No chats found</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm sm:text-base">
                            {chat.userName || "Unknown User"}
                          </p>
                          <p className="text-xs opacity-70 truncate">
                            {chat.userEmail}
                          </p>
                          {chat.lastMessage && (
                            <p className="text-xs mt-1 truncate opacity-70">
                              {chat.lastMessageBy === "user" ? "User: " : "You: "}
                              {chat.messages?.[chat.messages.length - 1]?.text || ""}
                            </p>
                          )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 shrink-0 text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {chat.updatedAt && (
                        <p className="text-xs mt-1 opacity-70">
                          {formatDate(chat.updatedAt)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className={`lg:col-span-2 flex flex-col ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
          {selectedChat ? (
            <>
              <CardHeader className="border-b pb-2 sm:pb-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0"
                        onClick={() => setSelectedChat(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <p className="text-base sm:text-lg font-semibold truncate">
                        {selectedChat.userName || "Unknown User"}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {selectedChat.userEmail}
                    </p>
                  </div>
                  {selectedChat.unreadCount > 0 && (
                    <Badge variant="destructive" className="shrink-0 text-xs">
                      {selectedChat.unreadCount} unread
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1 px-2 sm:px-4 py-2 sm:py-4" ref={scrollRef}>
                  <div className="space-y-3 sm:space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6 sm:py-8">
                        <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.sender === "admin" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                              msg.sender === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-xs sm:text-sm font-medium mb-1 opacity-70">
                              {msg.senderName}
                            </p>
                            <p className="text-xs sm:text-sm break-words">{msg.text}</p>
                            <p
                              className={`text-[10px] sm:text-xs mt-1 ${
                                msg.sender === "admin"
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

                <form
                  onSubmit={handleSendMessage}
                  className="px-2 sm:px-4 pb-2 sm:pb-4 pt-2 sm:pt-4 border-t flex-shrink-0"
                >
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
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Select a chat to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

