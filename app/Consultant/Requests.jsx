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
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

/* ================= STATUS TABS ================= */
const TABS = ["pending", "accepted", "declined", "cancelled"];

/* ================= STATUS NORMALIZER ================= */
const normalizeStatus = (s) => {
  if (!s) return "pending";
  const v = s.toLowerCase();
  if (v === "cancel" || v === "canceled") return "cancelled";
  if (v === "decline") return "declined";
  if (v === "complete" || v === "completed") return "completed";
  return v;
};

export default function Requests() {
  const router = useRouter();
  const auth = getAuth();

  const [authUid, setAuthUid] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAuthUid(user.uid);
    });
    return unsub;
  }, []);

  /* ================= FETCH APPOINTMENTS ================= */
  const fetchRequests = async () => {
    if (!authUid) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "appointments"),
        where("consultantId", "==", authUid)
      );

      const snap = await getDocs(q);
      const results = [];

      for (const d of snap.docs) {
        const data = d.data();

        const item = {
          id: d.id,
          ...data,
          status: normalizeStatus(data.status),
        };

        const uSnap = await getDoc(doc(db, "users", item.userId));
        if (uSnap.exists()) {
          const u = uSnap.data();
          item.userName = u.name || u.fullName || "Unknown User";
          item.userEmail = u.email;
        } else {
          item.userName = "Unknown User";
          item.userEmail = "N/A";
        }

        results.push(item);
      }

      setRequests(results);
    } catch (err) {
      console.log("❌ Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUid) fetchRequests();
  }, [authUid]);

  /* ================= ACTIONS ================= */
  const acceptRequest = async (item) => {
    const roomId = `appointment_${item.id}`;

    await updateDoc(doc(db, "appointments", item.id), {
      status: "accepted",
      chatRoomId: roomId,
    });

    await ensureChatRoom(item.id, item.userId, authUid);
    fetchRequests();
  };

  const declineRequest = async (item) => {
    await updateDoc(doc(db, "appointments", item.id), {
      status: "declined",
    });
    fetchRequests();
  };

  /* ✅ SAFETY GUARD */
  const openChat = (item) => {
    if (item.status === "completed") {
      Alert.alert(
        "Consultation Completed",
        "This chat is already completed and can no longer be opened."
      );
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
  };

  /* ================= FILTER ================= */
  const filtered = requests.filter((r) =>
    activeTab === "accepted"
      ? r.status === "accepted" || r.status === "completed"
      : r.status === activeTab
  );

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.clientName}>{item.userName}</Text>
        <Text style={styles.status(item.status)}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.detail}>{item.userEmail}</Text>

        <View style={styles.dateRow}>
          <Text style={styles.detail}>
            {item.appointmentAt?.toDate?.().toLocaleDateString()}
          </Text>

          {/* ✅ ONLY ACCEPTED */}
          {item.status === "accepted" && (
            <TouchableOpacity
              style={[styles.btn, styles.chatBtn]}
              onPress={() => openChat(item)}
            >
              <Text style={styles.btnTextLight}>Open Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.detail}>
          {item.appointmentAt?.toDate?.().toLocaleTimeString()}
        </Text>
      </View>

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
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Consultation Requests</Text>
        <Text style={styles.subHeader}>
          Manage and review your appointments
        </Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)}>
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.activeTabText,
              ]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No {activeTab} appointments.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
        />
      )}

      <BottomNavbar role="consultant" />
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },
  headerWrap: {
    alignItems: "center",
    backgroundColor: "#01579B",
    paddingTop: 50,
    paddingBottom: 16,
  },
  header: { fontSize: 22, fontWeight: "900", color: "#fff" },
  subHeader: { fontSize: 14, color: "#E0F7FA" },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
  },

  tabText: { fontWeight: "700", fontSize: 12, color: "#999" },
  activeTabText: { color: "#01579B" },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#912f56",
  },

  topRow: { flexDirection: "row", justifyContent: "space-between" },
  clientName: { fontSize: 16, fontWeight: "700", color: "#01579B" },

  infoBlock: { marginTop: 4 },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detail: { fontSize: 13, color: "#455A64" },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },

  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  acceptBtn: { backgroundColor: "#2c4f4f" },
  chatBtn: { backgroundColor: "#3fa796" },
  cancelBtn: { borderWidth: 1, borderColor: "#912f56" },

  btnTextLight: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnTextDark: { color: "#912f56", fontWeight: "700", fontSize: 12 },

  status: (s) => ({
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor:
      s === "completed"
        ? "#E0E0E0"
        : s === "accepted"
        ? "#D1F2EB"
        : s === "pending"
        ? "#FFF3CD"
        : "#F8D7DA",
  }),

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#90A4AE",
    fontStyle: "italic",
  },
});
