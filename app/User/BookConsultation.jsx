import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function BookConsultation() {
  const router = useRouter();
  const { consultantId, date, time, notes } = useLocalSearchParams();

  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the REAL consultant Firestore doc using consultantId passed from previous page
  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        console.log("📌 Route consultantId:", consultantId);

        const ref = doc(db, "consultants", consultantId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          console.log("📌 Found consultant doc:", snap.id);
          setConsultant({
            id: snap.id, // REAL FIRESTORE DOC ID
            ...snap.data(),
          });
        } else {
          console.log("❌ Consultant not found.");
        }
      } catch (error) {
        console.log("❌ Error fetching consultant: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultant();
  }, [consultantId]);

  // Save the appointment for the correct consultant
  const handleConfirm = async () => {
    try {
      if (!consultant?.id) {
        alert("Error: consultant ID missing");
        return;
      }

      const userId = auth.currentUser?.uid;

      console.log("📌 Saving appointment with consultantId:", consultant.id);

      await addDoc(collection(db, "appointments"), {
        consultantId: consultant.id,       // <<<<< FIXED
        userId,
        date,
        time,
        notes: notes || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Appointment Request Sent!");
      router.replace("/User/Home");
    } catch (err) {
      console.log("❌ Error saving appointment:", err);
      alert("Failed to send request.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!consultant) {
    return (
      <View style={styles.center}>
        <Text>Consultant not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Appointment</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Consultant</Text>
        <Text style={styles.value}>{consultant.fullName}</Text>

        <Text style={styles.label}>Specialization</Text>
        <Text style={styles.value}>{consultant.specialization}</Text>

        <Text style={styles.label}>Consultant Type</Text>
        <Text style={styles.value}>{consultant.consultantType}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{date}</Text>

        <Text style={styles.label}>Time</Text>
        <Text style={styles.value}>{time}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{notes || "No message provided"}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#F4F4F4", padding: 15, borderRadius: 12, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", color: "#666" },
  value: { fontSize: 16, fontWeight: "500", marginBottom: 10 },
  button: { backgroundColor: "#3A7AFE", paddingVertical: 15, borderRadius: 12, marginTop: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 18, fontWeight: "600" },
});
