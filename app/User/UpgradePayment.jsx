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
} from "react-native";
import { auth, db } from "../../config/firebase";

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
        "Your payment will be verified by the admin.",
        [{ text: "OK", onPress: () => router.replace("/User/Home") }]
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong while submitting payment.");
    }
  };

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Payment</Text>
        <Text style={styles.subtitle}>
          Send your payment through GCash and fill in the details below.
        </Text>
      </View>

      {/* GCash Info */}
      <View style={styles.card}>
        <Image source={gcashLogo} style={styles.gcashLogo} />

        <Text style={styles.label}>GCash Account Name</Text>
        <Text style={styles.value}>{GCASH_NAME}</Text>

        <Text style={styles.label}>GCash Number</Text>
        <Text style={styles.value}>{GCASH_NUMBER}</Text>
      </View>

      {/* Inputs */}
      <View style={styles.form}>
        <Text style={styles.inputLabel}>Amount (₱)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.inputLabel}>GCash Reference Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter reference number"
          value={reference}
          onChangeText={setReference}
        />
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F3F9FA",
  },

  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F3E48",
  },
  subtitle: {
    fontSize: 15,
    color: "#4A6B70",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  gcashLogo: {
    width: 150,
    height: 100,
    alignSelf: "start",
    resizeMode: "contain",
  },

  label: {
    color: "#4A6B70",
    fontSize: 14,
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F3E48",
  },

  form: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F3E48",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    elevation: 2,
  },

  submitBtn: {
    backgroundColor: "#0F3E48",
    paddingVertical: 15,
    borderRadius: 12,
  },
  submitText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
  },
});
