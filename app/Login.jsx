import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../config/firebase";
import Input from "./components/Input";

const ROLE_KEY_PREFIX = "aestheticai:user-role:";
const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialRole = params.role || "user";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const cacheUserRole = async (uid, role) => {
    try {
      await AsyncStorage.setItem(`${ROLE_KEY_PREFIX}${uid}`, role);
    } catch (error) {
      console.warn("Failed to cache user role", error);
    }
  };

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
  
      // ⭐ REQUIRED FIX — saves correct UID depending on role
      if (initialRole === "user") {
        await AsyncStorage.setItem("userUid", uid);
        console.log("✔ userUid saved:", uid);
      } else if (initialRole === "consultant") {
        await AsyncStorage.setItem("consultantUid", uid);
        console.log("✔ consultantUid saved:", uid);
      }
  
      let profile = await fetchProfileFromFirestore(uid, initialRole);
  
      if (!profile) {
        Alert.alert(
          "First Time Login",
          "No profile found. Please register your account first."
        );
        return;
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
  
      await cacheUserRole(uid, initialRole);
      await saveProfile(uid, profile);
  
      Alert.alert(
        "Login Successful",
        `Welcome back, ${profile.name || "User"}!`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (initialRole === "user") {
                router.replace("/User/Home");
              } else if (initialRole === "consultant") {
                router.replace("/Consultant/Homepage");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
  
      let message = "Something went wrong. Please try again.";
      if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/user-not-found") {
        message = "First time login. Please register your account first.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Check your internet connection.";
      }
  
      Alert.alert("Login Error", message);
    }
  };
  
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.screen}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#0F3E48" />
        </TouchableOpacity>

        <Image
          source={require("../assets/login.png")}
          style={styles.image}
        />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue to your account
        </Text>

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

        <TouchableOpacity onPress={login} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#F5F9FA",
  },
  backButton: {
    position: "absolute",
    top: 70,
    left: 20,
    padding: 8,
  },
  image: {
    top: 20,
    width: 150,
    height: 130,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 80,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F3E48",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6A7A7C",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8EA",
    fontSize: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  forgotContainer: {
    alignSelf: "flex-start",
    marginBottom: 15,
    marginStart: 10,
  },
  forgotText: {
    color: "#0F3E48",
    fontWeight: "600",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#0F3E48",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
    shadowColor: "#0F3E48",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#dddddd",
  },
  orText: {
    marginHorizontal: 10,
    color: "#777",
    fontSize: 14,
  },
  footerLink: {
    marginTop: 30,
    paddingVertical: 6,
  },
  footer: {
    textAlign: "center",
    color: "#0F3E48",
    fontWeight: "600",
    fontSize: 15,
  },
});