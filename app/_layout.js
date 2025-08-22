import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate loading time (e.g. Firebase init, assets preload)
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> 
      <Stack.Screen name="screens/LoginScreen" />
      <Stack.Screen name="screens/RegisterScreen" />
    </Stack>
  );
}
