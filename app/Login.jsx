import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ROLE_KEY_PREFIX = "aestheticai:user-role:";
const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialRole = params.role || "user";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Cache role
  const cacheUserRole = async (uid, role) => {
    try {
      await AsyncStorage.setItem(`${ROLE_KEY_PREFIX}${uid}`, role);
    } catch (error) {
      console.warn("Failed to cache user role", error);
    }
  };

  // Cache profile
  const saveProfile = async (uid, profile) => {
    try {
      await AsyncStorage.setItem(
        `${PROFILE_KEY_PREFIX}${uid}`,
        JSON.stringify(profile)
      );
    } catch (err) {
      console.log("Error saving profile:", err);
    }
  };

  // Fetch profile from Firestore
  const fetchProfileFromFirestore = async (uid, role) => {
    try {
      let collection = "users";
      if (role === "consultant") collection = "consultants";
      if (role === "admin") collection = "admin";

      const docRef = doc(db, collection, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) return { uid, ...docSnap.data() };
      return null;
    } catch (err) {
      console.log("Error fetching profile:", err);
      return null;
    }
  };

  const login = async () => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = credential.user.uid;

      let profile = await fetchProfileFromFirestore(uid, initialRole);

      if (!profile) {
        Alert.alert(
          "First Time Login",
          "No profile found. Please register your account first."
        );
        return;
      }

      // Consultant pending check
      if (initialRole === "consultant" && profile.status === "pending") {
        Alert.alert(
          "Pending Approval",
          "Your registration is still under review. Please wait for admin approval."
        );
        return;
      }

      await cacheUserRole(uid, initialRole);
      await saveProfile(uid, profile);

      // Navigate based on role
      if (initialRole === "user") {
        router.replace("/User/Home");
      } else if (initialRole === "consultant") {
        router.replace("/Consultant/Home")
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Login Error", error.message || "Something went wrong");
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Sign in to continue to your account
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={login} style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {/* Role-based registration redirect */}
      <TouchableOpacity
        onPress={() => {
          if (initialRole === "consultant") {
            router.push("/Consultant/Step1Register");
          } else if (initialRole === "user") {
            router.push("/User/Register");
          } else {
            router.push(`/Register?role=${initialRole}`);
          }
        }}
        style={styles.footerLink}
      >
        <Text style={styles.footer}>New here? Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 5, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
  loginButton: { backgroundColor: "#0F3E48", padding: 15, borderRadius: 8, alignItems: "center" },
  loginButtonText: { color: "#fff", fontWeight: "bold" },
  footerLink: { marginTop: 25 },
  footer: { textAlign: "center", color: "#0F3E48", fontWeight: "600" },
});