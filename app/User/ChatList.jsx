import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import PaymentModal from "../components/PaymentModal";

export default function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const router = useRouter();

  /* ================= HELPERS ================= */

  const fetchConsultantInfo = async (consultantId) => {
    try {
      const snap = await getDoc(doc(db, "consultants", consultantId));
      if (!snap.exists()) return { name: "Consultant" };
      const c = snap.data();
      return { name: c.fullName || "Consultant" };
    } catch {
      return { name: "Consultant" };
    }
  };

  const fetchAppointmentInfo = async (appointmentId) => {
    try {
      const snap = await getDoc(doc(db, "appointments", appointmentId));
      if (!snap.exists()) return null;
      const a = snap.data();
      return {
        date: a.date || null,
        time: a.time || null,
      };
    } catch {
      return null;
    }
  };

  const checkPayment = async (room) => {
    try {
      const q = query(
        collection(db, "payments"),
        where("userId", "==", room.userId),
        where("consultantId", "==", room.consultantId),
        where("appointmentId", "==", room.appointmentId),
        where("status", "==", "completed")
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  };

  const openChatWithPaymentCheck = async (room) => {
    const hasPaid = await checkPayment(room);

    if (!hasPaid) {
      const appointment = await fetchAppointmentInfo(room.appointmentId);

      setCurrentPaymentData({
        userId: room.userId,
        consultantId: room.consultantId,
        consultantName: room.consultantName,
        appointmentId: room.appointmentId,
        appointmentDate: appointment?.date || "TBA",
        appointmentTime: appointment?.time || "TBA",
      });

      setPaymentModalVisible(true);
      return;
    }

    router.push({
      pathname: "/User/ChatRoom",
      params: {
        roomId: room.id,
        userId: room.userId,
        consultantId: room.consultantId,
      },
    });
  };

  /* ================= LOAD CHAT ROOMS ================= */

  useEffect(() => {
    const loadRooms = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;

      const q = query(
        collection(db, "chatRooms"),
        where("userId", "==", userId),
        orderBy("lastMessageAt", "desc")
      );

      return onSnapshot(q, async (snap) => {
        const enriched = await Promise.all(
          snap.docs.map(async (d) => {
            const room = { id: d.id, ...d.data() };
            const consultant = await fetchConsultantInfo(room.consultantId);
            return {
              ...room,
              consultantName: consultant.name,
            };
          })
        );
        setRooms(enriched);
      });
    };

    loadRooms();
  }, []);

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>Your consultations</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/User/Consultants")}
        >
          <Ionicons name="people" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => openChatWithPaymentCheck(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.consultantName?.[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.consultantName}</Text>
              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>

            {item.unreadForUser && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>NEW</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No conversations yet</Text>
        }
      />

      {currentPaymentData && (
        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          {...currentPaymentData}
          onPaymentSuccess={() => setPaymentModalVisible(false)}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },

  header: {
    backgroundColor: "#01579B",
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#E1F5FE", marginTop: 2 },

  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 14,
    elevation: 2,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0288D1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  name: { fontSize: 15, fontWeight: "700", color: "#0F3E48" },
  message: { fontSize: 13, color: "#607D8B", marginTop: 2 },

  unreadBadge: {
    backgroundColor: "#0288D1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontStyle: "italic",
  },
});
