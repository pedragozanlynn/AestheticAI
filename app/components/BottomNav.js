import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "Home", icon: "home" },
    { key: "Account", icon: "person" },
    { key: "Projects", icon: "folder" },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setActiveTab(tab.key)}
          style={styles.navItem}
        >
          <MaterialIcons
            name={tab.icon}
            size={24}
            color={activeTab === tab.key ? "#111827" : "#555"}
          />
          <Text
            style={[styles.navText, activeTab === tab.key && styles.activeText]}
          >
            {tab.key}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, fontWeight: "600", color: "#555" },
  activeText: { color: "#111827", fontWeight: "800" },
});
