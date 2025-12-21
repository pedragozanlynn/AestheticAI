import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomNavbar from "../components/BottomNav";
import Button from "../components/Button"; // custom Button

export default function ConsultantProfile() {
  // ✅ Fixed consultant name + female avatar
  const userName = "Noelyn Pedragoza";
  const avatarSource = require("../../assets/office-woman.png");

  const handlePress = (section) => {
    console.log(`Pressed: ${section}`);
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    // clear storage or navigate to login screen here
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.profileRow}>
          <Image source={avatarSource} style={styles.avatarImage} />
          <View style={styles.profileInfo}>
            {/* ✅ Consultant’s name displayed */}
            <Text style={styles.header}>{userName}</Text>
            <Text style={styles.subHeader}>Consultant Account</Text>
          </View>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Edit Consultant Profile */}
        <TouchableOpacity style={styles.card} onPress={() => handlePress("Edit Consultant Profile")}>
          <Ionicons name="person-circle-outline" size={30} color="#1E90FF" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Edit Consultant Profile</Text>
            <Text style={styles.cardSubtitle}>Update your professional details</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* Manage Appointments */}
        <TouchableOpacity style={styles.card} onPress={() => handlePress("Manage Appointments")}>
          <Ionicons name="calendar-outline" size={30} color="#0277BD" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Manage Appointments</Text>
            <Text style={styles.cardSubtitle}>View and update your schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* View Earnings */}
        <TouchableOpacity style={styles.card} onPress={() => handlePress("View Earnings")}>
          <Ionicons name="cash-outline" size={30} color="#2ECC71" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>View Earnings</Text>
            <Text style={styles.cardSubtitle}>Check your balance and withdrawals</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* ✅ Change Password */}
        <TouchableOpacity style={styles.card} onPress={() => handlePress("Change Password")}>
          <Ionicons name="lock-closed-outline" size={30} color="#C44569" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={styles.cardSubtitle}>Secure your consultant account</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* ✅ Logout using custom Button */}
        <Button
          icon={<Ionicons name="log-out-outline" size={28} color="#fff" />}
          title="Logout"
          subtitle="Sign out of your consultant account"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#fff"
          backgroundColor="#C44569"
        />
      </ScrollView>

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F9FAFB" },

  headerWrap: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: "#01579B",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#faf9f6",
  },
  profileInfo: { flexDirection: "column" },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#faf9f6",
    letterSpacing: 1.2,
  },
  subHeader: {
    fontSize: 14,
    color: "#faf9f6",
    marginTop: 2,
    fontStyle: "italic",
  },
  divider: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginTop: 18,
    backgroundColor: "#faf9f6",
    shadowColor: "#1E90FF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  container: { padding: 20 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#912f56",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#2C3E50" },
  cardSubtitle: { fontSize: 13, color: "#7F8C8D", marginTop: 2 },
});
