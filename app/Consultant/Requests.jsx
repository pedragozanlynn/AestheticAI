// screens/Consultant/Requests.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import { ensureChatRoom } from "../../services/chatService";
import BottomNavbar from "../components/BottomNav";

export default function Requests() {
  const router = useRouter();
  const [consultant, setConsultant] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  /** -------------------------------------------
   * 🔥 LOAD CONSULTANT PROFILE FROM ASYNC STORAGE
   * ------------------------------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) =>
          k.startsWith("aestheticai:user-profile:")
        );

        if (!profileKey) return;

        const stored = await AsyncStorage.getItem(profileKey);
        const parsed = JSON.parse(stored);

        console.log("👤 Logged Consultant UID:", parsed.uid);

        setConsultant(parsed);
      } catch (err) {
        console.log("❌ Error loading consultant profile:", err);
      }
    };

    loadProfile();
  }, []);

  /** -------------------------------------------
   * 🔥 FETCH REQUESTS FOR THIS CONSULTANT
   * ------------------------------------------- */
  useEffect(() => {
    if (!consultant?.uid) return;

    const fetchRequests = async () => {
      try {
        const q = query(
          collection(db, "appointments"),
          where("consultantId", "==", consultant.uid)
        );

        const snap = await getDocs(q);
        const results = [];

        for (const docItem of snap.docs) {
          const appointment = { id: docItem.id, ...docItem.data() };

          // Fetch user data
          const userRef = doc(db, "users", appointment.userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const u = userSnap.data();
            appointment.userName =
              u.fullName ||
              u.name ||
              `${u.firstName || ""} ${u.lastName || ""}`.trim();
            appointment.userEmail = u.email || "Unknown";
          } else {
            appointment.userName = "Unknown User";
            appointment.userEmail = "N/A";
          }

          results.push(appointment);
        }

        setRequests(results);
      } catch (err) {
        console.log("❌ Fetch request error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [consultant]);

  /** -------------------------------------------
   * 🔥 ACCEPT REQUEST + ENSURE CHAT ROOM EXISTS
   * ------------------------------------------- */
  const acceptRequest = async (item) => {
    try {
      // Mark appointment accepted
      await updateDoc(doc(db, "appointments", item.id), {
        status: "accepted",
      });

      // Create or reuse chat room using the FIXED chatService
      const roomId = await ensureChatRoom(
        `${item.userId}_${consultant.uid}`, // consistent room ID
        item.userId,
        consultant.uid,
        item.id
      );

      // Save chatRoomId inside appointment
      await updateDoc(doc(db, "appointments", item.id), {
        chatRoomId: roomId,
      });

      // Update UI
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, status: "accepted", chatRoomId: roomId }
            : r
        )
      );

      Alert.alert("Success", "Appointment accepted!");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  /** -------------------------------------------
   * 🔥 DECLINE REQUEST
   * ------------------------------------------- */
  const declineRequest = async (item) => {
    try {
      await updateDoc(doc(db, "appointments", item.id), {
        status: "declined",
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, status: "declined" } : r
        )
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  /** -------------------------------------------
   * 🔥 OPEN CHAT (SAFE — chatRoom already ensured)
   * ------------------------------------------- */
  const openChat = async (item) => {
    try {
      if (!item.chatRoomId) {
        Alert.alert("Error", "Chat room not found.");
        return;
      }

      router.push({
        pathname: "/Consultant/ChatRoom",
        params: {
          roomId: item.chatRoomId,
          userId: item.userId,
          appointmentId: item.id,
        },
      });
    } catch (err) {
      Alert.alert("Error opening chat", err.message);
    }
  };

  /** -------------------------------------------
   * 🔥 EACH REQUEST CARD UI
   * ------------------------------------------- */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.clientName}>👤 {item.userName}</Text>
      <Text style={styles.detail}>📧 {item.userEmail}</Text>
      <Text style={styles.detail}>📅 {item.date}</Text>
      <Text style={styles.detail}>⏰ {item.time}</Text>
      <Text style={styles.detail}>📝 {item.notes}</Text>

      <Text style={styles.status(item.status)}>{item.status}</Text>

      {/* PENDING */}
      {item.status === "pending" && (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => acceptRequest(item)}
          >
            <Text style={styles.btnTextLight}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => declineRequest(item)}
          >
            <Text style={styles.btnTextDark}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACCEPTED → OPEN CHAT */}
      {item.status === "accepted" && item.chatRoomId && (
        <TouchableOpacity
          style={[styles.btn, styles.acceptBtn, { marginTop: 10 }]}
          onPress={() => openChat(item)}
        >
          <Text style={styles.btnTextLight}>Open Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Consultation Requests</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0F3E48" />
      ) : requests.length === 0 ? (
        <Text style={styles.empty}>No requests found.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      <BottomNavbar role="consultant" />
    </View>
  );
}

/* ------------------------------------------
 *              STYLES
 * ------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F3E48",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  clientName: { fontSize: 18, fontWeight: "700", color: "#0F3E48" },
  detail: { fontSize: 15, marginTop: 4, color: "#333" },

  status: (s) => ({
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    color:
      s === "pending"
        ? "#D99700"
        : s === "accepted"
        ? "#0F3E48"
        : "#B00020",
  }),

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: "#0F3E48" },
  cancelBtn: { borderWidth: 1, borderColor: "#B00020" },
  btnTextLight: { color: "#fff", fontWeight: "700" },
  btnTextDark: { color: "#B00020", fontWeight: "700" },

  empty: { textAlign: "center", marginTop: 20, color: "#777" },
});
