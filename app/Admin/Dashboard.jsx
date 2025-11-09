import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function Dashboard() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all consultant records
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "consultants"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConsultants(list);
      } catch (error) {
        console.error("Error fetching consultants:", error);
        Alert.alert("Error", "Failed to load consultant data.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  // ✅ Approve consultant
  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "consultants", id), { status: "accepted" });
      Alert.alert("Success", "Consultant approved successfully!");
      setConsultants((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "accepted" } : c))
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to approve consultant.");
    }
  };

  // ✅ Reject consultant
  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, "consultants", id), { status: "rejected" });
      Alert.alert("Success", "Consultant rejected successfully!");
      setConsultants((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c))
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to reject consultant.");
    }
  };

  // ✅ UI
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0F3E48" />
        <Text>Loading consultant data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Consultant Applications</Text>

      {consultants.length === 0 ? (
        <Text style={styles.noData}>No consultant records found.</Text>
      ) : (
        consultants.map((c) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.name}>{c.fullName}</Text>
            <Text style={styles.field}>📧 Email: {c.email}</Text>
            <Text style={styles.field}>🏠 Address: {c.address}</Text>
            <Text style={styles.field}>👔 Consultant Type: {c.consultantType}</Text>
            <Text style={styles.field}>🎓 Education: {c.education}</Text>
            <Text style={styles.field}>💼 Specialization: {c.specialization}</Text>
            {c.experience ? (
              <Text style={styles.field}>🧠 Experience: {c.experience}</Text>
            ) : null}
            {c.licenseNumber ? (
              <Text style={styles.field}>📜 License #: {c.licenseNumber}</Text>
            ) : null}

            {/* Availability Section */}
            <Text style={styles.sectionTitle}>🕒 Availability:</Text>
            {Array.isArray(c.availability) && c.availability.length > 0 ? (
              c.availability.map((slot, i) => (
                <Text key={i} style={styles.field}>
                  • {slot.day}: {slot.am ? "AM " : ""} {slot.pm ? "PM" : ""}
                </Text>
              ))
            ) : (
              <Text style={styles.field}>Not specified</Text>
            )}

            {/* Portfolio Link */}
            <Text style={styles.sectionTitle}>📎 Portfolio:</Text>
            {c.portfolioURL ? (
              <TouchableOpacity onPress={() => Linking.openURL(c.portfolioURL)}>
                <Text style={styles.link}>View Portfolio</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.field}>No portfolio uploaded</Text>
            )}

            {/* Status */}
            <Text style={styles.status}>
              Status:{" "}
              <Text
                style={{
                  color:
                    c.status === "accepted"
                      ? "green"
                      : c.status === "rejected"
                      ? "red"
                      : "orange",
                  fontWeight: "bold",
                }}
              >
                {c.status || "pending"}
              </Text>
            </Text>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.accept]}
                onPress={() => handleApprove(c.id)}
                disabled={c.status === "accepted"}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.reject]}
                onPress={() => handleReject(c.id)}
                disabled={c.status === "rejected"}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F3E48",
    marginVertical: 15,
  },
  noData: { textAlign: "center", color: "#777", fontSize: 16 },
  card: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#0F3E48", marginBottom: 5 },
  field: { fontSize: 14, color: "#333", marginBottom: 3 },
  sectionTitle: { fontWeight: "bold", marginTop: 8, color: "#0F3E48" },
  link: {
    color: "#0066cc",
    textDecorationLine: "underline",
    marginVertical: 3,
  },
  status: { fontSize: 14, marginTop: 6 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  accept: { backgroundColor: "#2ecc71" },
  reject: { backgroundColor: "#e74c3c" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
