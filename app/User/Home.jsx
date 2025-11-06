import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { auth } from "../../config/firebase";

const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  // Load user profile from cache
  const loadProfile = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Not Logged In", "Please login first.");
        router.replace("/User/Login");
        return;
      }

      const user = await AsyncStorage.getItem(`${PROFILE_KEY_PREFIX}${auth.currentUser.uid}`);
      if (user) {
        setProfile(JSON.parse(user));
      } else {
        Alert.alert("Error", "No user profile found. Please login again.");
        router.replace("/User/Login");
      }
    } catch (err) {
      console.log("Error loading profile:", err);
      Alert.alert("Error", "Failed to load user profile.");
      router.replace("/User/Login");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(`${PROFILE_KEY_PREFIX}${profile.uid}`);
      await auth.signOut();
      router.replace("/User/Login");
    } catch (err) {
      console.log("Logout Error:", err);
      Alert.alert("Error", "Failed to logout.");
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {profile.name}!</Text>
      <Text style={styles.info}>Email: {profile.email}</Text>
      <Text style={styles.info}>Role: {profile.role}</Text>
      <Text style={styles.info}>Subscription: {profile.subscription_type}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#0F3E48",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0F3E48",
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333333",
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: "#0F3E48",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
