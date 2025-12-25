import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [consultantMap, setConsultantMap] = useState({});
  const [activeTab, setActiveTab] = useState("ongoing");
  const router = useRouter();

  /* ================= TIME HELPERS ================= */

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

  const getStatus = (dateStr, timeStr) => {
    const now = new Date();
    const start = parseTime(dateStr, timeStr);
    if (!start) return "upcoming";
    if (now >= start && now <= new Date(start.getTime() + 60 * 60 * 1000))
      return "ongoing";
    if (now > start) return "past";
    return "upcoming";
  };

  /* ================= LOAD CONSULTATIONS ================= */

  useEffect(() => {
    const load = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;

      const q = query(
        collection(db, "appointments"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );

      return onSnapshot(q, async (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            status: getStatus(data.date, data.time),
          };
        });

        setConsultations(items);

        // 🔥 LOAD CONSULTANT NAMES PROPERLY
        const map = {};
        await Promise.all(
          items.map(async (item) => {
            if (item.consultantId && !map[item.consultantId]) {
              const snap = await getDoc(doc(db, "consultants", item.consultantId));
              if (snap.exists()) {
                map[item.consultantId] = snap.data().fullName;
              }
            }
          })
        );
        setConsultantMap(map);
      });
    };

    load();
  }, []);

  /* ================= ACTIONS ================= */

  const handleCancel = async (id) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await deleteDoc(doc(db, "appointments", id));
        },
      },
    ]);
  };

  const handleOpenChat = (room) => {
    router.push({
      pathname: "/User/ChatRoom",
      params: {
        roomId: room.chatRoomId,
        consultantId: room.consultantId,
        appointmentId: room.id,
        appointmentDate: room.date,
        appointmentTime: room.time,
        consultantName: consultantMap[room.consultantId],
      },
    });
  };

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }) => {
    const statusColor =
      item.status === "ongoing"
        ? "#4CAF50"
        : item.status === "upcoming"
        ? "#FF9800"
        : "#9E9E9E";

    const consultantName =
      consultantMap[item.consultantId] || "Consultant";

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.identityRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#0F3E48" />
            </View>
            <Text style={styles.consultantName}>{consultantName}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.details}>
          {item.date} @ {item.time}
        </Text>

        {item.status === "ongoing" && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleOpenChat(item)}
          >
            <Text style={styles.chatText}>Open Chat</Text>
          </TouchableOpacity>
        )}

        {/* ✅ CANCEL BUTTON NASA PINAKABABA */}
        {item.status === "upcoming" && (
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const filtered = consultations.filter((c) => c.status === activeTab);

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.chatHeaderRow}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="calendar" size={20} color="#0F3E48" />
          </View>
          <View>
            <Text style={styles.chatTitle}>Consultations</Text>
            <Text style={styles.chatSubtitle}>
              {filtered.length} record(s)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/User/Consultants")}
          style={styles.iconBtn}
        >
          <Ionicons name="people" size={25} color="#0F3E48" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/* ===== TABS ===== */}
      <View style={styles.tabContainer}>
        {["upcoming", "ongoing", "past"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No consultations found.</Text>
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA", padding: 16 },

  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },
  chatHeaderLeft: { flexDirection: "row", alignItems: "center" },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  chatTitle: { fontSize: 18, fontWeight: "800", color: "#0F3E48" },
  chatSubtitle: { fontSize: 12, color: "#777" },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#FFF",
    elevation: 2,
  },
  headerDivider: { height: 1, backgroundColor: "#E4E6EB", marginBottom: 12 },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  tabButton: { paddingVertical: 6, paddingHorizontal: 14 },
  tabText: { fontSize: 13, fontWeight: "700", color: "#999" },
  activeTabButton: { borderBottomWidth: 2, borderBottomColor: "#0F3E48" },
  activeTabText: { color: "#0F3E48" },

  item: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  identityRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  consultantName: { fontSize: 16, fontWeight: "700", color: "#0F3E48" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  details: { fontSize: 14, color: "#555", marginBottom: 6 },

  cancelButton: {
    backgroundColor: "#F44336",
    padding: 6,
    borderRadius: 6,
    marginTop: -15,
    alignSelf: "flex-end",
  },
  cancelText: { color: "#FFF", fontWeight: "700" },

  chatButton: {
    backgroundColor: "#4CAF50",
    padding: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  chatText: { color: "#FFF", fontWeight: "700" },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});
