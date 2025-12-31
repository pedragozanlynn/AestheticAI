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
  StatusBar,
  SafeAreaView,
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import { Ionicons } from "@expo/vector-icons";

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

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => openChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.avatarLetter}>
              {item.userName?.[0] || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.userName}
          </Text>
          {item.lastMessageAt && (
             <Text style={styles.timeText}>
               {new Date(item.lastMessageAt?.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </Text>
          )}
        </View>
        
        <View style={styles.messageRow}>
          <Text style={styles.message} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </Text>
          {item.unreadForConsultant && (
            <View style={styles.unreadBadge}>
               <Text style={styles.unreadCount}>!</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Messages</Text>
            <Text style={styles.headerSub}>Your active consultations</Text>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active conversations yet</Text>
          </View>
        }
      />

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#01579B",
    paddingTop: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerContent: { paddingHorizontal: 25, paddingTop: 10 },
  headerText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 },

  listContainer: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    marginRight: 15,
  },
  avatar: { width: 54, height: 54, borderRadius: 18 },
  placeholderAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  avatarLetter: { color: "#01579B", fontWeight: "800", fontSize: 20 },

  contentWrap: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: "800", fontSize: 16, color: "#1E293B", flex: 1 },
  timeText: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },

  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  message: { color: "#64748B", fontSize: 14, flex: 1 },
  
  unreadBadge: {
    backgroundColor: "#01579B",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadCount: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: "#94A3B8", marginTop: 15, fontSize: 15, fontWeight: "500" },
});