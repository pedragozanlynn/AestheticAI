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
import { db } from "../../config/firebase";

export default function Withdrawals() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  // ========================================================
  // 🔥 FETCH PAYOUT REQUESTS
  // ========================================================
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

  // ========================================================
  // 🔥 OPEN PAYOUT MODAL
  // ========================================================
  const openPayoutModal = (item) => {
    setSelectedPayout(item);
    setModalVisible(true);
  };

  // ========================================================
  // 🔥 APPROVE PAYOUT
  // ========================================================
  const approvePayout = async () => {
    try {
      // Update payout status
      await updateDoc(doc(db, "payouts", selectedPayout.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        notify: true,
      });

      // Find the related withdraw payment (pending)
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

  // ========================================================
  // 🔥 DECLINE PAYOUT
  // ========================================================
  const declinePayout = async () => {
    try {
      // Update payout status
      await updateDoc(doc(db, "payouts", selectedPayout.id), {
        status: "declined",
        declinedAt: serverTimestamp(),
        notify: false,
      });

      // Find the related withdraw payment (pending) and mark declined
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

      // Add reversal entry to restore balance
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

  // ========================================================
  // UI
  // ========================================================
  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 15 }}>
        Payout Requests
      </Text>

      <FlatList
        data={payouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.payoutCard}
            onPress={() => openPayoutModal(item)}
          >
            <Text style={styles.payoutTitle}>{item.consultantName}</Text>
            <Text>₱ {item.amount}</Text>
            <Text>GCash: {item.gcash_number}</Text>
            <Text>Status: {item.status}</Text>
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
  );
}

/* ============ STYLES ============ */
const styles = StyleSheet.create({
  payoutCard: {
    padding: 12,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    marginBottom: 10,
  },
  payoutTitle: { fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  confirmBtn: {
    backgroundColor: "#0F3E48",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  declineBtn: {
    backgroundColor: "#b30000",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  confirmText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  cancelBtn: { marginTop: 15, padding: 10 },
  cancelText: { textAlign: "center", color: "#333", fontWeight: "600", fontSize: 16 },
});
