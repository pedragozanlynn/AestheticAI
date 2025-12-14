import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activity, setActivity] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const subType = useSubscriptionType();

  // ----------------------------
  // Load profile from Firestore
  // ----------------------------
  const loadProfile = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Not Logged In", "Please login first.");
        router.replace("/User/Login");
        return;
      }

      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        Alert.alert("Error", "User not found.");
        return;
      }

      const data = snap.data();
      setProfile(data);

      // Cache profile locally
      await AsyncStorage.setItem(`${PROFILE_KEY_PREFIX}${uid}`, JSON.stringify(data));
    } catch (err) {
      console.log("Profile Load Error:", err);
      Alert.alert("Error", "Unable to load profile.");
    }
  };

  // ----------------------------
  // Mock Rooms
  // ----------------------------
  const fetchRooms = () => {
    setRooms([
      { id: "1", name: "Living Room", image: "https://i.imgur.com/F9S5K9K.jpeg" },
      { id: "2", name: "Bedroom", image: "https://i.imgur.com/2sOeMyl.jpeg" },
      { id: "3", name: "Workspace", image: "https://i.imgur.com/eGXyZQF.jpeg" },
    ]);
  };

  // ----------------------------
  // Mock Activity
  // ----------------------------
  const fetchActivity = () => {
    setActivity([
      { id: "a1", icon: "image-outline", title: "Generated New Design", subtitle: "AI Interior Suggestion" },
      { id: "a2", icon: "chatbubble-ellipses-outline", title: "Consultation Sent", subtitle: "Pending approval" },
    ]);
  };

  const getAISuggestion = () => {
    setAiSuggestion("Try a Scandinavian minimalistic theme for your workspace.");
  };

  // ----------------------------
  // Premium check (from hook)
  // ----------------------------
  const isPremium = subType === "Premium";

  // ----------------------------
  // Navigation functions
  // ----------------------------
  const goToConsultation = () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Consultation is only available for Premium users.",
        [
          { text: "Cancel" },
          { text: "Upgrade Now", onPress: () => router.push("/User/UpgradeInfo") },
        ]
      );
      return;
    }

    router.push("/User/Consultation");
  };

  const goToDesignAI = () => router.push("/user/AIDesigner");
  const goToCustomizeAI = () => router.push("/user/AIDesigner");
  const goToProjects = () => router.push("/user/Projects");

  const logout = async () => {
    try {
      await AsyncStorage.clear();
      await auth.signOut();
      router.replace("/User/Login");
    } catch (e) {
      Alert.alert("Error", "Logout failed.");
    }
  };

  // ----------------------------
  // INITIALIZE
  // ----------------------------
  useEffect(() => {
    loadProfile();
    fetchRooms();
    fetchActivity();
    getAISuggestion();
  }, []);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: "https://i.imgur.com/HSm6Jcs.jpeg" }}
          style={styles.hero}
        >
          <View style={styles.overlay} />
          <View style={styles.heroContent}>
            <Text style={styles.greet}>Welcome back,</Text>
            <Text style={styles.name}>{profile?.name}</Text>

            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>⭐ Premium User</Text>
              </View>
            )}

            <Ionicons name="person-circle-outline" size={60} color="#FFF" />
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={goToDesignAI}>
            <Ionicons name="color-palette" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Design with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={goToCustomizeAI}>
            <Ionicons name="construct-outline" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Customize</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={goToConsultation}>
            <Ionicons name="chatbubbles-outline" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Consultation</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Rooms / Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.horizontalCard}>
              <Image source={{ uri: room.image }} style={styles.cardImage} />
              <Text style={styles.cardText}>{room.name}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {aiSuggestion && (
          <View style={styles.activityCard}>
            <Ionicons name="sparkles-outline" size={28} color="#0F3E48" />
            <View>
              <Text style={styles.activityTitle}>AI Suggestion</Text>
              <Text style={styles.activityDesc}>{aiSuggestion}</Text>
            </View>
          </View>
        )}

        {activity.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.activityCard}
            onPress={() => {
              if (item.title.includes("Consultation") && !isPremium) {
                Alert.alert(
                  "Premium Feature",
                  "Please upgrade to view consultation.",
                  [
                    { text: "Cancel" },
                    { text: "Upgrade Now", onPress: () => router.push("/User/UpgradeInfo") },
                  ]
                );
                return;
              }
            }}
          >
            <Ionicons name={item.icon} size={28} color="#0F3E48" />
            <View>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityDesc}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

/* ======================== STYLES ======================== */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },
  hero: { height: 200, justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  heroContent: { padding: 20 },
  greet: { color: "#DDEFF2", fontSize: 18 },
  name: { color: "#FFF", fontSize: 30, fontWeight: "700", marginBottom: 10 },
  premiumBadge: { backgroundColor: "#FFD700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start", marginBottom: 10 },
  premiumText: { color: "#0F3E48", fontWeight: "700" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#0F3E48", marginTop: 25, marginLeft: 20, marginBottom: 10 },
  quickActions: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  actionCard: { width: 110, height: 110, backgroundColor: "#FFF", borderRadius: 14, justifyContent: "center", alignItems: "center", elevation: 3 },
  actionText: { marginTop: 5, fontWeight: "600", color: "#0F3E48", textAlign: "center" },
  horizontalCard: { width: 160, height: 140, backgroundColor: "#FFF", marginHorizontal: 10, borderRadius: 15, overflow: "hidden", elevation: 3 },
  cardImage: { width: "100%", height: 100 },
  cardText: { margin: 8, fontSize: 16, fontWeight: "600", color: "#0F3E48" },
  activityCard: { flexDirection: "row", backgroundColor: "#FFF", padding: 15, borderRadius: 14, marginHorizontal: 20, marginBottom: 12, elevation: 2, gap: 15 },
  activityTitle: { fontSize: 16, fontWeight: "700", color: "#0F3E48" },
  activityDesc: { fontSize: 13, color: "#4A6B70" },
});
