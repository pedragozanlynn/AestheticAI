import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BottomNavbar from "../components/BottomNav";

export default function Homepage() {
  const router = useRouter();
  const [consultant, setConsultant] = useState(null);

  // Load consultant info from storage
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
        {consultant.consultantType} – {consultant.specialization}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎉 Dashboard Overview</Text>
        <Text style={styles.placeholderText}>
          This is your consultant homepage.  
          We removed bookings fetching as requested.  
          You can add widgets or dashboard items here later.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Consultant Navbar */}
      <BottomNavbar role="consultant" />
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
  subtext: { fontSize: 16, color: "#555", marginBottom: 25 },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0F3E48",
  },
  placeholderText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: "#0F3E48",
    padding: 15,
    borderRadius: 10,
    marginTop: 40,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
