import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { cacheUserRole } from "../config/userCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useLocalSearchParams } from "expo-router";

const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialRole = params.role || "user";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Load cached profile
  const loadProfile = async (uid) => {
    try {
      const json = await AsyncStorage.getItem(`${PROFILE_KEY_PREFIX}${uid}`);
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.log("Error loading cached profile:", err);
      return null;
    }
  };

  // Save profile to cache
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
      let collectionName = "users";
      if (role === "consultant") collectionName = "consultants";
      else if (role === "admin") collectionName = "admins";

      const docRef = doc(db, collectionName, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) return { uid, ...docSnap.data() };

      console.log("No profile found for UID:", uid);
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

    let profile = await loadProfile(uid);
    if (!profile) {
      profile = await fetchProfileFromFirestore(uid, initialRole);
      if (profile) await saveProfile(uid, profile);
    }

    if (!profile) {
      Alert.alert("First Time Login", "Please register your account first.");
      return;
    }

    if (profile.active === false) {
      Alert.alert(
        "Account Inactive",
        "Your account has been deactivated. Please contact admin."
      );
      return;
    }

    if (profile.role !== initialRole) {
      Alert.alert(
        "Access Denied",
        `This account is registered as a ${profile.role}. Please use the correct login page.`
      );
      return;
    }

    // 🚫 NEW CHECK: Prevent consultants with pending status
    if (profile.role === "consultant" && profile.status === "pending") {
      Alert.alert(
        "Pending Approval",
        "Your registration is still under review. Please wait for admin approval before logging in."
      );
      return;
    }

    await cacheUserRole(uid, profile.role);

    // ✅ Navigate based on approved role
    if (profile.role === "user") {
      router.replace("/User/Home");
    } else if (profile.role === "consultant") {
      router.replace("/DesignerTabs");
    } else if (profile.role === "admin") {
      router.replace("/AdminTabs");
    }
  } catch (error) {
    Alert.alert("Login Error", error.message);
  }
};

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() => router.push("/ForgotPassword")}
          style={styles.linkWrapper}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={login} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  back: {
    color: "#0F3E48",
    fontSize: 15,
    marginTop: 80,
    marginBottom: 100,
    margin: 10,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  title: {
    color: "#1E1E1E",
    fontSize: 30,
    fontWeight: "900",
    fontFamily: "serif",
    marginBottom: 3,
    marginHorizontal: 10,
  },
  subtitle: {
    color: "#4F4F4F",
    fontSize: 15,
    fontFamily: "serif",
    marginBottom: 32,
    opacity: 0.8,
    marginHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
  },
  linkWrapper: {
    alignItems: "flex-start",
    marginStart: 25,
    marginBottom: 18,
  },
  link: {
    color: "#0F3E48",
    fontWeight: "800",
    fontFamily: "serif",
  },
  loginButton: {
    backgroundColor: "#0F3E48",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  footerLink: {
    marginTop: 24,
  },
  footer: {
    textAlign: "center",
    color: "#1E1E1E",
    fontWeight: "400",
    fontSize: 15,
    fontFamily: "serif",
  },
});
