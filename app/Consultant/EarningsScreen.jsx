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
import BottomNavbar from "../components/BottomNav";

export default function EarningsScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // ✅ TAB STATE

  const auth = getAuth();
  const consultantUid = auth.currentUser.uid;

  /* ================= LOAD EARNINGS ================= */

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

          if (data.userId && data.type === "consultant_earning") {
            try {
              const userDoc = await getDoc(doc(db, "users", data.userId));
              if (userDoc.exists()) {
                userName =
                  userDoc.data().name ||
                  userDoc.data().fullName ||
                  "User";
              }
            } catch {}
          }

          return {
            id: docSnap.id,
            ...data,
            userName,
            consultantAmount: Number(data.amount) || 0,
          };
        })
      );

      setEntries(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [consultantUid]);

  /* ================= BALANCE ================= */

  const total = entries.reduce(
    (sum, e) => sum + (Number(e.consultantAmount) || 0),
    0
  );

  /* ================= FILTER ================= */

  const filteredEntries = entries.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "earned") return item.type === "consultant_earning";
    if (activeTab === "withdraw") return item.type === "withdraw";
    if (activeTab === "reversal") return item.type === "withdraw_reversal";
    return true;
  });

  /* ================= WITHDRAW ================= */

  const submitWithdraw = async () => {
    if (!withdrawAmount.trim() || !gcashNumber.trim()) {
      Alert.alert("Missing Info", "Please enter amount and GCash number.");
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (amountNum <= 0 || amountNum > total) {
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

      Alert.alert(
        "Success",
        "Withdrawal request submitted and awaiting admin approval."
      );

      setWithdrawVisible(false);
      setWithdrawAmount("");
      setGcashNumber("");
    } catch (err) {
      Alert.alert("Error", "Failed to submit withdrawal.");
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* BALANCE */}
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
      <Text style={styles.historyTitle}>Transaction History</Text>

      {/* TABS */}
      <View style={styles.tabsRow}>
        {["all", "earned", "withdraw", "reversal"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* LIST */}
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={filteredEntries}
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

      {/* WITHDRAW MODAL */}
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
            />

            <Text style={styles.inputLabel}>GCash Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={gcashNumber}
              onChangeText={setGcashNumber}
            />

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

      <BottomNavbar role="consultant" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F3F9FA" },

  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#01579B",
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 15, color: "#BBDEFB" },
  balanceAmount: { fontSize: 28, fontWeight: "900", color: "#fff" },

  balanceWithdrawBtn: {
    backgroundColor: "#3fa796",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  balanceWithdrawText: { color: "#fff", fontWeight: "700" },

  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#8f2f52",
  },
  tabText: { fontSize: 12, fontWeight: "700", color: "#555" },
  tabTextActive: { color: "#fff" },

  historyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#0F3E48",
  },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
  
    // ✨ visual upgrade
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  
    // ✨ subtle left accent (transaction feel)
    borderLeftWidth: 4,
    borderLeftColor: "#8f2f52",
  },
  
  amount: { fontSize: 18, fontWeight: "700" },
  date: { marginTop: 6, color: "#555", fontSize: 13 },

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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: "#0277BD",
    padding: 15,
    borderRadius: 12,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 17,
  },
  cancelBtn: { marginTop: 14, padding: 12 },
  cancelText: { textAlign: "center", fontWeight: "600" },
});
