import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

export default function Subscription() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOAD PENDING PAYMENTS
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "subscription_payments"));
      const pendingPayments = [];

      for (let docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (data.status === "Pending") {
          const userRef = doc(db, "users", data.user_id);
          const userSnap = await getDoc(userRef);

          pendingPayments.push({
            id: docSnap.id,
            ...data,
            user: userSnap.exists() ? userSnap.data() : null,
          });
        }
      }

      setPayments(pendingPayments);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load payments.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // APPROVE POPUP
  const approvePayment = async (payment) => {
    Alert.alert(
      "Approve Payment",
      "Are you sure you want to approve this subscription?",
      [
        { text: "Cancel" },
        {
          text: "Approve",
          style: "destructive",
          onPress: () => handleApprove(payment),
        },
      ]
    );
  };

  // --------------------------------
  // REAL APPROVAL FUNCTION (TIMESTAMP VERSION)
  // --------------------------------
  const handleApprove = async (payment) => {
    try {
      const userRef = doc(db, "users", payment.user_id);

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

      await updateDoc(userRef, {
        subscription_type: "Premium",
        subscribed_at: now,
        subscription_expires_at: expiresAt, // TIMESTAMP!!!
      });

      // Update PAYMENT status
      const paymentRef = doc(db, "subscription_payments", payment.id);
      await updateDoc(paymentRef, { status: "Approved" });

      Alert.alert("Success", "Subscription upgraded!");
      fetchPayments();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to approve payment.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0F3E48" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.header}>Pending Payments</Text>

      {payments.length === 0 ? (
        <Text style={styles.noData}>No pending payments found.</Text>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.userName}>
                {item.user?.name || "Unknown User"}
              </Text>
              <Text style={styles.text}>Amount: ₱{item.amount}</Text>
              <Text style={styles.text}>
                Reference No: {item.reference_number}
              </Text>
              <Text style={styles.text}>GCash Number: {item.gcash_number}</Text>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => approvePayment(item)}
              >
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 15,
    color: "#0F3E48",
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F3E48",
  },
  text: {
    fontSize: 15,
    marginTop: 4,
    color: "#4A6B70",
  },
  approveBtn: {
    backgroundColor: "#0F3E48",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  approveText: {
    color: "#FFF",
    fontWeight: "700",
    textAlign: "center",
  },
  noData: {
    marginTop: 20,
    fontSize: 16,
    color: "#4A6B70",
    textAlign: "center",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
