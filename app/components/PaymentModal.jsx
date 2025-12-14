import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

const SESSION_FEE = 999;

const PaymentModal = ({
  visible,
  onClose,
  userId,
  consultantId,
  consultantName,
  appointmentId,
  appointmentDate,
  appointmentTime,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const consultantShare = SESSION_FEE * 0.7;
      const adminShare = SESSION_FEE * 0.3;

      // Consultant earning
      await addDoc(collection(db, "payments"), {
        userId,
        consultantId,
        consultantName,
        appointmentId,
        appointmentDate,
        appointmentTime,
        amount: consultantShare,
        currency: "PHP",
        status: "completed",
        createdAt: serverTimestamp(),
        method: "manual",
        type: "consultant_earning",
      });

      // Admin earning
      await addDoc(collection(db, "subscription_payments"), {
        adminId: "ADMIN_UID",
        userId,
        consultantId,
        appointmentId,
        appointmentDate,
        appointmentTime,
        amount: adminShare,
        currency: "PHP",
        status: "completed",
        createdAt: serverTimestamp(),
        method: "manual",
        type: "admin_income",
      });

      setLoading(false);
      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.log("Payment error:", err);
      setLoading(false);
      alert("Payment failed. Try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Pay Consultant</Text>

          <Text style={styles.text}>Consultant: {consultantName}</Text>
          <Text style={styles.text}>Date: {appointmentDate}</Text>
          <Text style={styles.text}>Time: {appointmentTime}</Text>

          <Text style={styles.text}>Session Fee: ₱{SESSION_FEE}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pay Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  text: { fontSize: 16, marginBottom: 5 },
  button: {
    backgroundColor: "#0F3E48",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelButton: { marginTop: 12 },
  cancelText: { color: "#888", fontSize: 16 },
});

export default PaymentModal;
