import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";


export default function Step1Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [consultantType, setConsultantType] = useState("");

  const handleNext = () => {
    if (!fullName || !email || !address || !consultantType)
      return Alert.alert("Missing Field", "Please fill in all fields.");

    const data = { fullName, email, address, consultantType };

    router.push({
      pathname: "/Consultant/Step2Details",
      params: { data: JSON.stringify(data) },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 1 – Personal Information</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter full name" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />

      <Text style={styles.label}>Complete Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter address" />

      <Text style={styles.label}>Consultant Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.option, consultantType === "professional" && styles.selected]}
          onPress={() => setConsultantType("professional")}
        >
          <Text>Professional</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, consultantType === "fresh" && styles.selected]}
          onPress={() => setConsultantType("fresh")}
        >
          <Text>Fresh Graduate</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.next} onPress={handleNext}>
        <Text style={{ color: "#fff" }}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", color: "#0F3E48", marginBottom: 15 },
  label: { fontWeight: "600", marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  option: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center", padding: 12, marginHorizontal: 5 },
  selected: { backgroundColor: "#E6F4FE", borderColor: "#0F3E48" },
  next: { backgroundColor: "#0F3E48", padding: 15, alignItems: "center", borderRadius: 8, marginTop: 20 },
});
