import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

// ✅ UPDATED API URL (Using your IP for Expo Go)
const API_URL = "https://baggiest-sterigmatic-kandi.ngrok-free.dev";

export default function Design() {
  const router = useRouter();
  const subType = useSubscriptionType();

  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker.MediaType || ImagePicker.MediaTypeOptions).Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setResult(null);
    }
  };

  const scanRoom = async () => {
    if (!image) return Alert.alert("Select Photo", "Please upload a room photo first.");
    if (!prompt) return Alert.alert("Enter Style", "Please describe the design style.");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: image,
        name: "room.jpg",
        type: "image/jpeg",
      });
      formData.append("prompt", prompt);

      const response = await fetch(`${API_URL}/api/redesign-room`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true", // This is the most important line!
        },
      });

      if (!response.ok) throw new Error("Server Error");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setResult(reader.result);
        setLoading(false);
      };
    } catch (error) {
      console.log(error);
      Alert.alert("Connection Error", "Ensure your PC and Phone are on the same Wi-Fi.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#0F3E48" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Room Redesign</Text>
        </View>

        {/* Image Picker */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={40} color="#aaa" />
              <Text style={styles.placeholderText}>Tap to Upload Room Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Prompt Input */}
        <Text style={styles.label}>Design Style</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Modern Minimalist, Cyberpunk, Scandinavian"
          value={prompt}
          onChangeText={setPrompt}
        />

        {/* Button */}
        <TouchableOpacity style={styles.btn} onPress={scanRoom} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Generate Design</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.label}>AI Result</Text>
            <Image source={{ uri: result }} style={styles.resultImage} />
          </View>
        )}
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 15 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#0F3E48" },
  
  imageBox: {
    height: 250,
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  previewImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },
  placeholderText: { color: "#aaa", marginTop: 10 },

  label: { fontSize: 16, fontWeight: "600", color: "#0F3E48", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    elevation: 2,
  },
  btn: {
    backgroundColor: "#0F3E48",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  resultContainer: { marginTop: 10 },
  resultImage: { width: "100%", height: 250, borderRadius: 15 },
});