import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/authConfig"
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onResetPassword = async () => {
    if (!email) {
      Alert.alert("Missing input", "Please enter your email first.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Email sent",
        "A password reset email has been sent. Check your inbox."
      );
      router.push("/screens/LoginScreen"); // navigate back to login
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 12 }}>
        Reset Password
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 12,
        }}
      />

      <TouchableOpacity
        onPress={onResetPassword}
        disabled={loading}
        style={{
          backgroundColor: "#111827",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>
          {loading ? "Sending…" : "Send Reset Email"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}