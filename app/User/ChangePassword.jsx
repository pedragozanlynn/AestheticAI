import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import Button from "../components/Button";
import Input from "../components/Input";

export default function ChangePassword() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= CHANGE PASSWORD ================= */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validation", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      Alert.alert("Success", "Password changed successfully");
      router.back();
    } catch (e) {
      console.log("Change password error:", e);

      if (e.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else if (e.code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many attempts. Try again later.");
      } else {
        Alert.alert("Error", "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileHeaderLeft}>
          <View style={styles.profileHeaderAvatar}>
            <Ionicons
              name="arrow-back"
              size={20}
              color="#0F3E48"
              onPress={router.back}
            />
          </View>

          <View>
            <Text style={styles.profileHeaderTitle}>Change Password</Text>
            <Text style={styles.profileHeaderSubtitle}>
              Update your account security
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.profileHeaderDivider} />

      {/* ===== FORM ===== */}
      <View style={styles.card}>
        <Input
          label="Current Password"
          placeholder="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          icon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
        />

        <Input
          label="New Password"
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          icon={<Ionicons name="key-outline" size={18} color="#9CA3AF" />}
        />

        <Input
          label="Confirm New Password"
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          icon={<Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" />}
        />
      </View>

      {/* ===== SAVE BUTTON ===== */}
      <Button
        title={loading ? "Updating..." : "Update Password"}
        onPress={handleChangePassword}
        disabled={loading}
        backgroundColor="#3FA796"
        textColor="#fff"
        icon={
          loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="save-outline" size={20} color="#fff" />
          )
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    padding: 16,
  },

  /* ===== HEADER ===== */
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

  /* ===== FORM CARD ===== */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },
});
