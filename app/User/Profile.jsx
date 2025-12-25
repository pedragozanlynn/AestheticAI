import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRouter } from "expo-router";

import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";
import Button from "../components/Button";

export default function Profile() {
  const router = useRouter();
  const subType = useSubscriptionType();

  const [userName, setUserName] = useState("Guest");
  const [gender, setGender] = useState("male");
  const [logoutVisible, setLogoutVisible] = useState(false);

  /* ================= LOAD USER FROM USERS COLLECTION ================= */
  useEffect(() => {
    const loadUserFromDB = async () => {
      try {
        const uid = await AsyncStorage.getItem(
          "aestheticai:current-user-id"
        );
        if (!uid) return;

        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) return;

        const data = snap.data();

        // ✅ FIX HERE (name field)
        setUserName(data?.name || "Guest");
        setGender(data?.gender?.toLowerCase() || "male");
      } catch (err) {
        console.log("Error loading user from DB:", err);
      }
    };

    loadUserFromDB();
  }, []);

  const avatarSource =
    gender === "female"
      ? require("../../assets/office-woman.png")
      : require("../../assets/office-man.png");

  /* ================= LOGOUT ================= */
  const handleLogoutConfirmed = async () => {
    try {
      const uid = await AsyncStorage.getItem(
        "aestheticai:current-user-id"
      );

      if (uid) {
        await updateDoc(doc(db, "users", uid), {
          isOnline: false,
          lastSeen: serverTimestamp(),
        });
      }

      await AsyncStorage.removeItem("aestheticai:current-user-id");
      await AsyncStorage.clear();

      setLogoutVisible(false);
      router.replace("/Login");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  return (
    <View style={styles.page}>
      {/* ================= HEADER ================= */}
      <View style={styles.headerWrap}>
        <View style={styles.profileRow}>
          <Image source={avatarSource} style={styles.avatarImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.header}>{userName}</Text>
            <Text style={styles.subscription}>
              {subType ? `Subscribed: ${subType}` : "Free Plan"}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.card}>
          <Ionicons name="create-outline" size={30} color="#1E90FF" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            <Text style={styles.cardSubtitle}>
              Update your personal information
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="lock-closed-outline" size={30} color="#C44569" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={styles.cardSubtitle}>Secure your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="card-outline" size={30} color="#2C3E50" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Manage Subscription</Text>
            <Text style={styles.cardSubtitle}>
              Current plan: {subType || "Free"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <Button
          icon={<Ionicons name="log-out-outline" size={28} color="#fff" />}
          title="Logout"
          subtitle="Sign out of your account"
          onPress={() => setLogoutVisible(true)}
          textColor="#fff"
          backgroundColor="#C44569"
        />
      </ScrollView>

      <BottomNavbar subType={subType} />

      {/* ================= LOGOUT MODAL ================= */}
      <Modal visible={logoutVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleLogoutConfirmed}
              >
                <Text style={styles.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

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
  header: { fontSize: 22, fontWeight: "800", color: "#faf9f6" },
  subscription: {
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
  cardSubtitle: {
    fontSize: 13,
    color: "#7F8C8D",
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#555", marginBottom: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  cancelText: { color: "#555", fontWeight: "600" },
  confirmBtn: {
    backgroundColor: "#C44569",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  confirmText: { color: "#fff", fontWeight: "700" },
});
