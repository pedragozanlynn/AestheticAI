// hooks/useSendMessage.js
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../config/firebase";
import { uploadToSupabase } from "./fileUploadService";

export function useSendMessage({ roomId, senderId, senderType }) {
  const [messages, setMessages] = useState([]);

  // --- Send text message ---
  const sendTextMessage = async (text) => {
    if (!text?.trim() || !senderId || !roomId) return;

    const tempId = "temp-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text,
        senderId,
        senderType,
        type: "text",
        sending: true,
        failed: false,
      },
    ]);

    try {
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, {
        text,
        senderId,
        senderType,
        type: "text",
        createdAt: serverTimestamp(),
        unsent: false,
        unsentAt: null,
        fileUrl: null,
        fileName: null,
        fileType: null,
      });

      // Update temporary message with real ID
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: docRef.id, sending: false } : m
        )
      );

      // Update last message in chat room
      const chatRoomRef = doc(db, "chatRooms", roomId);
      await updateDoc(chatRoomRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });

      return docRef.id; // real message ID
    } catch (err) {
      console.log("❌ sendTextMessage failed", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, sending: false, failed: true } : m
        )
      );
    }
  };

  // --- Send file or image message ---
  const sendFileMessage = async (file) => {
    if (!file || !senderId || !roomId) return;

    const isImage = file.mimeType.startsWith("image/");
    const tempId = "temp-file-" + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        fileName: file.name,
        fileType: file.mimeType,
        senderId,
        senderType,
        type: isImage ? "image" : "file",
        sending: true,
        failed: false,
        fileUrl: null,
        localUri: file.uri,
      },
    ]);

    try {
      const uploaded = await uploadToSupabase(file);
      if (!uploaded?.fileUrl) throw new Error("Upload failed");

      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, {
        text: uploaded.fileName,
        senderId,
        senderType,
        type: isImage ? "image" : "file",
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        createdAt: serverTimestamp(),
        unsent: false,
        unsentAt: null,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: docRef.id,
                sending: false,
                failed: false,
                fileUrl: uploaded.fileUrl,
                localUri: null,
                type: isImage ? "image" : "file",
              }
            : m
        )
      );

      const chatRoomRef = doc(db, "chatRooms", roomId);
      await updateDoc(chatRoomRef, {
        lastMessage: uploaded.fileName,
        lastMessageAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.log("❌ sendFileMessage failed", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, sending: false, failed: true } : m
        )
      );
    }
  };

  return { messages, setMessages, sendTextMessage, sendFileMessage };
}
