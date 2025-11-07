import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, Alert, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// session storage to keep form values while app is running (prevents automatic reload on back/forth)
let sessionFormData = null;

export default function Step2Details() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialized = useRef(false);
  const saveTimer = useRef(null);

  const [formData, setFormData] = useState({
    specialization: "",
    education: "",
    experience: "",
    licenseNumber: "",
    portfolio: null,
    availability: [],
    day: "",
    am: "",
    pm: ""
  });

  // persist in-memory session copy so navigating back/forth during the app session
  // does not trigger a reload from params/AsyncStorage that would overwrite current edits
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
          try {
            const step1 = JSON.parse(params.data);
            if (step1.step2) {
              setFormData(prev => {
                const merged = { ...prev, ...step1.step2 };
                sessionFormData = merged;
                return merged;
              });
            }
          } catch (e) {
            console.warn("Failed to parse params.data", e);
          }
        }
      } catch (err) {
        console.error("Step2 load error:", err);
      }
    };
    init();
  }, [params?.data]);

  // keep sessionFormData updated whenever formData changes
  useEffect(() => {
    sessionFormData = formData;
  }, [formData]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, []);

  const saveStep2 = async (next) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem("step2Data", JSON.stringify(next));
      } catch (err) {
        console.error("Step2 save error:", err);
      }
      saveTimer.current = null;
    }, 500);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      sessionFormData = next;
      saveStep2(next);
      return next;
    });
  };

  const addAvailability = () => {
    if (!formData.day || !formData.am || !formData.pm) {
      return Alert.alert("Missing Field", "Please fill all availability fields.");
    }
    setFormData(prev => {
      const newAvailability = [...prev.availability, { day: prev.day, am: prev.am, pm: prev.pm }];
      const next = { ...prev, availability: newAvailability, day: "", am: "", pm: "" };
      sessionFormData = next;
      saveStep2(next);
      return next;
    });
  };

  const removeAvailability = (index) => {
    setFormData(prev => {
      const newAvailability = prev.availability.filter((_, i) => i !== index);
      const next = { ...prev, availability: newAvailability };
      sessionFormData = next;
      saveStep2(next);
      return next;
    });
  };

  // Robust portfolio upload handling and normalized response shapes
  const handlePortfolio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true
      });

      if (!result) return;

      // Newer SDK may return { canceled: true } or { canceled:false, assets: [...] }
      if (result.canceled) return;

      let file = null;

      // expo-document-picker older shape: { type: 'success'|'cancel', uri, name, size, mimeType }
      if (result.type === "success" || result.type === "picked") {
        file = result;
      } else if (Array.isArray(result.assets) && result.assets.length > 0) {
        // newer shape with assets array
        file = result.assets[0];
      } else if (result.uri || result.fileCopyUri) {
        // fallback
        file = result;
      } else {
        console.warn("Unsupported DocumentPicker result:", result);
        return;
      }

      const uri = file.uri || file.fileCopyUri || null;
      const name = file.name || (uri ? uri.split("/").pop() : "file");
      const size = typeof file.size === "number" ? file.size : (file.fileSize || 0);
      const mimeType = file.mimeType || file.type || "application/octet-stream";

      if (!uri) {
        Alert.alert("Upload Error", "Could not access selected file. Try a different file.");
        return;
      }

      const safePortfolio = { uri, name, size, mimeType };

      const next = { ...formData, portfolio: safePortfolio };
      setFormData(next);
      sessionFormData = next;
      try {
        await AsyncStorage.setItem("step2Data", JSON.stringify(next));
      } catch (err) {
        console.error("Portfolio save error:", err);
      }

      Alert.alert("Success", `Uploaded: ${name}`);
    } catch (err) {
      console.error("Portfolio error:", err);
      Alert.alert("Upload Error", "Could not pick file. Please try again.");
    }
  };

  const handleBack = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      await AsyncStorage.setItem("step2Data", JSON.stringify(formData));
      router.back();
    } catch (err) {
      console.error("Back save error:", err);
      router.back();
    }
  };

  const handleNext = async () => {
    if (!formData.specialization || !formData.education) {
      return Alert.alert("Missing Field", "Please fill required fields.");
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    try {
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
    } catch (error) {
      Alert.alert("Error", "Failed to save data. Please try again.");
    }
  };

  const consultantType = params?.data ? (JSON.parse(params.data).consultantType || "") : "";

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 2 – Consultant Details</Text>
      <Text style={styles.sub}>
        Consultant Type: {consultantType === "professional" ? "Professional" : "Fresh Graduate"}
      </Text>

      <Text style={styles.label}>Specialization</Text>
      <Picker
        selectedValue={formData.specialization}
        onValueChange={(v) => handleInputChange("specialization", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select specialization" value="" />
        <Picker.Item label="Interior Design" value="Interior Design" />
        <Picker.Item label="Structural" value="Structural" />
        <Picker.Item label="Landscape" value="Landscape" />
      </Picker>

      <Text style={styles.label}>Education</Text>
      <Picker
        selectedValue={formData.education}
        onValueChange={(v) => handleInputChange("education", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select degree" value="" />
        <Picker.Item label="Bachelor of Interior Design" value="Bachelor of Interior Design" />
        <Picker.Item label="Bachelor of Architecture" value="Bachelor of Architecture" />
      </Picker>

      {consultantType === "professional" && (
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

      {formData.availability.length > 0 &&
        formData.availability.map((a, i) => (
          <View key={i} style={styles.availabilityItem}>
            <Text style={styles.avail}>• {a.day}: {a.am} / {a.pm}</Text>
            <TouchableOpacity onPress={() => removeAvailability(i)}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

      <TouchableOpacity style={styles.upload} onPress={handlePortfolio}>
        <Text>{formData.portfolio ? "Portfolio Uploaded ✅" : "Upload Portfolio"}</Text>
      </TouchableOpacity>

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
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F3E48",
    marginBottom: 15
  },
  sub: {
    fontSize: 16,
    marginBottom: 15,
    color: "#666"
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333"
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff"
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#0F3E48",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5
  },
  addText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600"
  },
  availabilityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 10,
    marginTop: 6
  },
  avail: {
    marginLeft: 10,
    marginTop: 5,
    color: "#333"
  },
  upload: {
    backgroundColor: "#FFD700",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 40
  },
  back: {
    flex: 1,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginRight: 5
  },
  backText: {
    color: "#333",
    fontWeight: "600"
  },
  next: {
    flex: 1,
    backgroundColor: "#0F3E48",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginLeft: 5
  },
  nextText: {
    color: "#fff",
    fontWeight: "600"
  }
});
