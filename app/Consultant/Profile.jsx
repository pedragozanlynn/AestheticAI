import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import Button from "../components/Button";

export default function ConsultantProfile() {
  const router = useRouter();

  const [consultantName, setConsultantName] = useState("Consultant");
  const [logoutVisible, setLogoutVisible] = useState(false);

  const avatarSource = require("../../assets/office-woman.png");

  /* ================= LOAD CONSULTANT NAME ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const uid = await AsyncStorage.getItem(
          "aestheticai:current-user-id"
        );
        if (!uid) return;

        const snap = await getDoc(doc(db, "consultants", uid));
        if (!snap.exists()) return;

        const data = snap.data();
        setConsultantName(data.fullName || "Consultant");

        // cache for persistence
        await AsyncStorage.setItem(
          "aestheticai:consultant-profile",
          JSON.stringify(data)
        );
      } catch (err) {
        console.log("Load consultant profile error:", err);
      }
    };

    loadProfile();
  }, []);

  /* ================= CONFIRM LOGOUT ================= */
  const confirmLogout = async () => {
    try {
      const uid = await AsyncStorage.getItem(
        "aestheticai:current-user-id"
      );

      if (uid) {
        await updateDoc(doc(db, "consultants", uid), {
          isOnline: false,
          lastSeen: serverTimestamp(),
        });
      }

      await AsyncStorage.multiRemove([
        "aestheticai:current-user-id",
        "aestheticai:current-user-role",
        "aestheticai:consultant-profile",
      ]);

      setLogoutVisible(false);

      // ✅ BACK TO CONSULTANT LOGIN
      router.replace({
        pathname: "/Login",
        params: { role: "consultant" },
      });
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  return (
    <View style={styles.page}>
      {/* ===== HEADER ===== */}
      <View style={styles.headerWrap}>
        <View style={styles.profileRow}>
          <Image source={avatarSource} style={styles.avatarImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.header}>{consultantName}</Text>
            <Text style={styles.subHeader}>Consultant Account</Text>
          </View>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* EDIT PROFILE */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/Consultant/EditProfile")}
        >
          <Ionicons name="person-circle-outline" size={30} color="#1E90FF" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            <Text style={styles.cardSubtitle}>
              Update your professional details
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* AVAILABILITY */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/Consultant/EditAvailability")}
        >
          <Ionicons name="calendar-outline" size={30} color="#0277BD" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Manage Availability</Text>
            <Text style={styles.cardSubtitle}>
              View and update your schedule
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* CHANGE PASSWORD */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/Consultant/ChangePassword")}
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

        {/* LOGOUT BUTTON */}
        <Button
          icon={<Ionicons name="log-out-outline" size={28} color="#fff" />}
          title="Logout"
          subtitle="Sign out of your consultant account"
          onPress={() => setLogoutVisible(true)}
          backgroundColor="#C44569"
          textColor="#fff"
        />
      </ScrollView>

      <BottomNavbar role="consultant" />

      {/* ===== LOGOUT MODAL ===== */}
      <Modal
        transparent
        animationType="fade"
        visible={logoutVisible}
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Do you want to logout?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
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

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  cancelText: {
    fontWeight: "700",
    color: "#777",
  },
  logoutBtn: {
    backgroundColor: "#C44569",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "800",
  },
});
