import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "../../config/firebase";
import Input from "../components/Input";
import Button from "../components/Button";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    gender: "",
    consultantType: "", // 🔒 used only for condition
    education: "",
    specialization: "",
    experience: "",
    licenseNumber: "",
  });

  /* ================= LOAD CONSULTANT DATA ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const uid = await AsyncStorage.getItem("aestheticai:current-user-id");
        if (!uid) return;

        const snap = await getDoc(doc(db, "consultants", uid));
        if (snap.exists()) {
          setFormData((prev) => ({
            ...prev,
            ...snap.data(),
          }));
        }
      } catch (err) {
        console.log("Load profile error:", err);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ================= SAVE PROFILE ================= */
  const handleSave = async () => {
    if (
      !formData.fullName ||
      !formData.address ||
      !formData.gender ||
      !formData.education ||
      !formData.specialization
    ) {
      return Alert.alert(
        "Missing Field",
        "Please complete all required fields."
      );
    }

    try {
      setLoading(true);
      const uid = await AsyncStorage.getItem("aestheticai:current-user-id");

      await updateDoc(doc(db, "consultants", uid), {
        fullName: formData.fullName,
        address: formData.address,
        gender: formData.gender,
        education: formData.education,
        specialization: formData.specialization,
        experience:
          formData.consultantType === "Professional"
            ? formData.experience || ""
            : "",
        licenseNumber:
          formData.consultantType === "Professional"
            ? formData.licenseNumber || ""
            : "",
      });

      Alert.alert("Success", "Profile updated successfully.");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      {/* HEADER (Change Password style) */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={router.back}>
          <Ionicons name="arrow-back" size={22} color="#0F3E48" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>
            Update your consultant information
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Input
            value={formData.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
            placeholder="Full Name"
          />

          <Input
            value={formData.address}
            onChangeText={(t) => handleChange("address", t)}
            placeholder="Address"
          />

          {/* GENDER */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {["Male", "Female"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderBtn,
                  formData.gender === g &&
                    (g === "Male"
                      ? styles.genderMaleActive
                      : styles.genderFemaleActive),
                ]}
                onPress={() => handleChange("gender", g)}
              >
                <Ionicons
                  name={g === "Male" ? "male" : "female"}
                  size={18}
                  color={formData.gender === g ? "#fff" : "#555"}
                />
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === g && { color: "#fff" },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EDUCATION */}
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={formData.education}
              onValueChange={(v) => handleChange("education", v)}
            >
              <Picker.Item label="Select degree" value="" />
              <Picker.Item
                label="Bachelor of Science in Architecture"
                value="BS Architecture"
              />
              <Picker.Item
                label="Bachelor of Science in Civil Engineering"
                value="BSCE"
              />
              <Picker.Item
                label="Bachelor of Interior Design"
                value="Interior Design"
              />
            </Picker>
          </View>

          {/* SPECIALIZATION */}
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={formData.specialization}
              onValueChange={(v) => handleChange("specialization", v)}
            >
              <Picker.Item label="Select specialization" value="" />
              <Picker.Item
                label="Architectural Design"
                value="Architectural Design"
              />
              <Picker.Item
                label="Structural Engineering"
                value="Structural Engineering"
              />
              <Picker.Item
                label="Residential Interior Design"
                value="Residential Interior Design"
              />
              <Picker.Item
                label="Lighting Design"
                value="Lighting Design"
              />
            </Picker>
          </View>

          {/* PROFESSIONAL ONLY */}
          {formData.consultantType === "Professional" && (
            <>
              <Input
                label="Experience (Years)"
                keyboardType="numeric"
                value={formData.experience}
                onChangeText={(v) => handleChange("experience", v)}
              />
              <Input
                label="License Number"
                value={formData.licenseNumber}
                onChangeText={(v) => handleChange("licenseNumber", v)}
              />
            </>
          )}
        </View>

        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
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
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },

  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#2c4f4f",
  },

  genderRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dce3ea",
    backgroundColor: "#fff",
  },
  genderMaleActive: {
    backgroundColor: "#2c4f4f",
    borderColor: "#2c4f4f",
  },
  genderFemaleActive: {
    backgroundColor: "#8f2f52",
    borderColor: "#8f2f52",
  },
  genderText: { marginLeft: 8, fontWeight: "700", color: "#555" },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#dce3ea",
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 14,
  },

  saveBtn: { marginTop: 20 },
});
