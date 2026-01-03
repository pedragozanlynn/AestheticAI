import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
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

/* ================= SAFE TIME PARSER (AM / PM OK) ================= */

const parseLegacyDateTime = (dateStr, timeStr) => {
  try {
    if (!dateStr || !timeStr) return null;

    const [time, modifier] = timeStr.replace(/\u202F/g, " ").split(" ");
    let [h, m] = time.split(":").map(Number);

    if (modifier === "PM" && h < 12) h += 12;
    if (modifier === "AM" && h === 12) h = 0;

    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d, h, m || 0);
  } catch {
    return null;
  }
};

/* ================= STATUS LOGIC (BULLETPROOF) ================= */

const getStatus = (item) => {
  if (item.status === "cancelled") return "cancelled";

  let start =
    item.appointmentAt?.toDate?.() ||
    parseLegacyDateTime(item.date, item.time);

  if (!start) return "upcoming";

  const now = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "past";
};

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [consultantMap, setConsultantMap] = useState({});
  const [activeTab, setActiveTab] = useState("upcoming");
  const router = useRouter();

  /* ================= LOAD CONSULTATIONS (FIXED) ================= */

  useEffect(() => {
    let unsub;

    const load = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;

      // ❌ NO orderBy("date") – STRING DATE BUG FIXED
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", userId)
      );

      unsub = onSnapshot(q, async (snap) => {
        const items = snap.docs
          .map((d) => {
            const data = d.data();
            const sortTime =
              data.appointmentAt?.toDate?.() ||
              parseLegacyDateTime(data.date, data.time);

            return {
              id: d.id,
              ...data,
              computedStatus: getStatus(data),
              _sortTime: sortTime,
            };
          })
          // ✅ REAL DATE SORT (CLIENT SIDE)
          .sort((a, b) => {
            if (!a._sortTime || !b._sortTime) return 0;
            return b._sortTime - a._sortTime;
          });

        setConsultations(items);

        // Load consultant names
        const map = {};
        await Promise.all(
          items.map(async (i) => {
            if (i.consultantId && !map[i.consultantId]) {
              const s = await getDoc(
                doc(db, "consultants", i.consultantId)
              );
              if (s.exists()) map[i.consultantId] = s.data().fullName;
            }
          })
        );
        setConsultantMap(map);
      });
    };

    load();
    return () => unsub && unsub();
  }, []);

  /* ================= ACTIONS ================= */

  const handleCancel = async (id) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await updateDoc(doc(db, "appointments", id), {
            status: "cancelled",
            cancelledAt: serverTimestamp(),
            cancelledBy: "user",
          });
        },
      },
    ]);
  };

  /* ================= FILTER ================= */

  const filtered = consultations.filter(
    (c) => c.computedStatus === activeTab
  );

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }) => {
    const status = item.computedStatus;

    const statusColor =
      status === "ongoing"
        ? "#4CAF50"
        : status === "upcoming"
        ? "#FF9800"
        : status === "cancelled"
        ? "#F44336"
        : "#9E9E9E";

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.identityRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#0F3E48" />
            </View>
            <Text style={styles.consultantName}>
              {consultantMap[item.consultantId] || "Consultant"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.details}>
          {item.appointmentAt?.toDate
            ? item.appointmentAt.toDate().toLocaleString()
            : `${item.date} @ ${item.time}`}
        </Text>

        {status === "upcoming" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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

        <View style={styles.iconGroup}>
  <TouchableOpacity
    style={styles.iconBtn}
    onPress={() => router.push("/User/Consultants")}
  >
    <Ionicons name="people" size={24} color="#0F3E48" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.iconBtn}
    onPress={() => router.push("/User/ChatList")}
  >
    <Ionicons name="chatbubble-ellipses" size={24} color="#0F3E48" />
  </TouchableOpacity>
</View>

      </View>

      <View style={styles.headerDivider} />

      {/* ===== TABS ===== */}
      <View style={styles.tabContainer}>
        {["upcoming", "ongoing", "past", "cancelled"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tabButton,
              activeTab === t && styles.activeTabButton,
            ]}
          >
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

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
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

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2, // adjust mo kung mas dikit o mas malayo
  },
  iconBtn:{
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  
  },
 
  headerDivider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 12,
  },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  tabButton: { paddingVertical: 6 },
  tabText: { fontWeight: "700", color: "#999" },
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
  consultantName: { fontWeight: "700", color: "#0F3E48" },
  statusBadge: { paddingHorizontal: 8, borderRadius: 10 },
  statusText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  details: { marginTop: 6, color: "#555" },

  cancelButton: {
    backgroundColor: "#F44336",
    padding: 6,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  cancelText: { color: "#FFF", fontWeight: "700" },

  emptyText: { textAlign: "center", marginTop: 30, color: "#999" },
});
