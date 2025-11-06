import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";


export default function Step3Review() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const data = params.data ? JSON.parse(params.data) : {};
  const step2 = data.step2 || {};
  const availability = step2.availability || [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 3 – Review Information</Text>

      <Text style={styles.section}>Personal Information</Text>
      <Text>Full Name: {data.fullName || "N/A"}</Text>
      <Text>Email: {data.email || "N/A"}</Text>
      <Text>Complete Address: {data.address || "N/A"}</Text>

      <Text style={styles.section}>Consultant Details</Text>
      <Text>Consultant Type: {data.consultantType || "N/A"}</Text>
      <Text>Specialization: {step2.specialization || "N/A"}</Text>
      <Text>Education: {step2.education || "N/A"}</Text>
      <Text>Experience: {step2.experience || "N/A"}</Text>
      <Text>License Number: {step2.licenseNumber || "N/A"}</Text>
      <Text>Portfolio: {step2.portfolio ? step2.portfolio.name : "N/A"}</Text>

      <Text style={styles.section}>Availability</Text>
      {availability.length > 0 ? (
        availability.map((a, i) => (
          <Text key={i}>• {a.day}: {a.am} / {a.pm}</Text>
        ))
      ) : (
        <Text>Not specified</Text>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submit}
          onPress={() => alert("Submitted ✅")}
        >
          <Text style={{ color: "#fff" }}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", color: "#0F3E48", marginBottom: 15 },
  section: { fontSize: 18, marginTop: 15, marginBottom: 8, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  back: { flex: 1, backgroundColor: "#ccc", alignItems: "center", padding: 12, borderRadius: 8, marginRight: 5 },
  submit: { flex: 1, backgroundColor: "#0F3E48", alignItems: "center", padding: 12, borderRadius: 8, marginLeft: 5 },
});
