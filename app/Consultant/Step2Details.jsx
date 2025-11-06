import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, Alert, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";


export default function Step2Details() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const step1Data = params.data ? JSON.parse(params.data) : {};
  const { fullName, email, address, consultantType } = step1Data;

  const prevData = step1Data.step2 || {};

  const [specialization, setSpecialization] = useState(prevData.specialization || "");
  const [education, setEducation] = useState(prevData.education || "");
  const [experience, setExperience] = useState(prevData.experience || "");
  const [licenseNumber, setLicenseNumber] = useState(prevData.licenseNumber || "");
  const [portfolio, setPortfolio] = useState(prevData.portfolio || null);
  const [availability, setAvailability] = useState(prevData.availability || []);

  const [day, setDay] = useState("");
  const [am, setAm] = useState("");
  const [pm, setPm] = useState("");

  const addAvailability = () => {
    if (!day || !am || !pm) return Alert.alert("Missing Field", "Please fill all availability fields.");
    setAvailability((prev) => [...prev, { day, am, pm }]);
    setDay(""); setAm(""); setPm("");
  };

  const handlePortfolio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (result.assets && result.assets.length > 0) setPortfolio(result.assets[0]);
  };

  const handleNext = () => {
    if (!specialization || !education) return Alert.alert("Missing Field", "Please fill required fields.");

    const dataToSend = {
      ...step1Data,
      step2: { specialization, education, experience, licenseNumber, portfolio, availability },
    };

    router.push(`/Consultant/Step3Review?data=${encodeURIComponent(JSON.stringify(dataToSend))}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 2 – Consultant Details</Text>
      <Text style={styles.sub}>Consultant Type: {consultantType === "professional" ? "Professional" : "Fresh Graduate"}</Text>

      <Text style={styles.label}>Specialization</Text>
      <Picker selectedValue={specialization} onValueChange={setSpecialization} style={styles.picker}>
        <Picker.Item label="Select specialization" value="" />
        <Picker.Item label="Interior Design" value="Interior Design" />
        <Picker.Item label="Structural" value="Structural" />
        <Picker.Item label="Landscape" value="Landscape" />
      </Picker>

      <Text style={styles.label}>Education</Text>
      <Picker selectedValue={education} onValueChange={setEducation} style={styles.picker}>
        <Picker.Item label="Select degree" value="" />
        <Picker.Item label="Bachelor of Interior Design" value="Bachelor of Interior Design" />
        <Picker.Item label="Bachelor of Architecture" value="Bachelor of Architecture" />
      </Picker>

      {consultantType === "professional" && (
        <>
          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="e.g. 3" />
          <Text style={styles.label}>License Number</Text>
          <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="Enter license number" />
        </>
      )}

      <Text style={styles.label}>Availability</Text>
      <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
        <Picker.Item label="Select Day" value="" />
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
          <Picker.Item key={d} label={d} value={d} />
        ))}
      </Picker>

      {day && (
        <>
          <TextInput style={styles.input} placeholder="AM e.g. 8:00 – 12:00" value={am} onChangeText={setAm} />
          <TextInput style={styles.input} placeholder="PM e.g. 1:00 – 5:00" value={pm} onChangeText={setPm} />
          <TouchableOpacity style={styles.addButton} onPress={addAvailability}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addText}>Add Availability</Text>
          </TouchableOpacity>
        </>
      )}

      {availability.length > 0 && availability.map((a, i) => (
        <Text key={i} style={styles.avail}>• {a.day}: {a.am} / {a.pm}</Text>
      ))}

      <TouchableOpacity style={styles.upload} onPress={handlePortfolio}>
        <Text>{portfolio ? "Portfolio Uploaded ✅" : "Upload Portfolio"}</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.next} onPress={handleNext}>
          <Text style={{ color: "#fff" }}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", color: "#0F3E48", marginBottom: 15 },
  sub: { fontSize: 16, marginBottom: 15 },
  label: { fontWeight: "600", marginTop: 10, marginBottom: 5 },
  picker: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 10 },
  addButton: { flexDirection: "row", backgroundColor: "#0F3E48", borderRadius: 8, padding: 10, justifyContent: "center", alignItems: "center", marginVertical: 5 },
  addText: { color: "#fff", marginLeft: 5 },
  avail: { marginLeft: 10, marginTop: 5 },
  upload: { backgroundColor: "#FFD700", alignItems: "center", padding: 10, borderRadius: 8, marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  back: { flex: 1, backgroundColor: "#ccc", alignItems: "center", padding: 12, borderRadius: 8, marginRight: 5 },
  next: { flex: 1, backgroundColor: "#0F3E48", alignItems: "center", padding: 12, borderRadius: 8, marginLeft: 5 },
});
