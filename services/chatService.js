// services/chatService.js
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * =========================================================
 *  ENSURE CHAT ROOM EXISTS (Creates once only)
 *  + keeps appointmentId updated
 * =========================================================
 */
export const ensureChatRoom = async (
  roomId,
  userId,
  consultantId,
  appointmentId = null
) => {
  if (!roomId) throw new Error("ensureChatRoom: roomId missing");
  if (!userId || !consultantId)
    throw new Error("ensureChatRoom: userId or consultantId missing");

  const roomRef = doc(db, "chatRooms", roomId);
  const snap = await getDoc(roomRef);

  // CREATE ONCE
  if (!snap.exists()) {
    await setDoc(roomRef, {
      userId,
      consultantId,
      appointmentId: appointmentId || null,

      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSenderId: "",
      lastSenderType: "",

      unreadForUser: false,
      unreadForConsultant: false,

      createdAt: serverTimestamp(),
    });
  }

  // ✅ UPDATE appointmentId IF ROOM ALREADY EXISTS
  else {
    const existing = snap.data();

    if (!existing.appointmentId && appointmentId) {
      await updateDoc(roomRef, {
        appointmentId,
      });
    }

    // If appointmentId has changed (optional)
    if (existing.appointmentId !== appointmentId && appointmentId) {
      await updateDoc(roomRef, {
        appointmentId,
      });
    }
  }

  return roomId;
};

/**
 * =========================================================
 *   UPDATE LAST MESSAGE
 * =========================================================
 */
export const updateLastMessage = async ({
  roomId,
  text,
  senderId,
  senderType,
}) => {
  if (!roomId || !text.trim()) return;

  const roomRef = doc(db, "chatRooms", roomId);

  await updateDoc(roomRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    lastSenderType: senderType,

    unreadForUser: senderType === "consultant",
    unreadForConsultant: senderType === "user",
  });
};

/**
 * =========================================================
 *   MARK AS READ — CONSULTANT
 * =========================================================
 */
export const markConsultantChatAsRead = async (roomId) => {
  if (!roomId) return;
  await updateDoc(doc(db, "chatRooms", roomId), {
    unreadForConsultant: false,
  });
};

/**
 * =========================================================
 *   MARK AS READ — USER
 * =========================================================
 */
export const markUserChatAsRead = async (roomId) => {
  if (!roomId) return;
  await updateDoc(doc(db, "chatRooms", roomId), {
    unreadForUser: false,
  });
};

/**
 * =========================================================
 *    REAL-TIME LISTENER FOR MESSAGES
 * =========================================================
 */
export const listenToMessages = (roomId, callback) => {
  if (!roomId) {
    console.warn("listenToMessages: roomId missing");
    return () => {};
  }

  const msgQuery = query(
    collection(db, "chatRooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(msgQuery, (snap) => {
    const msgs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    callback(msgs);
  });
};
