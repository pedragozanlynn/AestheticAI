// hooks/useSendMessage.js
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { uploadToSupabase } from "./fileUploadService";

/**
 * useSendMessage
 * - Sends text / file messages
 * - Updates chatRooms metadata (lastMessage, unread flags)
 * - Safe even if chatRoom does not exist yet
 */
export function useSendMessage({
  roomId,
  senderId,
  senderType, // "user" | "consultant"
  setMessages, // from ChatRoom screen (for optimistic UI)
}) {
  // ----------------------------
  // SEND TEXT MESSAGE
  // ----------------------------
  const sendTextMessage = async (text) => {
    if (!text?.trim() || !roomId || !senderId) return;

    const tempId = `temp-${Date.now()}`;

    // 🔹 Optimistic UI
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
      });

      // 🔹 Replace temp message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: docRef.id, sending: false }
            : m
        )
      );

      // 🔥 UPDATE / CREATE CHATROOM METADATA (SAFE)
      await setDoc(
        doc(db, "chatRooms", roomId),
        {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          unreadForUser: senderType === "consultant",
          unreadForConsultant: senderType === "user",
        },
        { merge: true }
      );

      return docRef.id;
    } catch (err) {
      console.log("❌ sendTextMessage failed:", err);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, sending: false, failed: true }
            : m
        )
      );
    }
  };

  // ----------------------------
  // SEND FILE / IMAGE MESSAGE
  // ----------------------------
  const sendFileMessage = async (file) => {
    if (!file || !roomId || !senderId) return;

    const isImage = file.mimeType?.startsWith("image/");
    const tempId = `temp-file-${Date.now()}`;

    // 🔹 Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId,
        senderType,
        type: isImage ? "image" : "file",
        fileName: file.name,
        fileType: file.mimeType,
        localUri: file.uri,
        sending: true,
        failed: false,
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
      });

      // 🔹 Replace temp message
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
              }
            : m
        )
      );

      // 🔥 UPDATE / CREATE CHATROOM METADATA
      await setDoc(
        doc(db, "chatRooms", roomId),
        {
          lastMessage: isImage ? "📷 Image" : uploaded.fileName,
          lastMessageAt: serverTimestamp(),
          unreadForUser: senderType === "consultant",
          unreadForConsultant: senderType === "user",
        },
        { merge: true }
      );

      return docRef.id;
    } catch (err) {
      console.log("❌ sendFileMessage failed:", err);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, sending: false, failed: true }
            : m
        )
      );
    }
  };

  return {
    sendTextMessage,
    sendFileMessage,
  };
}
