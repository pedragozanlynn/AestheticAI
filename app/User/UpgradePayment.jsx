import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar,
    Platform
} from "react-native";
import { auth, db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";

export default function UpgradePayment() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const gcashLogo = require("../../assets/gcash_logo.png");

  // ⭐ Demo GCash Info
  const GCASH_NAME = "AestheticAI";
  const GCASH_NUMBER = "0995 862 1473";

  const handleSubmit = async () => {
    if (!amount.trim() || !reference.trim()) {
      Alert.alert("Missing Info", "Please enter amount and reference number.");
      return;
    }

    try {
      await addDoc(collection(db, "subscription_payments"), {
        user_id: auth.currentUser?.uid,
        amount: parseFloat(amount),
        reference_number: reference,
        gcash_number: GCASH_NUMBER,
        timestamp: serverTimestamp(),
        status: "Pending",
      });

      Alert.alert(
        "Payment Submitted",
        "Your payment will be verified by the admin within 24 hours.",
        [{ text: "OK", onPress: () => router.replace("/User/Home") }]
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong while submitting payment.");
    }
  };

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* BACK BUTTON & HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Payment Details</Text>
          <Text style={styles.subtitle}>
            Send your payment via GCash and upload the transaction details below.
          </Text>
        </View>

        {/* GCASH INFO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image source={gcashLogo} style={styles.gcashLogo} />
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>OFFICIAL</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Account Name</Text>
            <Text style={styles.value}>{GCASH_NAME}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>GCash Number</Text>
            <View style={styles.numberContainer}>
                <Text style={styles.value}>{GCASH_NUMBER}</Text>
                <TouchableOpacity onPress={() => Alert.alert("Copied", "Number copied to clipboard")}>
                    <Ionicons name="copy-outline" size={18} color="#3fa796" />
                </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* INPUT FORM */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Amount Sent (₱)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>₱</Text>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />
          </View>

          <Text style={styles.inputLabel}>GCash Reference Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="receipt-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="13-digit Reference No."
                placeholderTextColor="#94A3B8"
                value={reference}
                onChangeText={setReference}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON (Bright Teal-Green) */}
        <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.submitBtn} 
            onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Confirm Payment</Text>
          <Ionicons name="shield-checkmark" size={20} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.note}>
            Verification may take up to 24 hours. Please keep your GCash receipt.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FDFEFF",
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    marginBottom: 25,
  },
  backCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 4,
    shadowColor: '#3fa796',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    marginBottom: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gcashLogo: {
    width: 100,
    height: 30,
    resizeMode: "contain",
  },
  statusBadge: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3fa796',
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#3fa796", // Bright Teal-Green
    height: 65,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: "#3fa796",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  }
});