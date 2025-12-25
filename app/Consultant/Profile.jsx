import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import Button from "../components/Button";

export default function ConsultantProfile() {
  const router = useRouter();

  // TEMP (replace later with real data if needed)
  const userName = "Noelyn Pedragoza";
  const avatarSource = require("../../assets/office-woman.png");

  const handlePress = (section) => {
    console.log(`Pressed: ${section}`);
  };

  /* ================= LOGOUT (FINAL FIX) ================= */
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              const uid = await AsyncStorage.getItem(
                "aestheticai:current-user-id"
              );

              // ✅ mark consultant offline
              if (uid) {
                await updateDoc(doc(db, "consultants", uid), {
                  isOnline: false,
                  lastSeen: serverTimestamp(),
                });
              }

              // ✅ clear ALL local storage
              await AsyncStorage.multiRemove([
                "aestheticai:current-user-id",
                "aestheticai:current-user-role",
              ]);

              // ✅ reset navigation
              router.replace("/Login");
            } catch (err) {
              console.log("❌ Logout error:", err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.profileRow}>
          <Image source={avatarSource} style={styles.avatarImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.header}>{userName}</Text>
            <Text style={styles.subHeader}>Consultant Account</Text>
          </View>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("Edit Consultant Profile")}
        >
          <Ionicons
            name="person-circle-outline"
            size={30}
            color="#1E90FF"
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Edit Consultant Profile</Text>
            <Text style={styles.cardSubtitle}>
              Update your professional details
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("Manage Appointments")}
        >
          <Ionicons name="calendar-outline" size={30} color="#0277BD" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Manage Appointments</Text>
            <Text style={styles.cardSubtitle}>
              View and update your schedule
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("View Earnings")}
        >
          <Ionicons name="cash-outline" size={30} color="#2ECC71" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>View Earnings</Text>
            <Text style={styles.cardSubtitle}>
              Check your balance and withdrawals
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("Change Password")}
        >
          <Ionicons name="lock-closed-outline" size={30} color="#C44569" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={styles.cardSubtitle}>
              Secure your consultant account
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <Button
          icon={<Ionicons name="log-out-outline" size={28} color="#fff" />}
          title="Logout"
          subtitle="Sign out of your consultant account"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#fff"
          backgroundColor="#C44569"
        />
      </ScrollView>

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F9FAFB" },

  headerWrap: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: "#01579B",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#faf9f6",
  },
  profileInfo: { flexDirection: "column" },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#faf9f6",
  },
  subHeader: {
    fontSize: 14,
    color: "#faf9f6",
    marginTop: 2,
    fontStyle: "italic",
  },
  divider: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginTop: 18,
    backgroundColor: "#faf9f6",
  },

  container: { padding: 20 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#2C3E50" },
  cardSubtitle: { fontSize: 13, color: "#7F8C8D", marginTop: 2 },
});
