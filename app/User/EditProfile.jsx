import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import Button from "../components/Button";

const USER_ID_KEY = "aestheticai:current-user-id";

export default function EditProfile() {
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "", // "Male" | "Female"
  });

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const uid = await AsyncStorage.getItem(USER_ID_KEY);
        if (!uid) return;

        setUserId(uid);

        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            name: data.name || "",
            email: data.email || "",
            gender: data.gender || "",
          });
        }
      } catch (e) {
        console.log("Load profile error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Name is required");
      return;
    }

    if (!form.gender) {
      Alert.alert("Validation", "Please select your gender");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", userId), {
        name: form.name.trim(),
        gender: form.gender,
      });

      Alert.alert("Success", "Profile updated successfully");
      router.replace("/User/Profile");
    } catch (e) {
      console.log("Update profile error:", e);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3fa796" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== HEADER ===== */}
      <View style={styles.profileHeaderRow}>
        <View style={styles.profileHeaderLeft}>
          <TouchableOpacity
            style={styles.profileHeaderAvatar}
            onPress={router.back}
          >
            <Ionicons name="arrow-back" size={20} color="#0F3E48" />
          </TouchableOpacity>

          <View>
            <Text style={styles.profileHeaderTitle}>Edit Profile</Text>
            <Text style={styles.profileHeaderSubtitle}>
              Update your personal information
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.profileHeaderDivider} />

      {/* ===== FORM ===== */}
      <View style={styles.card}>
        <Label text="Full Name" />
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          placeholder="Enter your full name"
        />

        <Label text="Email" />
        <View style={styles.readonlyWrap}>
          <Ionicons name="mail-outline" size={16} color="#999" />
          <TextInput
            style={styles.readonlyInput}
            value={form.email}
            editable={false}
          />
        </View>

        {/* ===== GENDER SELECTOR ===== */}
        <Label text="Gender" />
        <View style={styles.genderRow}>
          {/* MALE */}
          <TouchableOpacity
            style={[
              styles.genderCard,
              form.gender === "Male" && styles.genderActive,
            ]}
            onPress={() => setForm({ ...form, gender: "Male" })}
          >
            <Ionicons
              name="male"
              size={24}
              color={form.gender === "Male" ? "#fff" : "#3FA796"}
            />
            <Text
              style={[
                styles.genderText,
                form.gender === "Male" && styles.genderTextActive,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

          {/* FEMALE */}
          <TouchableOpacity
            style={[
              styles.genderCard,
              form.gender === "Female" && styles.genderActive,
            ]}
            onPress={() => setForm({ ...form, gender: "Female" })}
          >
            <Ionicons
              name="female"
              size={24}
              color={form.gender === "Female" ? "#fff" : "#C44569"}
            />
            <Text
              style={[
                styles.genderText,
                form.gender === "Female" && styles.genderTextActive,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== SAVE BUTTON ===== */}
      <Button
        title={saving ? "Saving..." : "Save Changes"}
        onPress={handleSave}
        disabled={saving}
        backgroundColor="#3FA796"
        textColor="#fff"
        icon={<Ionicons name="save-outline" size={20} color="#fff" />}
      />
    </ScrollView>
  );
}

/* ================= SMALL ================= */
const Label = ({ text }) => <Text style={styles.label}>{text}</Text>;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F9FA" },
  scrollContent: { padding: 16, paddingBottom: 40 },

  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },
  profileHeaderLeft: { flexDirection: "row", alignItems: "center" },
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
  profileHeaderSubtitle: { fontSize: 12, color: "#777" },
  profileHeaderDivider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 22,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#E5EEF2",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.8,
  },

  input: {
    backgroundColor: "#FAFCFD",
    borderWidth: 1,
    borderColor: "#E1E7EA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },

  readonlyWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E1E7EA",
  },

  readonlyInput: {
    marginLeft: 10,
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
  },

  /* ===== GENDER ===== */
  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  genderCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EA",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FAFCFD",
  },

  genderActive: {
    backgroundColor: "#2c4f4f",
    borderColor: "#2c4f4f",
  },

  genderText: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
    color: "#374151",
  },

  genderTextActive: {
    color: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
