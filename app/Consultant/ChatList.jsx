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

export default function ConsultantChatList() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

  // Fetch USER info
  const fetchUserInfo = async (userId) => {
    try {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data().name || "User";
    } catch (e) {
      console.log("Error fetching user:", e);
    }
    return "User";
  };

  useEffect(() => {
    const load = async () => {
      // ❌ WRONG: "uid"
      // const consultantId = await AsyncStorage.getItem("uid");

      // ✅ FIXED:
      const consultantId = await AsyncStorage.getItem("consultantUid");

      if (!consultantId) {
        console.log("❌ No consultant UID found in storage");
        return;
      }

      console.log("📌 CONSULTANT ChatList — UID:", consultantId);

      const q = query(
        collection(db, "chatRooms"),
        where("consultantId", "==", consultantId),
        orderBy("lastMessageAt", "desc")
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        const rawRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const roomsWithNames = await Promise.all(
          rawRooms.map(async (room) => {
            const userName = await fetchUserInfo(room.userId);
            return { ...room, userName };
          })
        );

        console.log("📌 Consultant ChatList — Rooms Found:", roomsWithNames);
        setRooms(roomsWithNames);
      });

      return () => unsub();
    };

    load();
  }, []);

  const openChat = (room) => {
    router.push({
      pathname: "/Consultant/ChatRoom",
      params: {
        roomId: room.id,
        userId: room.userId,
        consultantId: room.consultantId,
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
              backgroundColor: item.unreadForConsultant ? "#FFF4F4" : "#FFF",
              paddingHorizontal: 10,
              borderRadius: 6,
              marginBottom: 6,
            }}
            onPress={() => openChat(item)}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: "#0F3E48" }}
            >
              {item.userName}
            </Text>

            <Text style={{ fontSize: 14, color: "gray", marginTop: 4 }}>
              {item.lastMessage || "No messages yet"}
            </Text>

            {item.unreadForConsultant && (
              <Text style={{ color: "red", marginTop: 5, fontWeight: "bold" }}>
                ● New message
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
