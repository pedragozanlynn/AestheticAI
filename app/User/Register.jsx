import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  auth,
  db,
} from "../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

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

  // States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);

  // Validate input
  const validate = () => {
    if (!name.trim()) return Alert.alert("Registration", "Please enter your name.");
    if (!EMAIL_REGEX.test(email.trim())) return Alert.alert("Registration", "Enter a valid email.");
    if (password.length < 6) return Alert.alert("Registration", "Password must be at least 6 characters.");
    if (password !== confirm) return Alert.alert("Registration", "Passwords do not match.");
    if (!agree) return Alert.alert("Terms", "Please agree to the Terms & Conditions.");
    return true;
  };

  // Register user
  const register = async () => {
    if (!validate()) return;

    try {
      // 1️⃣ Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name });

      // 2️⃣ Prepare profile for Firestore
      const profile = {
        uid: credential.user.uid,
        name,
        email: email.trim(),
        role,
        subscription_type: "Free",
        createdAt: serverTimestamp(),
      };

      // 3️⃣ Save to Firestore
      await setDoc(doc(db, "users", credential.user.uid), profile);

      // 4️⃣ Cache role locally
      await cacheUserRole(credential.user.uid, role);

      // 5️⃣ Show success message and auto redirect to Login
      Alert.alert("Success", "Account created successfully!");
      setTimeout(() => {
        router.replace("/Login");
      }, 2000); // wait 2 seconds then redirect

    } catch (error) {
      Alert.alert("Registration Error", error.message);
      console.log("Register error:", error);
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Join us today! Create your account to get started.</Text>

        {/* Inputs */}
        <Input placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
        <Input placeholder="Confirm Password" secureTextEntry value={confirm} onChangeText={setConfirm} style={styles.input} />

        {/* Terms */}
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

        {/* Register button */}
        <Button title="Register" onPress={register} />

        {/* Link to Login */}
        <TouchableOpacity onPress={() => router.replace("/Login")} style={styles.footerLink}>
          <Text style={styles.footer}>Have an account? Login</Text>
        </TouchableOpacity>
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
  screen: { flex: 1, backgroundColor: "#FFF", paddingHorizontal: 20, paddingTop: 50 },
  scroll: { paddingBottom: 40 },
  title: { color: "#0F3E48", fontSize: 29, fontWeight: "900", fontFamily: "serif", marginTop: 60, marginStart: 12, marginBottom: 3 },
  subtitle: { color: "#4F4F4F", fontSize: 15, fontFamily: "serif", opacity: 0.8, marginBottom: 32, marginStart: 12 },
  input: { marginBottom: 16 },
  agreementRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  agreementText: { color: "#333", marginLeft: 12, flex: 1, lineHeight: 20, fontFamily: "serif" },
  footerLink: { marginTop: 24 },
  footer: { textAlign: "center", color: "#0F3E48", fontWeight: "400", fontSize: 15, fontFamily: "serif" },
});
