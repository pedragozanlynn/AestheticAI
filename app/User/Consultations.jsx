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
  StatusBar,
} from "react-native";
import { db } from "../../config/firebase";

// --- LOGIC (REMAINED UNCHANGED) ---
const parseLegacyDateTime = (dateStr, timeStr) => {
  try {
    if (!dateStr || !timeStr) return null;
    const [time, modifier] = timeStr.replace(/\u202F/g, " ").split(" ");
    let [h, m] = time.split(":").map(Number);
    if (modifier === "PM" && h < 12) h += 12;
    if (modifier === "AM" && h === 12) h = 0;
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d, h, m || 0);
  } catch { return null; }
};

const getStatus = (item) => {
  if (item.status === "cancelled") return "cancelled";
  let start = item.appointmentAt?.toDate?.() || parseLegacyDateTime(item.date, item.time);
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

  useEffect(() => {
    let unsub;
    const load = async () => {
      const userId = await AsyncStorage.getItem("userUid");
      if (!userId) return;
      const q = query(collection(db, "appointments"), where("userId", "==", userId));
      unsub = onSnapshot(q, async (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          const sortTime = data.appointmentAt?.toDate?.() || parseLegacyDateTime(data.date, data.time);
          return { id: d.id, ...data, computedStatus: getStatus(data), _sortTime: sortTime };
        }).sort((a, b) => (b._sortTime - a._sortTime));
        setConsultations(items);
        const map = {};
        await Promise.all(items.map(async (i) => {
          if (i.consultantId && !map[i.consultantId]) {
            const s = await getDoc(doc(db, "consultants", i.consultantId));
            if (s.exists()) map[i.consultantId] = s.data().fullName;
          }
        }));
        setConsultantMap(map);
      });
    };
    load();
    return () => unsub && unsub();
  }, []);

  const handleCancel = async (id) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: async () => {
          await updateDoc(doc(db, "appointments", id), {
            status: "cancelled", cancelledAt: serverTimestamp(), cancelledBy: "user",
          });
      }},
    ]);
  };

  const filtered = consultations.filter((c) => c.computedStatus === activeTab);

  const renderItem = ({ item }) => {
    const status = item.computedStatus;
    const statusColors = {
      ongoing: { bg: "#E8F5E9", text: "#2E7D32", icon: "radio-button-on" },
      upcoming: { bg: "#FFF3E0", text: "#EF6C00", icon: "time-outline" },
      cancelled: { bg: "#FFEBEE", text: "#C62828", icon: "close-circle-outline" },
      past: { bg: "#F5F5F5", text: "#616161", icon: "checkmark-done-circle-outline" },
    };

    const currentStyle = statusColors[status] || statusColors.past;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.consultantInfo}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={16} color="#01579B" />
            </View>
            <Text style={styles.consultantName}>
              {consultantMap[item.consultantId] || "Consultant"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: currentStyle.bg }]}>
            <Ionicons name={currentStyle.icon} size={12} color={currentStyle.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: currentStyle.text }]}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>
              {item.appointmentAt?.toDate ? item.appointmentAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : item.date}
            </Text>
          </View>
          <View style={[styles.detailRow, { marginTop: 4 }]}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>
              {item.appointmentAt?.toDate ? item.appointmentAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.time}
            </Text>
          </View>
        </View>

        {status === "upcoming" && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Consultations</Text>
          <Text style={styles.headerSubtitle}>{filtered.length} active sessions</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/User/Consultants")}>
            <Ionicons name="people" size={22} color="#01579B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/User/ChatList")}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#01579B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS SECTION */}
      <View style={styles.tabWrapper}>
        {["upcoming", "ongoing", "past", "cancelled"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tabItem, activeTab === t && styles.activeTabItem]}
          >
            <Text style={[styles.tabLabel, activeTab === t && styles.activeTabLabel]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>No consultations found in {activeTab}.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 20 },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#0F3E48" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: -2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Tab Styles
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabItem: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: 'uppercase' },
  activeTabLabel: { color: "#01579B" },

  // Card Styles
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consultantInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E1F5FE",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  consultantName: { fontSize: 16, fontWeight: "800", color: "#0F3E48" },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "800" },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  cardBody: { paddingLeft: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: "#475569", fontWeight: "500" },
  
  cancelBtn: {
    marginTop: 15,
    backgroundColor: "#FFF1F0",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#FFA39E"
  },
  cancelBtnText: { color: "#CF1322", fontWeight: "700", fontSize: 13 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: "#94A3B8", marginTop: 10, fontWeight: "500" },
});