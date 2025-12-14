import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function UpgradeInfo() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="#0F3E48"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Unlock All Premium Features</Text>
        <Text style={styles.subtitle}>
          Get full access to consultations, unlimited AI designs, and exclusive tools.
        </Text>

        {/* FEATURE LIST */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.feature}>Unlimited AI Room Designs</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.feature}>1-on-1 Chat with Consultants</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.feature}>Premium Tools & Suggestions</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.feature}>Priority Support</Text>
          </View>
        </View>

        {/* PRICE BOX */}
        <View style={styles.priceBox}>
          <Text style={styles.price}>₱249</Text>
          <Text style={styles.perMonth}>per month</Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push("/User/UpgradePayment")}
        >
          <Text style={styles.upgradeText}>Continue to Upgrade</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F3E48",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F3E48",
    textAlign: "center",
    marginTop: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#4A6B70",
    marginHorizontal: 30,
    marginTop: 8,
    fontSize: 15,
  },

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },

  feature: {
    fontSize: 16,
    color: "#0F3E48",
    fontWeight: "500",
  },

  priceBox: {
    alignItems: "center",
    marginTop: 30,
  },
  price: {
    fontSize: 42,
    fontWeight: "800",
    color: "#0F3E48",
  },
  perMonth: {
    fontSize: 16,
    color: "#4A6B70",
    marginTop: -5,
  },

  upgradeButton: {
    backgroundColor: "#0F3E48",
    marginHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 40,
  },
  upgradeText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
  },
});
