import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Input from "../components/Input";       // ✅ import Input
import Button from "../components/Button";     // ✅ import Button
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";   // ✅ import Picker

export default function Step1Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    consultantType: "",
    gender: "" 
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (!global.__APP_SESSION__) {
          await AsyncStorage.multiRemove(["step1Data", "step2Data"]);
          global.__APP_SESSION__ = true;
        } else {
          const saved = await AsyncStorage.getItem("step1Data");
          if (saved) setFormData(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Step1 init error:", err);
      }
    };
    init();
  }, []);

  const handleInputChange = async (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    await AsyncStorage.setItem("step1Data", JSON.stringify(updated));
  };

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.address ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.consultantType ||
      !formData.gender
    ) {
      Alert.alert("Missing Field", "Please fill in all fields, including gender.");
      return false;
    }
    if (!formData.email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert("Invalid Password", "Password must be at least 8 characters long.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    try {
      await AsyncStorage.setItem("step1Data", JSON.stringify(formData));
      router.push({
        pathname: "/Consultant/Step2Details",
        params: { data: JSON.stringify(formData) }
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save data. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.headerTitle}>Consultant Registration</Text>
          <Text style={styles.headerSubtitle}>Step 1 – Personal Information</Text>
        </View>
      </View>

      {/* Form Content wrapped in content style */}
      <View style={styles.content}>
        <Input value={formData.fullName} onChangeText={(text) => handleInputChange("fullName", text)} placeholder="Enter full name" />
        <Input value={formData.email} onChangeText={(text) => handleInputChange("email", text)} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
        <Input value={formData.password} onChangeText={(text) => handleInputChange("password", text)} placeholder="Enter password" secureTextEntry />
        <Input value={formData.confirmPassword} onChangeText={(text) => handleInputChange("confirmPassword", text)} placeholder="Confirm password" secureTextEntry />
        <Input value={formData.address} onChangeText={(text) => handleInputChange("address", text)} placeholder="Enter address" />

        {/* ✅ Gender Picker */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => handleInputChange("gender", value)}
          >
            <Picker.Item label="Select gender..." value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        {/* ✅ Consultant Type Picker */}
        <Text style={styles.label}>Consultant Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.consultantType}
            onValueChange={(value) => handleInputChange("consultantType", value)}
          >
            <Picker.Item label="Select type..." value="" />
            <Picker.Item label="Professional" value="Professional" />
            <Picker.Item label="Fresh Graduate" value="Fresh Graduate" />
          </Picker>
        </View>

        {/* ✅ Use custom Button instead of TouchableOpacity */}
        <Button title="Next" onPress={handleNext} style={styles.next} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { width: "100%", height: 250, position: "relative" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  backButton: {
    position: "absolute",
    top: 30,
    left: 20,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },
  headerTextContainer: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    transform: [{ translateY: -20 }],
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
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
    marginTop: -90,
    backgroundColor: "#faf9f6",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  
  label: { fontWeight: "600", marginTop: 5, marginBottom: 3,    color: "#2c4f4f",

  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 10,
    backgroundColor: "#fff",
  },
  next: { marginTop: 20,  marginBottom: 20 }, // spacing for custom Button
});
