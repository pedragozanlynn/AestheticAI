import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

  // Revenue Stats
  const [totalSubscriptionRevenue, setTotalSubscriptionRevenue] = useState(0);
  const [totalConsultationRevenue, setTotalConsultationRevenue] = useState(0);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // =====================================================
        // USERS
        // =====================================================
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);

        // =====================================================
        // CONSULTANTS
        // =====================================================
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

        // =====================================================
        // SUBSCRIPTION PAYMENTS – TOTAL REVENUE
        // =====================================================
        const subsRef = collection(db, "subscription_payments");
        const subsSnap = await getDocs(
          query(subsRef, where("status", "==", "Approved"))
        );

        let subsTotal = 0;
        subsSnap.forEach((d) => {
          subsTotal += d.data().amount;
        });
        setTotalSubscriptionRevenue(subsTotal);

        // =====================================================
        // CONSULTATION PAYMENTS – ADMIN SHARE
        // =====================================================
        const consultRef = collection(db, "payments");
        const consultSnap = await getDocs(
          query(
            consultRef,
            where("type", "==", "consultant_earning"),
            where("status", "==", "completed")
          )
        );

        let consultTotal = 0;
        const consultList = consultSnap.docs.map((doc) => {
          const data = doc.data();
          const adminShare = data.amount * 0.3;
          consultTotal += adminShare;
          return { id: doc.id, ...data, adminShare, type: "consultation" };
        });
        setTotalConsultationRevenue(consultTotal);

        // =====================================================
        // RECENT PAYMENTS (mix subscription + consultation)
        // =====================================================
        const subsList = subsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "subscription",
        }));

        const combinedList = [...subsList, ...consultList]
          .sort(
            (a, b) =>
              (b.timestamp?.toMillis?.() || 0) -
              (a.timestamp?.toMillis?.() || 0)
          )
          .slice(0, 5);

        setRecentPayments(combinedList);
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

  const grandTotal = totalSubscriptionRevenue + totalConsultationRevenue;

  return (
    <View style={{ flex: 1, paddingBottom: 90 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>

        {/* ===================== USERS ===================== */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Users</Text>
          <Text style={styles.value}>{totalUsers}</Text>
        </View>

        {/* ===================== CONSULTANTS ===================== */}
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

        {/* ===================== REVENUE ===================== */}
        <Text style={styles.sectionTitle}>Revenue</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Total Subscription Revenue</Text>
          <Text style={styles.revenue}>
            ₱{totalSubscriptionRevenue.toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Consultation Revenue (Admin Share)</Text>
          <Text style={styles.revenue}>
            ₱{totalConsultationRevenue.toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Grand Total Revenue</Text>
          <Text style={styles.revenue}>
            ₱{grandTotal.toLocaleString()}
          </Text>
        </View>

        {/* ===================== RECENT PAYMENTS ===================== */}
        <Text style={styles.sectionTitle}>Recent Payments</Text>

        {recentPayments.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#777" }}>
            No approved payments yet.
          </Text>
        ) : (
          recentPayments.map((p) => (
            <View key={p.id} style={styles.paymentCard}>
              <Text style={styles.paymentAmount}>
                {p.type === "subscription"
                  ? `Subscription ₱${p.amount}`
                  : `Consultation Admin Share ₱${p.adminShare.toFixed(2)}`}
              </Text>
              <Text style={styles.paymentRef}>
                Ref: {p.reference_number || p.id}
              </Text>
              <Text style={styles.paymentDate}>
                {p.timestamp?.toDate().toLocaleString()}
              </Text>
            </View>
          ))
        )}
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F3E48",
    marginTop: 25,
    marginBottom: 10,
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

  revenue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#27ae60",
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

  paymentAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F3E48",
  },
  paymentRef: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});
