import React, { useEffect, useRef } from "react";
import {
  ImageBackground,
  StatusBar,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

const HERO_IMAGE = require("../assets/new_background.jpg");

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ImageBackground source={HERO_IMAGE} style={styles.background} imageStyle={styles.image}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.welcome}>Welcome to</Text>
            <Text style={styles.brand}>Aesthetic AI</Text>
            <Text
              style={styles.tagline}
              onLongPress={() => router.push("/AdminLogin")}
            >
              Your dream space starts here ✨
            </Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.subtitle}>Continue as</Text>

          <TouchableOpacity
            style={[styles.button, styles.userButton]}
            onPress={() => router.push({ pathname: "/Login", params: { role: "user" } })}
          >
            <Text style={styles.userText}>User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.consultantButton]}
            onPress={() => router.push({ pathname: "/Login", params: { role: "consultant" } })}
          >
            <Text style={styles.consultantText}>Consultant</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>© 2025 Aesthetic AI. All rights reserved.</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  image: { resizeMode: "cover", opacity: 0.85 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  container: { width: "100%", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  welcome: {
    color: "#f1f1f1",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brand: {
    color: "#ffffff",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: 3,
    marginVertical: 12,
    textAlign: "center",
    fontFamily: "serif",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 8,
  },
  tagline: {
    color: "#e0e0e0",
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
  },
  divider: {
    width: 200,
    height: 2.5,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 30,
  },
  subtitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 20,
  },
  button: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: "center",
  },
  userButton: { backgroundColor: "#ffffff" },
  consultantButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  userText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  consultantText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  footer: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 40,
  },
});