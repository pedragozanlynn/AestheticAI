import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

// Bottom Nav
import BottomNavbar from "../components/BottomNav";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Dashboard Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalConsultants, setTotalConsultants] = useState(0);
  const [pendingConsultants, setPendingConsultants] = useState(0);
  const [approvedConsultants, setApprovedConsultants] = useState(0);
  const [rejectedConsultants, setRejectedConsultants] = useState(0);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);

        // Fetch Consultants
        const consultantsSnap = await getDocs(collection(db, "consultants"));
        const consultants = consultantsSnap.docs.map((doc) => doc.data());

        setTotalConsultants(consultants.length);
        setPendingConsultants(
          consultants.filter((c) => !c.status || c.status === "pending").length
        );
        setApprovedConsultants(
          consultants.filter((c) => c.status === "accepted").length
        );
        setRejectedConsultants(
          consultants.filter((c) => c.status === "rejected").length
        );
      } catch (error) {
        console.log("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F3E48" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingBottom: 90 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>

        {/* Statistics Cards */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Users</Text>
          <Text style={styles.value}>{totalUsers}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Total Consultants</Text>
          <Text style={styles.value}>{totalConsultants}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pending Consultants</Text>
          <Text style={styles.pending}>{pendingConsultants}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Approved Consultants</Text>
          <Text style={styles.approved}>{approvedConsultants}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Rejected Consultants</Text>
          <Text style={styles.rejected}>{rejectedConsultants}</Text>
        </View>
      </ScrollView>

      <BottomNavbar role="admin" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F3E48",
    textAlign: "center",
    marginVertical: 20,
  },

  card: {
    backgroundColor: "#F4F8F9",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3,
  },

  label: { fontSize: 16, color: "#4A4A4A" },

  value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F3E48",
    marginTop: 5,
  },

  pending: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f39c12",
    marginTop: 5,
  },
  approved: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#27ae60",
    marginTop: 5,
  },
  rejected: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e74c3c",
    marginTop: 5,
  },
});
