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
  StatusBar,
  SafeAreaView,
} from "react-native";
import { db } from "../../config/firebase";
import PaymentModal from "../components/PaymentModal";

const THEME = {
  primary: "#01579B",
  bg: "#F8FAFC",
  avatarBg: "#DBEAFE",
  avatarText: "#1E40AF",
  textDark: "#0F172A",
  textGray: "#64748B",
};

export default function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const router = useRouter();

  /* ================= HELPERS (Same Logic) ================= */
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
      return { date: a.appointmentAt, time: a.appointmentAt };
    } catch (e) { return null; }
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
    } catch { return false; }
  };

  const openChatWithPaymentCheck = async (room) => {
    const hasPaid = await checkPayment(room);
    if (!hasPaid) {
      const appointment = await fetchAppointmentInfo(room.appointmentId);
      setCurrentPaymentData({
        ...room,
        appointmentDate: appointment?.date || null,
        appointmentTime: appointment?.time || null,
      });
      setPaymentModalVisible(true);
      return;
    }
    router.push({
      pathname: "/User/ChatRoom",
      params: { roomId: room.id, userId: room.userId, consultantId: room.consultantId },
    });
  };

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    let unsub;
    const loadRooms = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;
      const q = query(collection(db, "chatRooms"), where("userId", "==", userId), orderBy("lastMessageAt", "desc"));
      unsub = onSnapshot(q, async (snap) => {
        const enriched = await Promise.all(snap.docs.map(async (d) => {
          const room = { id: d.id, ...d.data() };
          const consultant = await fetchConsultantInfo(room.consultantId);
          return { ...room, consultantName: consultant.name };
        }));
        setRooms(enriched);
      });
    };
    loadRooms();
    return () => unsub && unsub();
  }, []);

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      {/* HEADER WITH BACK BUTTON */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => router.push("/User/Consultants")}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSub}>Active consultations</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatCard}
            onPress={() => openChatWithPaymentCheck(item)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.consultantName?.[0]}</Text>
            </View>

            <View style={styles.chatInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.consultantName}</Text>
                <Text style={styles.timeText}>
                  {item.lastMessageAt ? new Date(item.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active conversations yet</Text>
          </View>
        }
      />

      {currentPaymentData && (
        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          {...currentPaymentData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    backgroundColor: THEME.primary,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: { paddingHorizontal: 15, paddingTop: 10 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextGroup: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: -2 },

  listContainer: { padding: 16, paddingBottom: 100 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: THEME.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { color: THEME.avatarText, fontWeight: "bold", fontSize: 20 },
  chatInfo: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: "700", color: THEME.textDark },
  timeText: { fontSize: 11, color: THEME.textGray },
  lastMessage: { fontSize: 13, color: THEME.textGray, marginTop: 3 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#94A3B8', fontSize: 14 }
});