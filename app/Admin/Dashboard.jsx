import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import { Ionicons } from "@expo/vector-icons";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalConsultants, setTotalConsultants] = useState(0);
  const [pendingConsultants, setPendingConsultants] = useState(0);
  const [approvedConsultants, setApprovedConsultants] = useState(0);
  const [rejectedConsultants, setRejectedConsultants] = useState(0);
  const [totalSubscriptionRevenue, setTotalSubscriptionRevenue] = useState(0);
  const [totalConsultationRevenue, setTotalConsultationRevenue] = useState(0);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);

        const consultantsSnap = await getDocs(collection(db, "consultants"));
        const consultants = consultantsSnap.docs.map((doc) => doc.data());
        setTotalConsultants(consultants.length);
        setPendingConsultants(consultants.filter((c) => !c.status || c.status === "pending").length);
        setApprovedConsultants(consultants.filter((c) => c.status === "accepted").length);
        setRejectedConsultants(consultants.filter((c) => c.status === "rejected").length);

        const subsRef = collection(db, "subscription_payments");
        const subsSnap = await getDocs(query(subsRef, where("status", "==", "Approved")));
        let subsTotal = 0;
        subsSnap.forEach((d) => (subsTotal += d.data().amount));
        setTotalSubscriptionRevenue(subsTotal);

        const consultRef = collection(db, "payments");
        const consultSnap = await getDocs(
          query(consultRef, where("type", "==", "consultant_earning"), where("status", "==", "completed"))
        );
        let consultTotal = 0;
        const consultList = consultSnap.docs.map((doc) => {
          const data = doc.data();
          const adminShare = data.amount * 0.3;
          consultTotal += adminShare;
          return { id: doc.id, ...data, adminShare, type: "consultation" };
        });
        setTotalConsultationRevenue(consultTotal);

        const subsList = subsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: "subscription" }));
        const combinedList = [...subsList, ...consultList]
          .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
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
        {/* Greeting */}
        <Text style={styles.greeting}>Hi Admin!</Text>

        {/* Quick Stats Grid */}
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardUsers]}>
            <Ionicons name="people" size={30} color="#0F3E48" />
            <Text style={styles.label}>Users</Text>
            <Text style={styles.value}>{totalUsers}</Text>
          </View>
          <View style={[styles.card, styles.cardConsultants]}>
            <Ionicons name="person" size={30} color="#0F3E48" />
            <Text style={styles.label}>Consultants</Text>
            <Text style={styles.value}>{totalConsultants}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, styles.cardPending]}>
            <Ionicons name="time" size={30} color="#f39c12" />
            <Text style={styles.label}>Pending</Text>
            <Text style={styles.pending}>{pendingConsultants}</Text>
          </View>
          <View style={[styles.card, styles.cardApproved]}>
            <Ionicons name="checkmark-circle" size={30} color="#27ae60" />
            <Text style={styles.label}>Approved</Text>
            <Text style={styles.approved}>{approvedConsultants}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, styles.cardRejected]}>
            <Ionicons name="close-circle" size={30} color="#e74c3c" />
            <Text style={styles.label}>Rejected</Text>
            <Text style={styles.rejected}>{rejectedConsultants}</Text>
          </View>
        </View>

        {/* Revenue Section */}
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardRevenue]}>
            <Text style={styles.label}>Subscription Revenue</Text>
            <Text style={styles.revenue}>₱{totalSubscriptionRevenue.toLocaleString()}</Text>
          </View>
          <View style={[styles.card, styles.cardRevenue]}>
            <Text style={styles.label}>Consultation Revenue</Text>
            <Text style={styles.revenue}>₱{totalConsultationRevenue.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardRevenue]}>
            <Text style={styles.label}>Grand Total</Text>
            <Text style={styles.revenue}>₱{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Recent Payments */}
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {recentPayments.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#777" }}>No approved payments yet.</Text>
        ) : (
          recentPayments.map((p) => (
            <View key={p.id} style={styles.paymentCard}>
              <Text style={styles.paymentAmount}>
                {p.type === "subscription"
                  ? `Subscription ₱${p.amount}`
                  : `Consultation Admin Share ₱${p.adminShare.toFixed(2)}`}
              </Text>
              <Text style={styles.paymentRef}>Ref: {p.reference_number || p.id}</Text>
              <Text style={styles.paymentDate}>{p.timestamp?.toDate().toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <BottomNavbar role="admin" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 20,  paddingTop:50,},
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F3E48",
    textAlign: "left", // moved to left
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F3E48",
    marginTop: 30,
    marginBottom: 15,
    textAlign: "left",
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  card: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minHeight: 120, // keeps same size even if alone
  },

   // Light pastel variants
   cardUsers: { backgroundColor: "#e0f7fa" },        // light cyan
   cardConsultants: { backgroundColor: "#ede7f6" }, // light lavender
   cardPending: { backgroundColor: "#fff3e0" },     // light orange
   cardApproved: { backgroundColor: "#e8f5e9" },    // light green
   cardRejected: { backgroundColor: "#ffebee" },    // light red
   cardRevenue: { backgroundColor: "#f3e5f5" },     // light purple
 
   label: {
     fontSize: 14,
     color: "#333",
     marginTop: 6,
     fontWeight: "500",
   },
   value: {
     fontSize: 22,
     fontWeight: "800",
     color: "#0F3E48",
     marginTop: 6,
   },
 
   revenue: {
     fontSize: 22,
     fontWeight: "700",
     color: "#27ae60",
     marginTop: 8,
   },
   pending: {
     fontSize: 22,
     fontWeight: "700",
     color: "#f39c12",
     marginTop: 8,
   },
   approved: {
     fontSize: 22,
     fontWeight: "700",
     color: "#27ae60",
     marginTop: 8,
   },
   rejected: {
     fontSize: 22,
     fontWeight: "700",
     color: "#e74c3c",
     marginTop: 8,
   },
 
   paymentCard: {
     backgroundColor: "#e3f2fd", // light blue for payments
     padding: 20,
     borderRadius: 18,
     marginBottom: 16,
     shadowColor: "#000",
     shadowOpacity: 0.05,
     shadowRadius: 4,
     shadowOffset: { width: 0, height: 2 },
     elevation: 2,
   },
   paymentAmount: {
     fontSize: 18,
     fontWeight: "700",
     color: "#0F3E48",
     marginBottom: 4,
   },
   paymentRef: {
     fontSize: 14,
     color: "#555",
     marginTop: 2,
   },
   paymentDate: {
     fontSize: 12,
     color: "#777",
     marginTop: 2,
   },
 });
 