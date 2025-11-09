import React, { useState } from "react";
import { TextInput, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Input({ style, secureTextEntry, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#999"
        secureTextEntry={secureTextEntry && !showPassword}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    paddingRight: 44,
    fontSize: 15,
    color: "#111",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    bottom: 10,
    height: "100%",
    justifyContent: "center",
  }
});