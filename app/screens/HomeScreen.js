import React, { useState } from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import BottomNav from "../components/BottomNav";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <View style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AestheticAI</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome Home 🎉</Text>
        <Text style={styles.subtitle}>Your dashboard</Text>

        <Text style={{ marginBottom: 8 }}>• AI Chat (placeholder)</Text>
        <Text style={{ marginBottom: 8 }}>• Layout Editor (placeholder)</Text>
        <Text>• Recent Projects (placeholder)</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 16 },
});
