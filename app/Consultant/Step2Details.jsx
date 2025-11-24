import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// 🔥 Your services

import { pickFile, uploadToSupabase } from "../../services/fileUploadService";

// session cache
let sessionFormData = null;

export default function Step2Details() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialized = useRef(false);

  const [formData, setFormData] = useState({
    specialization: "",
    education: "",
    experience: "",
    licenseNumber: "",
    portfolioLink: "",
    availability: [],
    day: "",
    am: "",
    pm: ""
  });

  // ------------------------- PORTFOLIO UPLOAD (UPDATED) -------------------------
  const uploadPortfolio = async () => {
    try {
      const picked = await pickFile();
      if (!picked) return;

      const uploaded = await uploadToSupabase(picked, "portfolio-files");
      if (!uploaded) {
        return Alert.alert("Upload Failed", "Could not upload portfolio file.");
      }

      handleInputChange("portfolioLink", uploaded.fileUrl);

      Alert.alert("Success", "Portfolio uploaded successfully!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Something went wrong while uploading.");
    }
  };

  // ---------------------- LOAD FROM STORAGE ----------------------
  useEffect(() => {
    if (sessionFormData) {
      setFormData(sessionFormData);
      initialized.current = true;
      return;
    }

    const init = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const saved = await AsyncStorage.getItem("step2Data");
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
          sessionFormData = parsed;
          return;
        }

        if (params?.data) {
          const step1 = JSON.parse(params.data);
          if (step1.step2) {
            setFormData(prev => {
              const merged = { ...prev, ...step1.step2 };
              sessionFormData = merged;
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Step2 load error:", err);
      }
    };

    init();
  }, [params?.data]);

  // ---------------------- UNIVERSAL AUTO-SAVE ----------------------
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      sessionFormData = next;
      AsyncStorage.setItem("step2Data", JSON.stringify(next)); // AUTO-SAVE
      return next;
    });
  };

  // ---------------------- AVAILABILITY ADD ------------------------
  const addAvailability = () => {
    if (!formData.day || !formData.am || !formData.pm) {
      return Alert.alert("Missing Field", "Please fill all availability fields.");
    }
    setFormData(prev => {
      const newAvailability = [...prev.availability, { day: prev.day, am: prev.am, pm: prev.pm }];
      const next = { ...prev, availability: newAvailability, day: "", am: "", pm: "" };
      sessionFormData = next;
      AsyncStorage.setItem("step2Data", JSON.stringify(next));
      return next;
    });
  };

  // ---------------------- REMOVE AVAILABILITY ----------------------
  const removeAvailability = (index) => {
    setFormData(prev => {
      const newAvailability = prev.availability.filter((_, i) => i !== index);
      const next = { ...prev, availability: newAvailability };
      sessionFormData = next;
      AsyncStorage.setItem("step2Data", JSON.stringify(next));
      return next;
    });
  };

  // ---------------------- NAVIGATION ------------------------------
  const handleBack = async () => {
    await AsyncStorage.setItem("step2Data", JSON.stringify(formData));
    router.back();
  };

  const handleNext = async () => {
    if (!formData.specialization || !formData.education) {
      return Alert.alert("Missing Field", "Please fill required fields.");
    }

    await AsyncStorage.setItem("step2Data", JSON.stringify(formData));

    const step1Data = params?.data ? JSON.parse(params.data) : {};
    const dataToSend = {
      ...step1Data,
      step2: formData
    };

    router.push({
      pathname: "/Consultant/Step3Review",
      params: { data: JSON.stringify(dataToSend) }
    });
  };

  const consultantType = params?.data ? (JSON.parse(params.data).consultantType || "") : "";

  // ---------------------- UI ----------------------
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 2 – Consultant Details</Text>
      <Text style={styles.sub}>
        Consultant Type: {consultantType === "Professional" ? "Professional" : "Fresh Graduate"}
      </Text>

      {/* SPECIALIZATION */}
      <Text style={styles.label}>Specialization</Text>
      <Picker
        selectedValue={formData.specialization}
        onValueChange={(v) => handleInputChange("specialization", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select specialization" value="" />
        <Picker.Item label="Architecture" value="Architecture" />
        <Picker.Item label="Structural Engineering" value="Structural Engineering" />
        <Picker.Item label="Interior Design" value="Interior Design" />
        <Picker.Item label="Landscape Architecture" value="Landscape Architecture" />
        <Picker.Item label="Electrical Engineering" value="Electrical Engineering" />
        <Picker.Item label="Plumbing / Sanitary Engineering" value="Plumbing / Sanitary Engineering" />
        <Picker.Item label="Civil Engineering" value="Civil Engineering" />
      </Picker>

      {/* EDUCATION */}
      <Text style={styles.label}>Education</Text>
      <Picker
        selectedValue={formData.education}
        onValueChange={(v) => handleInputChange("education", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select degree" value="" />
        <Picker.Item label="Bachelor of Architecture" value="Bachelor of Architecture" />
        <Picker.Item label="Bachelor of Interior Design" value="Bachelor of Interior Design" />
        <Picker.Item label="Bachelor of Landscape Architecture" value="Bachelor of Landscape Architecture" />
        <Picker.Item label="Bachelor of Science in Civil Engineering" value="BSCE" />
        <Picker.Item label="Bachelor of Science in Electrical Engineering" value="BSEE" />
        <Picker.Item label="Bachelor of Science in Mechanical Engineering" value="BSME" />
        <Picker.Item label="Bachelor of Science in Sanitary Engineering" value="BSSE" />
      </Picker>

      {/* PRO ONLY FIELDS */}
      {consultantType === "Professional" && (
        <>
          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput
            style={styles.input}
            value={String(formData.experience)}
            onChangeText={(v) => handleInputChange("experience", v)}
            placeholder="e.g. 3"
            keyboardType="numeric"
          />

          <Text style={styles.label}>License Number</Text>
          <TextInput
            style={styles.input}
            value={formData.licenseNumber}
            onChangeText={(v) => handleInputChange("licenseNumber", v)}
            placeholder="Enter license number"
          />
        </>
      )}

      {/* AVAILABILITY */}
      <Text style={styles.label}>Availability</Text>
      <Picker
        selectedValue={formData.day}
        onValueChange={(v) => handleInputChange("day", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select Day" value="" />
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
          <Picker.Item key={d} label={d} value={d} />
        ))}
      </Picker>

      {formData.day ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="AM e.g. 8:00 – 12:00"
            value={formData.am}
            onChangeText={(v) => handleInputChange("am", v)}
          />
          <TextInput
            style={styles.input}
            placeholder="PM e.g. 1:00 – 5:00"
            value={formData.pm}
            onChangeText={(v) => handleInputChange("pm", v)}
          />

          <TouchableOpacity style={styles.addButton} onPress={addAvailability}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addText}>Add Availability</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {formData.availability.map((a, i) => (
        <View key={i} style={styles.availabilityItem}>
          <Text style={styles.avail}>• {a.day}: {a.am} / {a.pm}</Text>
          <TouchableOpacity onPress={() => removeAvailability(i)}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}

      {/* ---------------- PORTFOLIO UPLOAD ---------------- */}
      <Text style={styles.label}>Portfolio (Upload File)</Text>

      <TouchableOpacity
        style={{
          backgroundColor: "#0F3E48",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
        onPress={uploadPortfolio}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Upload Portfolio</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Portfolio file link will appear here"
        value={formData.portfolioLink}
        editable={false}
      />

      {/* BUTTONS */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.back} onPress={handleBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.next} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  title: { fontSize: 22, fontWeight: "bold", color: "#0F3E48", marginBottom: 15 },
  sub: { fontSize: 16, marginBottom: 15, color: "#666" },
  label: { fontWeight: "600", marginTop: 10, marginBottom: 5, color: "#333" },
  picker: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#fff", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  addButton: { flexDirection: "row", backgroundColor: "#0F3E48", borderRadius: 8, padding: 10, justifyContent: "center", alignItems: "center", marginVertical: 5 },
  addText: { color: "#fff", marginLeft: 5, fontWeight: "600" },
  availabilityItem: { flexDirection: "row", justifyContent: "space-between", paddingRight: 10, marginTop: 6 },
  avail: { marginLeft: 10, marginTop: 5, color: "#333" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 40 },
  back: { flex: 1, backgroundColor: "#E5E5EA", alignItems: "center", padding: 12, borderRadius: 8, marginRight: 5 },
  backText: { color: "#333", fontWeight: "600" },
  next: { flex: 1, backgroundColor: "#0F3E48", alignItems: "center", padding: 12, borderRadius: 8, marginLeft: 5 },
  nextText: { color: "#fff", fontWeight: "600" }
});
