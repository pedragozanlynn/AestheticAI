// BottomNavbar.jsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";

const { width } = Dimensions.get("window");

export default function BottomNavbar({ consultationNotifications = 0, role = "user" }) {
  const router = useRouter();
  const pathname = usePathname();

  // ---------------------------
  //  USER NAVIGATION TABS
  // ---------------------------
  const userTabs = [
    { name: "Home", icon: "home", routePath: "/User/Home" },
    { name: "AI Designer", icon: "color-palette", routePath: "/User/AIDesigner" },
    { name: "Consultation", icon: "chatbubbles", routePath: "/User/Consultation" },
    { name: "Projects", icon: "albums", routePath: "/User/Projects" },
    { name: "Profile", icon: "person", routePath: "/User/Profile" },
  ];

  // ---------------------------
  //  CONSULTANT NAVIGATION TABS
  // ---------------------------
  const consultantTabs = [
    { name: "Homepage", icon: "grid", routePath: "/Consultant/Homepage" },
    { name: "Requests", icon: "people", routePath: "/Consultant/Requests" },
    { name: "My Clients", icon: "chatbubble", routePath: "/Consultant/ChatList" },
    { name: "Earnings", icon: "wallet", routePath: "/Consultant/Earnings" },
    { name: "Profile", icon: "person", routePath: "/Consultant/Profile" },
  ];

  // ---------------------------
  //  ADMIN NAVIGATION TABS
  // ---------------------------
  const adminTabs = [
    { name: "Dashboard", icon: "speedometer", routePath: "/Admin/Dashboard" },
    { name: "Users", icon: "people-circle", routePath: "/Admin/Users" },
    { name: "Consultants", icon: "briefcase", routePath: "/Admin/Consultants" },
    { name: "Reports", icon: "bar-chart", routePath: "/Admin/Reports" },
    { name: "Settings", icon: "settings", routePath: "/Admin/Settings" },
  ];

  // Select tabs based on role
  const tabs = role === "admin" ? adminTabs : role === "consultant" ? consultantTabs : userTabs;

  // Create animated values for each tab
  const scaleAnim = useRef(tabs.map(() => new Animated.Value(1))).current;

  const handlePressIn = (index) => {
    Animated.spring(scaleAnim[index], {
      toValue: 1.2,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index, routePath) => {
    Animated.spring(scaleAnim[index], {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start(() => {
      router.push(routePath);
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          // CASE-INSENSITIVE MATCH (fixes your error)
          const isActive =
            pathname?.toLowerCase() === tab.routePath?.toLowerCase();

          return (
            <TouchableWithoutFeedback
              key={tab.name}
              onPressIn={() => handlePressIn(index)}
              onPressOut={() => handlePressOut(index, tab.routePath)}
            >
              <Animated.View style={[styles.tabButton, { transform: [{ scale: scaleAnim[index] }] }]}>
                <Ionicons
                  name={tab.icon}
                  size={28}
                  color={isActive ? "#008080" : "#0f3e48"}
                />

                <Text style={[styles.tabText, { color: isActive ? "#008080" : "#0f3e48" }]}>
                  {tab.name}
                </Text>

                {/* Notification Badge for USER only */}
                {tab.name === "Consultation" &&
                  consultationNotifications > 0 &&
                  role === "user" && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{consultationNotifications}</Text>
                    </View>
                  )}
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 6,
    width: width,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: width - 10,
    height: 70,
    backgroundColor: "#FFFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
  },
  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: 5,
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
