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
import BottomNavbar from "../components/BottomNav";   // ✅ import navbar

export default function EarningsScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");

  const auth = getAuth();
  const consultantUid = auth.currentUser.uid;

  useEffect(() => {
    const ref = collection(db, "payments");
    const q = query(
      ref,
      where("consultantId", "==", consultantUid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let items = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let userName = "System";

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

      if (items.length === 0) {
        items = [
          {
            id: "dummy1",
            type: "consultant_earning",
            consultantAmount: 700,
            createdAt: { toDate: () => new Date() },
          },
          {
            id: "dummy2",
            type: "withdraw",
            consultantAmount: -300,
            createdAt: { toDate: () => new Date() },
          },
        ];
      }

      setEntries(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [consultantUid]);

  const total = entries.reduce((sum, e) => sum + e.consultantAmount, 0);

  const recordEarning = async (userId, amount) => {
    try {
      await addDoc(collection(db, "payments"), {
        consultantId: consultantUid,
        userId: userId,
        type: "consultant_earning",
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
      {/* Balance Card with Withdraw button inside */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>₱ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.balanceWithdrawBtn}
          onPress={() => setWithdrawVisible(true)}
        >
          <Text style={styles.balanceWithdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

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

            {/* GCash Card styled same as Balance */}
            <View style={styles.gcashCard}>
              <View style={styles.gcashRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gcashLabel}>GCash Number</Text>
                  <TextInput
                    style={styles.gcashInput}
                    keyboardType="phone-pad"
                    value={gcashNumber}
                    onChangeText={setGcashNumber}
                    placeholder="Enter number"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitWithdraw}
            >
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

      {/* ✅ Bottom navigation bar */}
      <BottomNavbar role="consultant" />
    </View>
  );
}


// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F3F9FA" },

  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#01579B", // ocean blue
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  balanceLabel: { fontSize: 15, fontWeight: "600", color: "#BBDEFB" },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  balanceWithdrawBtn: {
    backgroundColor: "#3fa796",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  balanceWithdrawText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amount: { fontSize: 18, fontWeight: "700" },
  date: { marginTop: 6, color: "#555", fontSize: 13 },
  small: { fontSize: 12, marginTop: 2, color: "#777" },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    color: "#0F3E48",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F3E48",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
  },

  gcashCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#01579B", // ocean blue, same as balance card
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gcashRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  gcashLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#BBDEFB",
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  gcashInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: "#0F3E48",
  },
  gcashWithdrawBtn: {
    backgroundColor: "#3fa796",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
  },
  gcashWithdrawText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },

  submitBtn: {
    backgroundColor: "#0277BD",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#0277BD",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  submitText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.5,
  },

  cancelBtn: { 
    marginTop: 14, 
    padding: 12, 
    borderRadius: 12,
    backgroundColor: "#ECEFF1",
  },
  cancelText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#37474F",
  },
});
