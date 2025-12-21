import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  auth,
  db,
} from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Components
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import PolicyModal from "../components/PolicyModal";
import { cacheUserRole } from "../../config/userCache";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useRouter();
  const role = "user"; // hardcoded for this page

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);

  const validate = () => {
    if (!name.trim()) return Alert.alert("Registration", "Please enter your name.");
    if (!EMAIL_REGEX.test(email.trim())) return Alert.alert("Registration", "Enter a valid email.");
    if (password.length < 6) return Alert.alert("Registration", "Password must be at least 6 characters.");
    if (password !== confirm) return Alert.alert("Registration", "Passwords do not match.");
    if (!agree) return Alert.alert("Terms", "Please agree to the Terms & Conditions.");
    return true;
  };

  const register = async () => {
    if (!validate()) return;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name });

      const profile = {
        uid: credential.user.uid,
        name,
        email: email.trim(),
        role,
        subscription_type: "Free",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", credential.user.uid), profile);
      await cacheUserRole(credential.user.uid, role);

      Alert.alert("Success", "Account created successfully!");
      setTimeout(() => {
        router.replace("/Login");
      }, 2000);
    } catch (error) {
      Alert.alert("Registration Error", error.message);
      console.log("Register error:", error);
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header with image and back button */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/new_background.jpg")}
            style={styles.image}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join us today to get started</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal Details</Text>
            <Input
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              icon={<Ionicons name="person-outline" size={18} color="#7a7a7a" />}
            />
            <Input
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              icon={<Ionicons name="mail-outline" size={18} color="#7a7a7a" />}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              icon={<Ionicons name="lock-closed-outline" size={18} color="#7a7a7a" />}
            />
            <Input
              placeholder="Confirm Password"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              style={styles.input}
              icon={<Ionicons name="lock-closed-outline" size={18} color="#7a7a7a" />}
            />
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <View style={styles.agreementRow}>
              <Switch
                value={agree}
                onValueChange={(val) => {
                  if (!val) return setAgree(false);
                  setPolicyVisible(true);
                }}
                trackColor={{ false: "#D1D5DB", true: "#0F3E48" }}
                thumbColor={agree ? "#FFF" : "#E5E7EB"}
              />
              <Text style={styles.agreementText}>I agree to the Terms & Conditions</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Button title="Register" onPress={register} />
            <TouchableOpacity onPress={() => router.replace("/Login")} style={styles.footerLink}>
            <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>
              <Text style={styles.footer}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Policy modal */}
      <PolicyModal
        visible={policyVisible}
        onClose={() => setPolicyVisible(false)}
        onAccept={() => setAgree(true)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#faf9f6",
    paddingHorizontal: 0,
  },
  scroll: { paddingBottom: 40 },

  header: {
    width: "100%",
    height: 360,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },
  headerTextContainer: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    transform: [{ translateY: -30 }],
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  headerSubtitle: {
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
    paddingHorizontal: 32,
    paddingTop: 32,
    marginTop: -160,
    backgroundColor: "#faf9f6",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  section: {
    marginBottom: 28,
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dce3ea",
    fontSize: 15,
    marginBottom: 12,
    color: "#2c3e50",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -30,   // 🔼 negative margin para umangat
    marginBottom: -40,  
  },
  agreementText: {
    color: "#912f56",   
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: "#d0d7d4" },
  orText: { marginHorizontal: 10, color: "#5f7268", fontWeight: "600", fontSize: 12 },
  footerLink: { marginTop: 24 },
  footer: { textAlign: "center", color: "#2c4f4f", fontWeight: "600", fontSize: 14, },
});
