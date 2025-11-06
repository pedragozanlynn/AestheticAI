import React from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Welcome to AestheticAI</Text>
      <Button title="Login" onPress={() => router.push("/screens/LoginScreen")} />
      <Button title="Register" onPress={() => router.push("/screens/RegisterScreen")} />
    </View>
  );
}
