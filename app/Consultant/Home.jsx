import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ConsultantHome() {
  const router = useRouter();
  const [consultant, setConsultant] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load consultant info from AsyncStorage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) =>
          k.startsWith("aestheticai:user-profile:")
        );
        if (profileKey) {
          const data = await AsyncStorage.getItem(profileKey);
          setConsultant(JSON.parse(data));
        }
      } catch (err) {
        console.error("Error loading consultant profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Fetch consultant bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!consultant?.uid) return;
      try {
        const q = query(
          collection(db, "bookings"),
          where("consultantId", "==", consultant.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetched = [];
        querySnapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
        setBookings(fetched);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        Alert.alert("Error", "Failed to fetch your bookings.");
      } finally {
        setLoading(false);
      }
    };
    if (consultant) fetchBookings();
  }, [consultant]);

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  if (!consultant) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F3E48" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, {consultant.fullName} 👋</Text>
      <Text style={styles.subtext}>
        {consultant.consultantType} - {consultant.specialization}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Your Bookings</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0F3E48" />
        ) : bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings yet.</Text>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.bookingCard}>
                <Text style={styles.bookingTitle}>{item.projectName}</Text>
                <Text style={styles.bookingDetails}>
                  Client: {item.clientName || "N/A"}
                </Text>
                <Text style={styles.bookingDetails}>
                  Status: {item.status || "Pending"}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F3E48",
    marginTop: 10,
  },
  subtext: { fontSize: 16, color: "#555", marginBottom: 20 },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0F3E48",
  },
  bookingCard: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  bookingTitle: { fontWeight: "bold", color: "#0F3E48", fontSize: 16 },
  bookingDetails: { color: "#333", fontSize: 14, marginTop: 3 },
  emptyText: { color: "#777", fontStyle: "italic", marginTop: 10 },
  logoutButton: {
    backgroundColor: "#0F3E48",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
