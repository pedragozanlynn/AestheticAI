import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function Step3Review() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const data = params.data ? JSON.parse(params.data) : {};
  const step2 = data.step2 || {};
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;
      await updateProfile(user, { displayName: data.fullName });

      await setDoc(doc(db, "consultants", user.uid), {
        fullName: data.fullName,
        email: data.email,
        address: data.address,
        gender: data.gender,
        consultantType: data.consultantType,
        specialization: step2.specialization,
        education: step2.education,
        experience: step2.experience || "",
        licenseNumber: step2.licenseNumber || "",
        availability: step2.availability,
        portfolioURL: step2.portfolioLink || null,  // ⭐ UPDATED: correctly saved
        submittedAt: serverTimestamp(),
        status: "pending"
      });

      Alert.alert("Submitted ✅", "Your registration is pending admin approval.");
      router.replace("/Consultant/PendingApproval");
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Step 3 – Review Information</Text>

      <Text style={styles.section}>Personal Information</Text>
      <Text>Full Name: {data.fullName}</Text>
      <Text>Email: {data.email}</Text>
      <Text>Address: {data.address}</Text>
      <Text>Gender: {data.gender}</Text>

      <Text style={styles.section}>Consultant Details</Text>
      <Text>Type: {data.consultantType}</Text>
      <Text>Specialization: {step2.specialization}</Text>
      <Text>Education: {step2.education}</Text>

      {data.consultantType === "professional" && (
        <>
          <Text>Experience: {step2.experience} years</Text>
          <Text>License Number: {step2.licenseNumber}</Text>
        </>
      )}

      <Text style={styles.section}>Availability</Text>
      {step2.availability.length > 0 ? (
        step2.availability.map((a, i) => (
          <Text key={i}>• {a.day}: {a.am} / {a.pm}</Text>
        ))
      ) : (
        <Text>Not specified</Text>
      )}

      {/* ------------------ PORTFOLIO DISPLAY ------------------ */}
      <Text style={styles.section}>Portfolio</Text>

      {step2.portfolioLink ? (
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(step2.portfolioLink)}
        >
          📎 View Uploaded Portfolio File
        </Text>
      ) : (
        <Text>No portfolio file uploaded</Text>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submit, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.submitText}>Submit</Text>
          )}
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
  submitText: { color: "#fff", fontWeight: "600" },
  link: { color: "#0F3E48", textDecorationLine: "underline", marginVertical: 5 }
});
