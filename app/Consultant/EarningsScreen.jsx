import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

export default function EarningsScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");

  const auth = getAuth();
  const consultantUid = auth.currentUser.uid;

  // ----------------------------------------------------------
  // FETCH ALL PAYMENTS FOR THIS CONSULTANT
  // ----------------------------------------------------------
  useEffect(() => {
    const ref = collection(db, "payments");
    const q = query(
      ref,
      where("consultantId", "==", consultantUid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let userName = "System";

          // Fetch client name if earning
          if (data.userId && data.type === "consultant_earning") {
            try {
              const userRef = doc(db, "users", data.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                userName =
                  userDoc.data().name ||
                  userDoc.data().fullName ||
                  "User";
              }
            } catch (err) {
              console.log("Error fetching user name:", err);
            }
          }

          const rawAmount = Number(data.amount) || 0;
          let consultantAmount = rawAmount;

          // Apply 70% share for earnings
          if (data.type === "consultant_earning") {
            consultantAmount = rawAmount * 0.7;
          }

          return {
            id: docSnap.id,
            ...data,
            userName,
            consultantAmount,
          };
        })
      );

      setEntries(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [consultantUid]);

  // ------------------------------------
  // COMPUTE TOTAL BALANCE
  // ------------------------------------
  const total = entries.reduce((sum, e) => sum + e.consultantAmount, 0);

  // ----------------------------------------------------------
  // RECORD EARNING (call when session is completed)
  // ----------------------------------------------------------
  const recordEarning = async (userId, amount) => {
    try {
      await addDoc(collection(db, "payments"), {
        consultantId: consultantUid,
        userId: userId,
        type: "consultant_earning",   // 🔥 consistent everywhere
        amount: amount,
        createdAt: serverTimestamp(),
        status: "completed",
      });
      Alert.alert("Success", "Earning recorded successfully.");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to record earning.");
    }
  };

  // ----------------------------------------------------------
  // SUBMIT WITHDRAW
  // ----------------------------------------------------------
  const submitWithdraw = async () => {
    if (!withdrawAmount.trim() || !gcashNumber.trim()) {
      Alert.alert("Missing Info", "Please enter amount and GCash number.");
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (amountNum > total) {
      Alert.alert("Invalid Amount", "Withdrawal exceeds balance.");
      return;
    }

    try {
      await addDoc(collection(db, "payouts"), {
        consultantId: consultantUid,
        amount: amountNum,
        gcash_number: gcashNumber,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      await addDoc(collection(db, "payments"), {
        consultantId: consultantUid,
        userId: consultantUid,
        type: "withdraw",
        amount: -amountNum,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      Alert.alert("Success", "Withdrawal request submitted and awaiting admin approval.");
      setWithdrawVisible(false);
      setWithdrawAmount("");
      setGcashNumber("");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to submit withdrawal.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Balance Box */}
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>₱ {total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={styles.withdrawBtn}
        onPress={() => setWithdrawVisible(true)}
      >
        <Text style={styles.withdrawText}>Withdraw</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.type === "consultant_earning" && (
                <Text style={[styles.amount, { color: "#2ecc71" }]}>
                  Earned ₱ {item.consultantAmount.toFixed(2)}
                </Text>
              )}
              {item.type === "withdraw" && (
                <Text style={[styles.amount, { color: "red" }]}>
                  Withdraw ₱ {Math.abs(item.consultantAmount).toFixed(2)}
                </Text>
              )}
              {item.type === "withdraw_reversal" && (
                <Text style={[styles.amount, { color: "orange" }]}>
                  Reversal ₱ {item.consultantAmount.toFixed(2)}
                </Text>
              )}

              <Text style={styles.date}>
                {item.createdAt?.toDate().toLocaleString()}
              </Text>
              <Text style={styles.small}>User: {item.userName}</Text>
              <Text style={styles.small}>Status: {item.status}</Text>
            </View>
          )}
        />
      )}

      {/* MODAL */}
      <Modal visible={withdrawVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Withdraw Earnings</Text>

            <Text style={styles.inputLabel}>Amount (₱)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Enter amount"
            />

            <Text style={styles.inputLabel}>GCash Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={gcashNumber}
              onChangeText={setGcashNumber}
              placeholder="Enter number"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitWithdraw}>
              <Text style={styles.submitText}>Submit Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setWithdrawVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  balanceBox: {
    backgroundColor: "#0F3E48",
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2ecc71",
  },

  withdrawBtn: {
    backgroundColor: "#0F3E48",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  withdrawText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  amount: { fontSize: 18, fontWeight: "bold" },
  date: { marginTop: 4, color: "#555" },
  small: { fontSize: 12, marginTop: 2, color: "#777" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#0F3E48",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#0F3E48",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  submitText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 17,
  },
  cancelBtn: { marginTop: 10, padding: 12 },
  cancelText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
});
