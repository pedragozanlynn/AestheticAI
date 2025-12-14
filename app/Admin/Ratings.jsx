import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../config/firebase";
import { payConsultantService } from "../../services/payConsultantService";

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  // PAYMENT MODAL
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [amount, setAmount] = useState("");

  // ========================================================
  // 🔥 FETCH RATINGS
  // ========================================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), async (snapshot) => {
      const items = [];

      for (const snap of snapshot.docs) {
        const data = snap.data();

        // Consultant Name
        let consultantName = "Unknown Consultant";
        if (data.consultantId) {
          const cRef = await getDoc(doc(db, "consultants", data.consultantId));
          if (cRef.exists()) consultantName = cRef.data().fullName;
        }

        // User Name
        let userName = "Unknown User";
        if (data.userId) {
          const uRef = await getDoc(doc(db, "users", data.userId));
          if (uRef.exists()) userName = uRef.data().name;
        }

        items.push({
          id: snap.id,
          consultantId: data.consultantId,
          userId: data.userId,
          consultantName,
          userName,
          rating: data.rating,
          feedback: data.feedback || "No feedback",
          paid: data.paid || false,
        });
      }

      setRatings(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ========================================================
  // 🔥 OPEN PAYMENT MODAL
  // ========================================================
  const openPaymentModal = (item) => {
    setSelectedItem(item);
    setAmount("");
    setModalVisible(true);
  };

  // ========================================================
  // 🔥 CONFIRM PAYMENT
  // ========================================================
  const confirmPayment = async () => {
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Invalid amount");
      return;
    }

    const result = await payConsultantService(selectedItem, numAmount);
    alert(result.message);
    setModalVisible(false);
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
        Consultant Ratings Review
      </Text>

      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Consultant: {item.consultantName}</Text>
            <Text style={styles.user}>User: {item.userName}</Text>
            <Text style={styles.rating}>⭐ Rating: {item.rating}</Text>
            <Text style={styles.feedback}>Feedback: "{item.feedback}"</Text>

            {item.paid ? (
              <View style={styles.paidBox}>
                <Text style={styles.paidText}>Already Paid</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => openPaymentModal(item)}
                style={styles.payBtn}
              >
                <Text style={styles.payBtnText}>Pay Consultant</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* PAYMENT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Pay Consultant</Text>
            <Text>Consultant: {selectedItem?.consultantName}</Text>

            <TextInput
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                marginVertical: 15,
                padding: 10,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmPayment}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.confirmText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ============ STYLES ============ */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  user: { fontSize: 16 },
  rating: { marginTop: 10, fontSize: 18 },
  feedback: { marginTop: 5, fontStyle: "italic" },
  payBtn: {
    backgroundColor: "#0F3E48",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  payBtnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
  paidBox: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  paidText: { color: "#fff", textAlign: "center", fontWeight: "700" },
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
});
