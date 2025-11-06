import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import {
  auth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "../../config/authConfig";
import GoogleButton from "../components/GoogleButton";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Force the Expo proxy URI (works in Expo Go)
  const redirectUri = "https://auth.expo.io/@nlynn/AestheticAI";
  console.log("Redirect URI:", redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "873025464768-7e4buvv8sr3n7g8ovgr1d7hbpf4vm4ir.apps.googleusercontent.com",
    androidClientId:
      "873025464768-ipmmnlhtjj1erddf3jo708gpuehu5483.apps.googleusercontent.com",
    webClientId:
      "873025464768-7e4buvv8sr3n7g8ovgr1d7hbpf4vm4ir.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@nlynn/AestheticAI",
  });

  // ✅ Handle Google login response
  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === "success" && response.authentication?.idToken) {
        try {
          setLoading(true);
          const { idToken } = response.authentication;
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          router.replace("/screens/HomeScreen");
        } catch (e) {
          Alert.alert("Google Sign-In failed", e.message);
        } finally {
          setLoading(false);
        }
      }
    };
    signInWithGoogle();
  }, [response]);

  // ✅ Email/Password login
  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing input", "Please enter email and password.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/screens/HomeScreen");
    } catch (e) {
      Alert.alert("Login error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "800" }}>Welcome back</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 12,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 12,
        }}
      />
       <TouchableOpacity onPress={() => router.push("/screens/ForgotPasswordScreen")}>
      <Text style={{ color: "#1d4ed8", fontWeight: "600", marginTop: 8 }}>
    Forgot Password?
  </Text>
</TouchableOpacity>
      <TouchableOpacity
        onPress={onLogin}
        disabled={loading}
        style={{
          backgroundColor: "#111827",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>
          {loading ? "Signing in…" : "Login"}
        </Text>
      </TouchableOpacity>

      {/* ✅ Google button */}
      <GoogleButton
        onPress={() => promptAsync()}
        loading={loading || !request}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/screens/RegisterScreen")}>
          <Text style={{ fontWeight: "700" }}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}