// services/chatService.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export const ensureChatRoom = async (roomId, userId, consultantId, appointmentId) => {
  const roomRef = doc(db, "chatRooms", roomId);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    await setDoc(roomRef, {
      userId,
      consultantId,
      appointmentId,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSenderId: "",
      lastSenderType: "",
      unreadForUser: false,
      unreadForConsultant: false,
    });
  } else {
    const existing = snap.data();
    if (appointmentId && existing.appointmentId !== appointmentId) {
      await updateDoc(roomRef, { appointmentId });
    }
  }

  // 🔑 Always sync chatRoomId back to appointment
  if (appointmentId) {
    await updateDoc(doc(db, "appointments", appointmentId), {
      chatRoomId: roomId,
    });
  }

  return roomId;
};
