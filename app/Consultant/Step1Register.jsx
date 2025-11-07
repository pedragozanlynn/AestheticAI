import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Input from "../components/Input";

export default function Step1Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    consultantType: ""
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Cold app start: clear persisted step data so inputs are empty after a full reload
        if (!global.__APP_SESSION__) {
          await AsyncStorage.multiRemove(["step1Data", "step2Data"]);
          global.__APP_SESSION__ = true;
        } else {
          // Same session navigation: load previously saved step1 (for back/forward editing)
          const saved = await AsyncStorage.getItem("step1Data");
          if (saved) setFormData(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Step1 init error:", err);
      }
    };
    init();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.address ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.consultantType
    ) {
      Alert.alert("Missing Field", "Please fill in all fields.");
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
      <Text style={styles.title}>Step 1 – Personal Information</Text>

      <Text style={styles.label}>Full Name</Text>
      <Input
        style={styles.input}
        value={formData.fullName}
        onChangeText={(text) => handleInputChange("fullName", text)}
        placeholder="Enter full name"
      />

      <Text style={styles.label}>Email</Text>
      <Input
        style={styles.input}
        value={formData.email}
        onChangeText={(text) => handleInputChange("email", text)}
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <Input
        style={styles.input}
        value={formData.password}
        onChangeText={(text) => handleInputChange("password", text)}
        placeholder="Enter password"
        isPassword={true}
      />

      <Text style={styles.label}>Confirm Password</Text>
      <Input
        style={styles.input}
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange("confirmPassword", text)}
        placeholder="Confirm password"
        isPassword={true}
      />

      <Text style={styles.label}>Complete Address</Text>
      <Input
        style={styles.input}
        value={formData.address}
        onChangeText={(text) => handleInputChange("address", text)}
        placeholder="Enter address"
      />

      <Text style={styles.label}>Consultant Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.option, formData.consultantType === "professional" && styles.selected]}
          onPress={() => handleInputChange("consultantType", "professional")}
        >
          <Text>Professional</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, formData.consultantType === "fresh" && styles.selected]}
          onPress={() => handleInputChange("consultantType", "fresh")}
        >
          <Text>Fresh Graduate</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.next} onPress={handleNext}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F3E48",
    marginBottom: 15
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 5
  },
  selected: {
    backgroundColor: "#E6F4FE",
    borderColor: "#0F3E48"
  },
  next: {
    backgroundColor: "#0F3E48",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20
  },
  nextText: {
    color: "#fff",
    fontWeight: "600"
  }
});