import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../config/firebase";

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");
  const router = useRouter();

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
    if (now >= start && now <= new Date(start.getTime() + 60 * 60 * 1000)) return "ongoing";
    if (now > start) return "past";
    return "upcoming";
  };

  const loadConsultations = async () => {
    const userId = await AsyncStorage.getItem("userUid");
    if (!userId) return;
    const apptQuery = query(
      collection(db, "appointments"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(apptQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = items.map((item) => ({
        ...item,
        status: getStatus(item.date, item.time),
      }));
      setConsultations(sorted);
    });
    return () => unsub();
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const handleCancel = async (appointmentId) => {
    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this appointment?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "appointments", appointmentId));
            Alert.alert("Appointment canceled");
          } catch (e) {
            console.error("Error cancelling appointment:", e);
          }
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
        sessionTimeRange: room.time,
        notes: room.notes || "",
      },
    });
  };

  const renderItem = ({ item }) => {
    const statusColor = item.status === "ongoing" ? "#4CAF50" : item.status === "upcoming" ? "#FF9800" : "#9E9E9E";
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.consultantName}>{item.consultantName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.details}>{item.date} @ {item.time}</Text>
        {item.status === "ongoing" && (
          <TouchableOpacity style={styles.chatButton} onPress={() => handleOpenChat(item)}>
            <Text style={styles.chatText}>Open Chat</Text>
          </TouchableOpacity>
        )}
        {item.status === "upcoming" && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredConsultations = consultations.filter(c => c.status === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Consultations</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.push("/User/ChatList")}
            style={[styles.iconButton, { marginRight: 10 }]}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#0F3E48" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/User/Consultants")}
            style={styles.iconButton}
          >
            <Ionicons name="people" size={28} color="#0F3E48" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {["ongoing", "upcoming", "past"].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredConsultations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No consultations found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA", padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#0F3E48" },
  iconButton: { padding: 6, borderRadius: 50, backgroundColor: "#FFF", elevation: 3 },
  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  tabButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  tabText: { fontSize: 14, fontWeight: "700", color: "#888" },
  activeTabText: { color: "#0F3E48", borderBottomWidth: 2, borderBottomColor: "#0F3E48" },
  item: { backgroundColor: "#FFF", padding: 16, borderRadius: 8, marginBottom: 12, elevation: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  consultantName: { fontSize: 16, fontWeight: "bold", color: "#0F3E48" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  details: { fontSize: 14, color: "#555", marginBottom: 6 },
  cancelButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#F44336", borderRadius: 6, alignSelf: "flex-start" },
  cancelText: { color: "#FFF", fontWeight: "bold" },
  chatButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#4CAF50", borderRadius: 6, alignSelf: "flex-start" },
  chatText: { color: "#FFF", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 20, color: "gray" },
});
