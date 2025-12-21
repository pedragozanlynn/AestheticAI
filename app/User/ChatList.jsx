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
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../config/firebase";
import PaymentModal from "../components/PaymentModal";

export default function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const router = useRouter();

  // --- Helper Functions ---
  const fetchConsultantInfo = async (consultantId) => {
    try {
      const ref = doc(db, "consultants", consultantId);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data().fullName || "Consultant" : "Consultant";
    } catch (e) {
      console.error("Error fetching consultant:", e);
      return "Consultant";
    }
  };

  const parseTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    try {
      const [timePart, modifier] = timeStr.replace(/\u202F/g, " ").trim().split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      minutes = minutes || 0;

      if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;

      const [year, month, day] = dateStr.split("-").map(Number);

      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return null;
    }
  };

  const isAppointmentActive = (date, startTime) => {
    const start = parseTime(date, startTime);
    if (!start) return false;
    return new Date() >= start;
  };

  const checkPayment = async (room) => {
    try {
      const paymentQuery = query(
        collection(db, "payments"),
        where("userId", "==", room.userId),
        where("consultantId", "==", room.consultantId),
        where("appointmentId", "==", room.appointmentId),
        where("status", "==", "completed")
      );
      const snapshot = await getDocs(paymentQuery);
      return !snapshot.empty;
    } catch (err) {
      console.error("Error checking payment:", err);
      return false;
    }
  };

  const openChatWithPaymentCheck = async (room) => {
    const hasPaid = await checkPayment(room);

    if (!hasPaid) {
      setCurrentPaymentData({
        userId: room.userId,
        consultantId: room.consultantId,
        consultantName: room.consultantName,
        appointmentId: room.appointmentId,
        appointmentDate: room.date,
        appointmentTime: room.time,
        amount: 249,
      });
      setPaymentModalVisible(true);
      return;
    }

    if (!room.date || !room.time) {
      alert(
        "You have paid, but the consultation is not scheduled yet.\nPlease wait for your consultant to set a schedule."
      );
      return;
    }

    if (!isAppointmentActive(room.date, room.time)) {
      alert(
        "Your consultation session is not active yet.\nPlease wait for the scheduled time."
      );
      return;
    }

    router.push({
      pathname: "/User/ChatRoom",
      params: {
        roomId: room.id,
        consultantId: room.consultantId,
        appointmentId: room.appointmentId,
        appointmentDate: room.date,
        sessionTimeRange: room.time,
        notes: room.notes || "",
      },
    });
  };

  // --- Load Chat Rooms + Latest Appointment ---
  useEffect(() => {
    const loadChatRooms = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;

      const chatQuery = query(
        collection(db, "chatRooms"),
        where("userId", "==", userId),
        orderBy("lastMessageAt", "desc")
      );

      const unsubChat = onSnapshot(chatQuery, async (snapshot) => {
        const rawRooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const roomsWithData = await Promise.all(
          rawRooms.map(async (room) => {
            const consultantName = await fetchConsultantInfo(room.consultantId);

            let appointmentData = { date: null, time: null, status: "pending", notes: "", appointmentId: null };
            const apptQuery = query(
              collection(db, "appointments"),
              where("userId", "==", room.userId),
              where("consultantId", "==", room.consultantId),
              orderBy("createdAt", "desc")
            );
            const apptSnap = await getDocs(apptQuery);
            if (!apptSnap.empty) {
              const latest = apptSnap.docs[0].data();
              appointmentData = {
                date: latest.date,
                time: latest.time,
                status: latest.status,
                notes: latest.notes,
                appointmentId: apptSnap.docs[0].id,
                createdAt: latest.createdAt,
              };
            }

            return { ...room, consultantName, ...appointmentData };
          })
        );

        setRooms(roomsWithData);
      });

      return () => unsubChat();
    };

    loadChatRooms();
  }, []);

  const filteredRooms = rooms.reduce((acc, room) => {
    const key = room.consultantId;
    const roomCreatedAt = room.createdAt?.toMillis?.() || 0;
    const existingCreatedAt = acc[key]?.createdAt?.toMillis?.() || 0;
    if (!acc[key] || roomCreatedAt > existingCreatedAt) acc[key] = room;
    return acc;
  }, {});

  const roomList = Object.values(filteredRooms);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity onPress={() => router.push("/User/Consultants")} style={styles.iconButton}>
          <Ionicons name="people" size={28} color="#0F3E48" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={roomList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const active = item.status === "accepted" && isAppointmentActive(item.date, item.time);

          return (
            <TouchableOpacity
              style={[styles.roomItem, item.unreadForUser && styles.unreadRoom]}
              onPress={() => openChatWithPaymentCheck(item)}
            >
              <Text style={styles.consultantName}>{item.consultantName}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage || "No messages yet"}</Text>
              {active && item.unreadForUser && <Text style={styles.newMessage}>● New message</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyListText}>No chat rooms found.</Text>}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#0F3E48" },
  iconButton: { padding: 6, borderRadius: 50, backgroundColor: "#FFF", elevation: 3 },
  roomItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#ddd", backgroundColor: "#FFF", paddingHorizontal: 10, borderRadius: 6, marginBottom: 6 },
  unreadRoom: { backgroundColor: "#FFF4F4" },
  consultantName: { fontSize: 16, fontWeight: "bold", color: "#0F3E48" },
  lastMessage: { fontSize: 14, color: "gray", marginTop: 4 },
  newMessage: { color: "red", fontWeight: "bold", marginTop: 4 },
  emptyListText: { textAlign: "center", marginTop: 20, color: "gray" },
});
