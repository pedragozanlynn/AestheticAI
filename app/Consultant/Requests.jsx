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

  // Load consultant profile
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
        setConsultant(parsed);
      } catch (err) {
        console.log("❌ Error loading consultant profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Fetch requests
  const fetchRequests = async () => {
    if (!consultant?.uid) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "appointments"),
        where("consultantId", "==", consultant.uid)
      );
      const snap = await getDocs(q);
      const results = [];

      for (const docItem of snap.docs) {
        const appointment = { id: docItem.id, ...docItem.data() };

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

  useEffect(() => {
    fetchRequests();
  }, [consultant]);

  // ✅ ACCEPT = create chatroom ONCE (appointment-based)
  const acceptRequest = async (item) => {
    try {
      const roomId = `appointment_${item.id}`;

      await updateDoc(doc(db, "appointments", item.id), {
        status: "accepted",
        chatRoomId: roomId,
      });

      // Ensure chatroom exists (ONE per appointment)
      await ensureChatRoom(
        item.id,          // appointmentId
        item.userId,
        consultant.uid
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, status: "accepted", chatRoomId: roomId }
            : r
        )
      );

      Alert.alert("Success", "Appointment accepted!", [
        { text: "OK", onPress: fetchRequests },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Decline request
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

  // ✅ OPEN CHAT = open existing chatroom ONLY
  const openChat = async (item) => {
    try {
      const roomId = item.chatRoomId;

      if (!roomId) {
        Alert.alert(
          "Chatroom not available",
          "Make sure the appointment is accepted first."
        );
        return;
      }

      router.push({
        pathname: "/Consultant/ChatRoom",
        params: {
          roomId,
          userId: item.userId,
          appointmentId: item.id,
        },
      });
    } catch (err) {
      Alert.alert("Error opening chat", err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.clientName}>{item.userName}</Text>
        <Text style={styles.status(item.status)}>{item.status}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailsBlock}>
          <Text style={styles.detail}>{item.userEmail}</Text>
          <Text style={styles.detail}>{item.date}</Text>
          <Text style={styles.detail}>{item.time}</Text>
          <Text style={styles.detail}>{item.notes}</Text>
        </View>

        <View style={styles.statusBlock}>
          {item.status === "pending" && (
            <View style={styles.actionRow}>
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

          {item.status === "accepted" && (
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn, { marginTop: 6 }]}
              onPress={() => openChat(item)}
            >
              <Text style={styles.btnTextLight}>Open Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Consultation Requests</Text>
        <Text style={styles.subHeader}>
          Manage and review your latest appointments
        </Text>
      </View>

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
 * STYLES (UNCHANGED)
 * ------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },
  headerWrap: {
    alignItems: "center",
    backgroundColor: "#01579B",
    paddingVertical: 16,
    elevation: 4,
    width: "100%",
    paddingTop: 60,
  },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subHeader: {
    fontSize: 14,
    color: "#E0F7FA",
    marginTop: 4,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#912f56",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#01579B",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsBlock: { flex: 1 },
  statusBlock: { alignItems: "flex-end" },
  actionRow: { flexDirection: "row", gap: 8 },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  acceptBtn: { backgroundColor: "#2c4f4f", marginTop: 40 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#912f56",
    backgroundColor: "#fff",
    marginTop: 40,
  },
  btnTextLight: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  btnTextDark: {
    color: "#912f56",
    fontWeight: "700",
    fontSize: 12,
  },
  detail: {
    fontSize: 13,
    marginTop: 2,
    color: "#455A64",
  },
  status: (s) => ({
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor:
      s === "pending"
        ? "#FFF3CD"
        : s === "accepted"
        ? "#D1F2EB"
        : "#F8D7DA",
    color:
      s === "pending"
        ? "#D99700"
        : s === "accepted"
        ? "#0F766E"
        : "#B00020",
  }),
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#90A4AE",
    fontStyle: "italic",
  },
});
