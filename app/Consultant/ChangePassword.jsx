import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
} from "firebase/auth";

import Button from "../components/Button";
import Input from "../components/Input";

export default function ConsultantChangePassword() {
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
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
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

      // ✅ AUTO LOGOUT AFTER PASSWORD CHANGE
      await signOut(auth);
      await AsyncStorage.multiRemove([
        "aestheticai:current-user-id",
        "aestheticai:current-user-role",
      ]);

      Alert.alert(
        "Password Updated ✅",
        "Please login again using your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/Login"),
          },
        ]
      );
    } catch (error) {
      console.log("Change password error:", error);

      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert(
          "Too Many Attempts",
          "Please try again later."
        );
      } else {
        Alert.alert("Error", "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={router.back}
        >
          <Ionicons name="arrow-back" size={22} color="#0F3E48" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Change Password</Text>
          <Text style={styles.headerSubtitle}>
            Secure your consultant account
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* FORM */}
      <View style={styles.card}>
        <Input
          label="Current Password"
          placeholder="Enter current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          icon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
        />

        <Input
          label="New Password"
          placeholder="Enter new password"
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
          icon={
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#9CA3AF"
            />
          }
        />
      </View>

      {/* SAVE BUTTON */}
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F3E48",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },
});
