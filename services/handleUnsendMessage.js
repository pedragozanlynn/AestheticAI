import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "../config/firebase";
import { deleteFromSupabase } from "./fileUploadService";

export const handleUnsendMessage = async (msg, roomId, currentUserId, setMessages) => {
  if (!msg || !roomId || !currentUserId || !msg.id) return;

  console.log("🟢 handleUnsendMessage called");
  console.log("🟢 roomId:", roomId);
  console.log("🟢 currentUserId:", currentUserId);
  console.log("🟢 msg.id:", msg.id);
  console.log("🟢 msg.senderId:", msg.senderId);
  console.log("🟢 msg.type:", msg.type);

  if (msg.senderId !== currentUserId) {
    console.log("❌ Current user is not the sender");
    Alert.alert("Cannot Unsend", "Only the sender can unsend this message.");
    return;
  }

  Alert.alert("Unsend Message", "Are you sure you want to unsend this message?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Unsend",
      style: "destructive",
      onPress: async () => {
        console.log("ℹ️ User confirmed unsend");

        // Optimistic UI
        setMessages(prev =>
          prev.map(m =>
            m.id === msg.id
              ? { ...m, text: "Message unsent", unsent: true, unsentAt: new Date(), sending: false }
              : m
          )
        );

        try {
          if (!msg.id.startsWith("temp-")) {
            const msgRef = doc(db, "chatRooms", roomId, "messages", msg.id);

            const snap = await getDoc(msgRef);
            if (!snap.exists()) {
              console.log("⚠️ Message does not exist in Firestore");
              return;
            }

            const data = snap.data();
            const payload = {
              text: "Message unsent",
              unsent: true,
              unsentAt: serverTimestamp(),
            };

            console.log("ℹ️ Updating Firestore with payload:", payload);
            await updateDoc(msgRef, payload);
            console.log("✅ Message successfully unsent in Firestore");
          }

          // Delete file if needed
          if (msg.fileUrl && msg.type !== "text") {
            try {
              await deleteFromSupabase(msg.fileUrl);
              console.log("ℹ️ Supabase file deleted:", msg.fileUrl);
            } catch (err) {
              console.log("⚠️ Supabase deletion failed:", err);
            }
          }
        } catch (err) {
          console.log("❌ Failed to unsend message:", err);
          setMessages(prev =>
            prev.map(m => (m.id === msg.id ? { ...m, failed: true } : m))
          );
          Alert.alert("Unsend Failed", "Please try again.");
        }
      },
    },
  ]);
};
