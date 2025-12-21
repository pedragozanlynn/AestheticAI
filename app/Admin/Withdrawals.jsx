import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ✅ import Ionicons
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";

export default function Withdrawals() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payouts"), async (snapshot) => {
      const list = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        let consultantName = "Unknown";
        if (data.consultantId) {
          const cRef = await getDoc(doc(db, "consultants", data.consultantId));
          if (cRef.exists()) consultantName = cRef.data().fullName;
        }

        list.push({
          id: docSnap.id,
          consultantId: data.consultantId,
          consultantName,
          amount: data.amount,
          gcash_number: data.gcash_number,
          timestamp: data.timestamp,
          status: data.status,
          notify: data.notify || false,
        });
      }

      setPayouts(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openPayoutModal = (item) => {
    setSelectedPayout(item);
    setModalVisible(true);
  };

  const approvePayout = async () => {
    try {
      await updateDoc(doc(db, "payouts", selectedPayout.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        notify: true,
      });

      const q = query(
        collection(db, "payments"),
        where("consultantId", "==", selectedPayout.consultantId),
        where("amount", "==", -selectedPayout.amount),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => {
        await updateDoc(doc(db, "payments", docSnap.id), {
          status: "completed",
          approvedAt: serverTimestamp(),
        });
      });

      alert("Payout approved!");
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      alert("Error approving payout");
    }
  };

  const declinePayout = async () => {
    try {
      await updateDoc(doc(db, "payouts", selectedPayout.id), {
        status: "declined",
        declinedAt: serverTimestamp(),
        notify: false,
      });

      const q = query(
        collection(db, "payments"),
        where("consultantId", "==", selectedPayout.consultantId),
        where("amount", "==", -selectedPayout.amount),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => {
        await updateDoc(doc(db, "payments", docSnap.id), {
          status: "declined",
          declinedAt: serverTimestamp(),
        });
      });

      await addDoc(collection(db, "payments"), {
        consultantId: selectedPayout.consultantId,
        userId: selectedPayout.consultantId,
        type: "withdraw_reversal",
        amount: selectedPayout.amount,
        createdAt: serverTimestamp(),
        status: "completed",
      });

      alert("Payout declined. Balance restored.");
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      alert("Error declining payout");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={{ flex: 1, paddingBottom: 90 }}>
      {/* Colored Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Withdrawal Requests</Text>
        <Text style={styles.headerSubtitle}>Manage consultant payout requests</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <FlatList
          data={payouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.payoutCard,
                item.status === "pending"
                  ? styles.payoutPending
                  : item.status === "approved"
                  ? styles.payoutApproved
                  : styles.payoutDeclined
              ]}
              onPress={() => openPayoutModal(item)}
            >
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutTitle}>{item.consultantName}</Text>
                  <Text style={styles.payoutText}>₱ {item.amount}</Text>
                  <Text style={styles.payoutText}>GCash: {item.gcash_number}</Text>
                  <Text style={styles.payoutText}>Status: {item.status}</Text>
                </View>

                {/* ✅ Icons on the right side */}
                <View style={styles.iconColumn}>
                  <Ionicons name="wallet" size={26} color="#0F3E48" style={{ marginBottom: 6 }} />
                  {item.status === "pending" && (
                    <Ionicons name="time" size={26} color="#f39c12" />
                  )}
                  {item.status === "approved" && (
                    <Ionicons name="checkmark-circle" size={26} color="#27ae60" />
                  )}
                  {item.status === "declined" && (
                    <Ionicons name="close-circle" size={26} color="#e74c3c" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* PAYOUT DETAILS MODAL */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Process Payout</Text>
              <Text>Consultant: {selectedPayout?.consultantName}</Text>
              <Text>Amount: ₱ {selectedPayout?.amount}</Text>
              <Text>GCash: {selectedPayout?.gcash_number}</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.confirmBtn} onPress={approvePayout}>
                  <Text style={styles.confirmText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.declineBtn} onPress={declinePayout}>
                  <Text style={styles.confirmText}>Decline</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* ✅ Bottom Navigation */}
      <BottomNavbar role="admin" />
    </View>
  );
}

/* ============ STYLES ============ */
const styles = StyleSheet.create({
  header: {
    backgroundColor: "#01579B",
    paddingVertical: 25,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#e0e0e0",
    marginTop: 4,
  },

  payoutCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  payoutPending: { backgroundColor: "#fff3e0" },
  payoutApproved: { backgroundColor: "#e8f5e9" },
  payoutDeclined: { backgroundColor: "#ffebee" },

  payoutTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: "#0F3E48",
    marginBottom: 6,
  },
  payoutText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconColumn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
    color: "#0F3E48",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  confirmBtn: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 6,
    shadowColor: "#27ae60",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  declineBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 6,
    shadowColor: "#e74c3c",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  cancelBtn: {
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },
  cancelText: {
    textAlign: "center",
    color: "#0F3E48",
    fontWeight: "600",
    fontSize: 16,
  },
});

  