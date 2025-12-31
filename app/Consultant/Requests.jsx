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
  StatusBar,
  SafeAreaView
} from "react-native";
import { db } from "../../config/firebase";
import { ensureChatRoom } from "../../services/chatService";
import BottomNavbar from "../components/BottomNav";
import { Ionicons } from "@expo/vector-icons";

const TABS = ["pending", "accepted", "declined", "cancelled"];

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAuthUid(user.uid);
    });
    return unsub;
  }, []);

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

  const openChat = (item) => {
    if (item.status === "completed") {
      Alert.alert("Consultation Completed", "This chat is already completed.");
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

  const filtered = requests.filter((r) =>
    activeTab === "accepted"
      ? r.status === "accepted" || r.status === "completed"
      : r.status === activeTab
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.clientName}>{item.userName}</Text>
            <Text style={styles.clientEmail}>{item.userEmail}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, styles.statusBg(item.status)]}>
          <Text style={styles.statusText(item.status)}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {item.appointmentAt?.toDate?.().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {item.appointmentAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {item.status === "accepted" && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => openChat(item)}>
            <Ionicons name="chatbubbles" size={16} color="#FFF" style={{marginRight: 6}} />
            <Text style={styles.chatBtnText}>Open Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(item)}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(item)}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.headerArea}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Consultations</Text>
            <Text style={styles.headerSub}>Review and manage your sessions</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* TABS SECTION */}
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity 
              key={t} 
              onPress={() => setActiveTab(t)}
              style={[styles.tabItem, activeTab === t && styles.activeTabItem]}
            >
              <Text style={[styles.tabLabel, activeTab === t && styles.activeTabLabel]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              {activeTab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#01579B" />
          <Text style={styles.loadingText}>Fetching schedules...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No {activeTab} appointments found</Text>
            </View>
          }
        />
      )}

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: { backgroundColor: "#01579B",paddingBottom: 25, paddingTop: 20,},
  headerContent: { paddingHorizontal: 25, paddingTop: 20 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  tabContainer: { backgroundColor: '#FFF', marginTop: 20, marginHorizontal: 20, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  tabRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 },
  tabItem: { paddingVertical: 15, flex: 1, alignItems: 'center', position: 'relative' },
  activeTabItem: { },
  tabLabel: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  activeTabLabel: { color: "#01579B" },
  tabIndicator: { position: 'absolute', bottom: 10, width: 20, height: 3, backgroundColor: '#01579B', borderRadius: 2 },

  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#01579B', fontWeight: 'bold', fontSize: 16 },
  clientName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  clientEmail: { fontSize: 12, color: "#64748B", marginTop: 1 },

  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  statusText: (s) => ({ fontSize: 10, fontWeight: "800", color: s === 'pending' ? '#B45309' : s === 'accepted' ? '#065F46' : s === 'declined' ? '#991B1B' : '#475569' }),
  statusBg: (s) => ({ backgroundColor: s === 'pending' ? '#FEF3C7' : s === 'accepted' ? '#D1FAE5' : s === 'declined' ? '#FEE2E2' : '#F1F5F9' }),

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTimeContainer: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: "#475569", fontWeight: '500' },

  chatBtn: { backgroundColor: "#01579B", flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 15 },
  acceptBtn: { flex: 1, backgroundColor: "#3fa796", paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  acceptBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  declineBtn: { flex: 1, backgroundColor: "#FFF", paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  declineBtnText: { color: "#912f56", fontWeight: "800", fontSize: 13 },

  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontWeight: '500' },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: "#94A3B8", marginTop: 10, fontWeight: '500' }
});