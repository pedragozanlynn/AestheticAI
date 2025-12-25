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

/* ================= HELPERS ================= */

const formatDate = (value) => {
  if (!value) return "TBA";

  // Firestore Timestamp
  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }

  // JS Date
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  // String
  return String(value);
};

const formatTime = (value) => {
  if (!value) return "TBA";

  // Firestore Timestamp
  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // JS Date
  if (value instanceof Date) {
    return value.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // String
  return String(value);
};

export default function PaymentModal({
  visible,
  onClose,
  userId,
  consultantId,
  consultantName,
  appointmentId,
  appointmentDate,
  appointmentTime,
  onPaymentSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const safeDate = formatDate(appointmentDate);
  const safeTime = formatTime(appointmentTime);

  const handlePayment = async () => {
    if (!userId || !consultantId || !appointmentId) {
      alert("Missing payment information.");
      return;
    }

    setLoading(true);

    try {
      const consultantShare = SESSION_FEE * 0.7;
      const adminShare = SESSION_FEE * 0.3;

      await addDoc(collection(db, "payments"), {
        userId,
        consultantId,
        consultantName: consultantName || "Consultant",
        appointmentId,
        appointmentDate: safeDate,
        appointmentTime: safeTime,
        amount: consultantShare,
        currency: "PHP",
        status: "completed",
        createdAt: serverTimestamp(),
        method: "manual",
        type: "consultant_earning",
      });

      await addDoc(collection(db, "subscription_payments"), {
        adminId: "ADMIN_UID",
        userId,
        consultantId,
        appointmentId,
        appointmentDate: safeDate,
        appointmentTime: safeTime,
        amount: adminShare,
        currency: "PHP",
        status: "completed",
        createdAt: serverTimestamp(),
        method: "manual",
        type: "admin_income",
      });

      setLoading(false);
      onPaymentSuccess?.();
      onClose();
    } catch (err) {
      console.log("Payment error:", err);
      setLoading(false);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Consultation Payment</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Consultant</Text>
            <Text style={styles.value}>{consultantName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{safeDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Start Time</Text>
            <Text style={styles.value}>{safeTime}</Text>
          </View>

          <View style={styles.feeBox}>
            <Text style={styles.feeLabel}>Session Fee</Text>
            <Text style={styles.feeValue}>₱{SESSION_FEE}</Text>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, loading && { opacity: 0.7 }]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>Pay & Start Chat</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F3E48",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#607D8B",
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    color: "#0F3E48",
    fontWeight: "700",
  },
  feeBox: {
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 14,
    marginVertical: 18,
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 13,
    color: "#2c4f4f",
    fontWeight: "600",
  },
  feeValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2c4f4f",
    marginTop: 4,
  },
  payBtn: {
    backgroundColor: "#2c4f4f",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelText: {
    textAlign: "center",
    marginTop: 14,
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
});
