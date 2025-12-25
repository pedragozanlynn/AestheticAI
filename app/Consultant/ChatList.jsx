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
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";

export default function ConsultantChatList() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

  const fetchUserInfo = async (userId) => {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return { name: "User", avatar: null };
    const u = snap.data();
    return {
      name: u.fullName || u.name || "User",
      avatar: u.avatarUrl || null,
    };
  };

  useEffect(() => {
    let unsub;

    const init = async () => {
      const consultantId = await AsyncStorage.getItem("consultantUid");
      if (!consultantId) {
        console.warn("❌ No consultantUid in storage");
        return;
      }

      const q = query(
        collection(db, "chatRooms"),
        where("consultantId", "==", consultantId),
        orderBy("lastMessageAt", "desc")
      );

      unsub = onSnapshot(q, async (snap) => {
        const baseRooms = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const enriched = await Promise.all(
          baseRooms.map(async (room) => {
            if (room.userName) return room;
            const user = await fetchUserInfo(room.userId);
            return { ...room, userName: user.name, avatar: user.avatar };
          })
        );

        setRooms(enriched);
      });
    };

    init();
    return () => unsub && unsub();
  }, []);

  const openChat = (room) => {
    router.push({
      pathname: "/Consultant/ChatRoom",
      params: {
        roomId: room.id,
        userId: room.userId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Messages</Text>
        <Text style={styles.headerSub}>Your active consultations</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => openChat(item)}
          >
            <View style={styles.avatarWrap}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {item.userName?.[0]}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.userName}</Text>
              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>

            {item.unreadForConsultant && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        )}
      />

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },
  header: {
    backgroundColor: "#01579B",
    padding: 18,
  },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#E0F7FA", marginTop: 4 },

  chatItem: {
    flexDirection: "row",
    padding: 14,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#90A4AE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarLetter: { color: "#fff", fontWeight: "700", fontSize: 18 },

  name: { fontWeight: "700", fontSize: 15 },
  message: { color: "#607D8B", marginTop: 2 },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0288D1",
  },
});
