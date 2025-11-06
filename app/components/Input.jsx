import React from "react";
import { TextInput, StyleSheet } from "react-native";

export default function Input({ style, ...props }) {
  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      placeholderTextColor="#999"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: "#111",
  },
});
