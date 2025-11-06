import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";

export default function GoogleButton({ onPress, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* ✅ Google Logo */}
          <Image
            source={require("../../assets/images/google.jpg")}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
          <Text style={{ fontWeight: "700", fontSize: 16 }}>
            Continue with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
