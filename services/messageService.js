// services/messageService.js

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "../config/firebase";

/**
 * SEND TEXT MESSAGE
 */
export const sendMessage = async (roomId, senderId, senderType, text) => {
  if (!roomId) throw new Error("sendMessage: roomId missing");
  if (!senderId) throw new Error("sendMessage: senderId missing");
  if (!senderType) throw new Error("sendMessage: senderType missing");
  if (!text || !text.trim()) return null;

  senderType = senderType.trim().toLowerCase();
  if (senderType !== "user" && senderType !== "consultant") {
    throw new Error("Invalid senderType: must be 'user' or 'consultant'");
  }

  // 1. Get chat room
  const roomRef = doc(db, "chatRooms", roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Chat room does not exist.");

  const room = snap.data();
  const userId = room.userId;
  const consultantId = room.consultantId;

  // 2. Message collection
  const msgRef = collection(db, "chatRooms", roomId, "messages");

  const messageData = {
    text: text.trim(),
    type: "text",     // ⭐ NEW: mark this as text message
    senderId,
    senderType,
    createdAt: serverTimestamp(),
    userId,
    consultantId,
  };

  const messageDoc = await addDoc(msgRef, messageData);

  // 3. Update chat metadata
  await updateDoc(roomRef, {
    lastMessage: text.trim(),
    lastSenderId: senderId,
    lastSenderType: senderType,
    lastMessageAt: serverTimestamp(),

    unreadForUser: senderType === "consultant",
    unreadForConsultant: senderType === "user",
  });

  return messageDoc.id;
};



// =============================================================
// 📌 NEW FEATURE: SEND FILE MESSAGE (PDF, DOCX, PPT, etc.)
// =============================================================
export const sendFileMessage = async (
  roomId,
  senderId,
  senderType,
  fileUrl,
  fileName,
  fileType
) => {
  if (!roomId) throw new Error("sendFileMessage: roomId missing");
  if (!senderId) throw new Error("sendFileMessage: senderId missing");
  if (!fileUrl) throw new Error("sendFileMessage: fileUrl missing");

  senderType = senderType.trim().toLowerCase();
  if (senderType !== "user" && senderType !== "consultant") {
    throw new Error("Invalid senderType: must be 'user' or 'consultant'");
  }

  // 1. Get chat room
  const roomRef = doc(db, "chatRooms", roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Chat room does not exist.");

  const room = snap.data();
  const userId = room.userId;
  const consultantId = room.consultantId;

  // 2. Add file message
  const msgRef = collection(db, "chatRooms", roomId, "messages");

  const messageData = {
    type: "file",       // ⭐ identifies as FILE message
    fileUrl,
    fileName,
    fileType,           // pdf, docx, ppt, etc.

    senderId,
    senderType,
    createdAt: serverTimestamp(),

    // required for Firestore rules
    userId,
    consultantId,
  };

  const messageDoc = await addDoc(msgRef, messageData);

  // 3. Update last message metadata
  await updateDoc(roomRef, {
    lastMessage: fileName || "📎 File attachment",
    lastSenderId: senderId,
    lastSenderType: senderType,
    lastMessageAt: serverTimestamp(),

    unreadForUser: senderType === "consultant",
    unreadForConsultant: senderType === "user",
  });

  return messageDoc.id;
};
