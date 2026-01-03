import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../config/firebase";

export default function ManageSubscription() {
  const router = useRouter();
  const auth = getAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD USER SUBSCRIPTION ================= */
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setUserData(snap.data());
        }
      } catch (e) {
        console.log("Subscription load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3fa796" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>User data not found</Text>
      </View>
    );
  }

  const {
    subscription_type,
    subscription_expires_at,
    subscribed_at,
  } = userData;

  const isPremium = subscription_type === "Premium";

  return (
    <View style={styles.container}>
      {/* ===== HEADER (PROJECT / EDIT PROFILE STYLE) ===== */}
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileHeaderLeft}>
          <TouchableOpacity
            style={styles.profileHeaderAvatar}
            onPress={router.back}
          >
            <Ionicons name="arrow-back" size={20} color="#0F3E48" />
          </TouchableOpacity>

          <View>
            <Text style={styles.profileHeaderTitle}>My Subscription</Text>
            <Text style={styles.profileHeaderSubtitle}>
              Manage your current plan
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.profileHeaderDivider} />

      {/* ===== CARD ===== */}
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          
          <Text style={styles.planText}>
            {isPremium ? "Premium Plan" : "Free Plan"}
          </Text>
        </View>

        <InfoRow
          label="Status"
          value={isPremium ? "Active" : "Not Subscribed"}
          highlight={isPremium}
        />

        <InfoRow
          label="Subscribed On"
          value={
            subscribed_at?.toDate
              ? subscribed_at.toDate().toDateString()
              : "—"
          }
        />

        <InfoRow
          label="Expires On"
          value={
            subscription_expires_at?.toDate
              ? subscription_expires_at.toDate().toDateString()
              : "—"
          }
        />
      </View>

      {/* ===== ACTION ===== */}
      {isPremium ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            Alert.alert(
              "Premium Active",
              "Your subscription is currently active."
            )
          }
        >
          <Text style={styles.secondaryText}>Premium Active</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/User/Subscribe")}
        >
          <Text style={styles.primaryText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ================= SMALL COMPONENT ================= */

const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        highlight && { color: "#3fa796", fontWeight: "800" },
      ]}
    >
      {value}
    </Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    padding: 16,
  },

  /* ===== HEADER STYLES (MATCHED) ===== */
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },

  profileHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F3E48",
  },

  profileHeaderSubtitle: {
    fontSize: 12,
    color: "#777",
  },

  profileHeaderDivider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 16,
  },

  /* ===== CARD ===== */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  planText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F3E48",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#EEF2F3",
  },

  infoLabel: {
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
  },

  infoValue: {
    color: "#333",
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: "#3fa796",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  secondaryBtn: {
    backgroundColor: "#EAF6F3",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  secondaryText: {
    color: "#3fa796",
    fontWeight: "800",
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
