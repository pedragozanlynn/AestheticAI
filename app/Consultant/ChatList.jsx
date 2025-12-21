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
import { FlatList, Text, TouchableOpacity, View, Image, StyleSheet } from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";   // ✅ import navbar

export default function ConsultantChatList() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

  const fetchUserInfo = async (userId) => {
    try {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        return {
          name: data.name || "User",
          avatar: data.avatarUrl || null,
        };
      }
    } catch (e) {
      console.log("Error fetching user:", e);
    }
    return { name: "User", avatar: null };
  };

  useEffect(() => {
    const load = async () => {
      const consultantId = await AsyncStorage.getItem("consultantUid");
      if (!consultantId) return;

      const q = query(
        collection(db, "chatRooms"),
        where("consultantId", "==", consultantId),
        orderBy("lastMessageAt", "desc")
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        let rawRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ If no rooms found, seed dummy chats
        if (rawRooms.length === 0) {
          rawRooms = [
            {
              id: "dummy1",
              userId: "u1",
              consultantId,
              userName: "Juan Dela Cruz",
              avatar: null,
              lastMessage: "Hello Engineer, available ka ba bukas?",
              lastMessageAt: { seconds: Math.floor(Date.now() / 1000) },
              unreadForConsultant: true,
            },
            {
              id: "dummy2",
              userId: "u2",
              consultantId,
              userName: "Maria Santos",
              avatar: null,
              lastMessage: "Salamat po sa advice!",
              lastMessageAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
              unreadForConsultant: false,
            },
          ];
        }

        const roomsWithNames = await Promise.all(
          rawRooms.map(async (room) => {
            if (!room.userName) {
              const userInfo = await fetchUserInfo(room.userId);
              return { ...room, userName: userInfo.name, avatar: userInfo.avatar };
            }
            return room;
          })
        );

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          View and manage your recent conversations
        </Text>
      </View>

      {/* Chat list */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarLetter}>{item.userName?.charAt(0)}</Text>
              )}
            </View>

            {/* Name + last message */}
            <View style={styles.chatContent}>
              <Text style={styles.chatName}>{item.userName}</Text>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>

            {/* Timestamp + unread badge */}
            <View style={styles.chatMeta}>
              {item.lastMessageAt && (
                <Text style={styles.chatTime}>
                  {new Date(item.lastMessageAt.seconds * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
              {item.unreadForConsultant && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>New</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ✅ Bottom navigation bar */}
      <BottomNavbar role="consultant" />
    </View>
  );
}

/* ------------------------------------------
 *              STYLES (Polished)
 * ------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA", // soft background for contrast
  },
  header: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "#01579B",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E0F7FA",
    marginTop: 6,
    marginBottom: 10, // ✅ extra spacing below subtitle
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chatItemPressed: {
    backgroundColor: "#F9FAFB", // ✅ subtle tint on press
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#90A4AE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F3E48",
  },
  chatMessage: {
    fontSize: 14,
    color: "#607D8B",
    marginTop: 2,
  },
  chatMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
    flexDirection: "row", // ✅ align timestamp and badge horizontally
    gap: 6,
  },
  chatTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadBadge: {
    backgroundColor: "#0277BD", // ✅ unified blue accent instead of maroon
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#0277BD",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
