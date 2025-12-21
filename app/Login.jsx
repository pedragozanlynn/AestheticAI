import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import Button from "./components/Button"; // ✅ custom Button imported
import Input from "./components/Input";


const ROLE_KEY_PREFIX = "aestheticai:user-role:";
const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialRole = params.role || "user";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  let unsubscribeProfile = null;

  // Cache user role
  const cacheUserRole = async (uid, role) => {
    try {
      await AsyncStorage.setItem(`${ROLE_KEY_PREFIX}${uid}`, role);
    } catch (error) {
      console.warn("Failed to cache user role", error);
    }
  };

  // Save profile to AsyncStorage
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

  // Auto-detect subscription type
  const detectSubscription = (data) => {
    const now = new Date();
    let expiresAt = null;

    if (data.subscription_expires_at?.toDate) {
      expiresAt = data.subscription_expires_at.toDate();
    } else if (
      data.subscription_expires_at instanceof Object &&
      "seconds" in data.subscription_expires_at
    ) {
      expiresAt = new Date(data.subscription_expires_at.seconds * 1000);
    }

    if (expiresAt && expiresAt > now) return "Premium";
    return "Free";
  };

  // Fetch profile once
  const fetchProfileFromFirestore = async (uid, role) => {
    try {
      let collection = "users";
      if (role === "consultant") collection = "consultants";
      if (role === "admin") collection = "admin";

      const docRef = doc(db, collection, uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const subscription_type = detectSubscription(data);
      return { uid, ...data, subscription_type };
    } catch (err) {
      console.log("Error fetching profile:", err);
      return null;
    }
  };

  // Subscribe to profile changes
  const subscribeToProfile = (uid, role, onProfileUpdate) => {
    let collection = "users";
    if (role === "consultant") collection = "consultants";
    if (role === "admin") collection = "admin";

    const docRef = doc(db, collection, uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const subscription_type = detectSubscription(data);
        const profile = { uid, ...data, subscription_type };
        saveProfile(uid, profile);
        if (onProfileUpdate) onProfileUpdate(profile);
        console.log("Profile updated:", profile);
      }
    });
  };

  const login = async () => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = credential.user.uid;

      if (initialRole === "user") await AsyncStorage.setItem("userUid", uid);
      else if (initialRole === "consultant")
        await AsyncStorage.setItem("consultantUid", uid);

      // Fetch profile
      let profile = await fetchProfileFromFirestore(uid, initialRole);
      if (!profile) {
        Alert.alert(
          "First Time Login",
          "No profile found. Please register your account first."
        );
        return;
      }
     // Save name and gender for Profile screen
if (profile.name) {
  await AsyncStorage.setItem("user:name", profile.name);
}
if (profile.gender) {
  await AsyncStorage.setItem("user:gender", profile.gender); // "male" or "female"
}


      if (initialRole === "consultant") {
        if (profile.status === "pending") {
          Alert.alert(
            "Pending Approval",
            "Your registration is under review. Please wait for admin approval."
          );
          return;
        } else if (profile.status === "rejected") {
          Alert.alert(
            "Registration Rejected",
            "Your registration has been rejected. Please contact the admin."
          );
          return;
        }
      }

      // Cache role & profile
      await cacheUserRole(uid, initialRole);
      await saveProfile(uid, profile);
      setUserProfile(profile);

      // Real-time updates
      unsubscribeProfile = subscribeToProfile(uid, initialRole, setUserProfile);

      Alert.alert(
        "Login Successful",
        `Welcome back, ${profile.name || "User"}!`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (initialRole === "user") router.replace("/User/Home");
              else if (initialRole === "consultant")
                router.replace("/Consultant/Homepage");
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
      let message = "Something went wrong. Please try again.";
      if (error.code === "auth/invalid-email") message = "Invalid email address.";
      else if (error.code === "auth/user-not-found")
        message = "First time login. Please register your account first.";
      else if (error.code === "auth/wrong-password") message = "Incorrect password.";
      else if (error.code === "auth/network-request-failed")
        message = "Network error. Check your internet connection.";

      Alert.alert("Login Error", message);
    }
  };

  useEffect(() => {
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <Image
          source={require("../assets/new_background.jpg")}
          style={styles.image}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Account Information</Text>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() => router.push("/ForgotPassword")}
          style={styles.forgotContainer}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* ✅ Custom Button */}
        <Button title="Login" onPress={login} style={styles.loginButton} />

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          onPress={() => {
            if (initialRole === "consultant") router.push("/Consultant/Step1Register");
            else if (initialRole === "user") router.push("/User/Register");
            else router.push(`/Register?role=${initialRole}`);
          }}
          style={styles.footerLink}
        >
          <Text style={styles.footer}>New here? Create an Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { width: "100%", height: 360, position: "relative" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },
  headerTextContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    transform: [{ translateY: -30 }],
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#f5f5f5",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 6,
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    paddingTop: 32,
    marginTop: -40,
    paddingHorizontal: 50,
    backgroundColor: "#faf9f6",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c4f4f",
    marginBottom: 10,
    marginLeft: 6,
    letterSpacing: 0.3,
    paddingBottom: 2,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce3ea",
    fontSize: 14,
    marginBottom: 16,
    color: "#2c3e50",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  forgotContainer: {
    alignSelf: "flex-start",
    left: 10,
    marginBottom: 5,
  },
  forgotText: { color: "#912f56", fontWeight: "600", fontSize: 13 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: "#d0d7d4" },
  orText: { marginHorizontal: 10, color: "#5f7268", fontWeight: "600", fontSize: 12 },
  footerLink: { marginTop: 15 },
  footer: { textAlign: "center", color: "#2c4f4f", fontWeight: "600", fontSize: 14 },
 
});
