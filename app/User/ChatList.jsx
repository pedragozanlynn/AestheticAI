import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../config/firebase";

export default function UserChatList() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

  // 🔥 Fetch consultant info once and attach to room
  const fetchConsultantInfo = async (consultantId) => {
    try {
      const ref = doc(db, "consultants", consultantId);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data().fullName || "Consultant";
    } catch (e) {
      console.log("Error fetching consultant:", e);
    }
    return "Consultant";
  };

  useEffect(() => {
    const load = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) {
        console.log("❌ No userUid found in storage");
        return;
      }

      console.log("📌 USER ChatList — UID:", userId);

      const q = query(
        collection(db, "chatRooms"),
        where("userId", "==", userId),
        orderBy("lastMessageAt", "desc")
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        const rawRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 🔥 Attach consultant names
        const roomsWithNames = await Promise.all(
          rawRooms.map(async (room) => {
            const consultantName = await fetchConsultantInfo(room.consultantId);
            return { ...room, consultantName };
          })
        );

        console.log("📌 User ChatList — Rooms Found:", roomsWithNames);
        setRooms(roomsWithNames);
      });

      return () => unsub();
    };

    load();
  }, []);

  const openChat = (room) => {
    router.push({
      pathname: "/User/ChatRoom",
      params: {
        roomId: room.id,
        consultantId: room.consultantId,
        appointmentId: room.appointmentId,
      },
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#F3F9FA" }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
          color: "#0F3E48",
        }}
      >
        Messages
      </Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            No chat rooms found.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderColor: "#ddd",
              backgroundColor: item.unreadForUser ? "#FFF4F4" : "#FFF",
              paddingHorizontal: 10,
              borderRadius: 6,
              marginBottom: 6,
            }}
            onPress={() => openChat(item)}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: "#0F3E48" }}
            >
              {item.consultantName}
            </Text>

            <Text style={{ fontSize: 14, color: "gray", marginTop: 4 }}>
              {item.lastMessage || "No messages yet"}
            </Text>

            {item.unreadForUser && (
              <Text
                style={{ color: "red", marginTop: 5, fontWeight: "bold" }}
              >
                ● New message
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}  