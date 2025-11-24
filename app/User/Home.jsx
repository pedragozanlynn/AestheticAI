import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ImageBackground,
  Image,
} from "react-native";
import { auth } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import { Ionicons } from "@expo/vector-icons";

const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Home() {
  const router = useRouter();

  // ==========================================================
  // STATE
  // ==========================================================
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activity, setActivity] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================
  const loadProfile = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Not Logged In", "Please login first.");
        router.replace("/User/Login");
        return;
      }

      const savedProfile = await AsyncStorage.getItem(
        `${PROFILE_KEY_PREFIX}${auth.currentUser.uid}`
      );

      if (!savedProfile) {
        Alert.alert("No Profile", "Please login again.");
        router.replace("/User/Login");
        return;
      }

      setProfile(JSON.parse(savedProfile));
    } catch (error) {
      console.log("Profile Load Error:", error);
      Alert.alert("Error", "Unable to load profile.");
    }
  };

  // ==========================================================
  // MOCK FETCH ROOMS
  // ==========================================================
  const fetchRooms = async () => {
    setRooms([
      { id: "1", name: "Living Room", image: "https://i.imgur.com/F9S5K9K.jpeg" },
      { id: "2", name: "Bedroom", image: "https://i.imgur.com/2sOeMyl.jpeg" },
      { id: "3", name: "Workspace", image: "https://i.imgur.com/eGXyZQF.jpeg" },
    ]);
  };

  // ==========================================================
  // RECENT ACTIVITY
  // ==========================================================
  const fetchActivity = async () => {
    setActivity([
      {
        id: "a1",
        icon: "image-outline",
        title: "Generated New Design",
        subtitle: "AI Interior Style Suggestion",
      },
      {
        id: "a2",
        icon: "chatbubble-ellipses-outline",
        title: "Consultation Sent",
        subtitle: "Pending approval",
      },
    ]);
  };

  // ==========================================================
  // AI SUGGESTION
  // ==========================================================
  const getAISuggestion = async () => {
    setAiSuggestion(
      "Try a Scandinavian minimalistic theme for your workspace."
    );
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================
  const goToDesignAI = () => router.push("/user/AIDesigner");
  const goToCustomizeAI = () => router.push("/user/AIDesigner"); // replace with separate route if available
  const goToConsultation = () => router.push("/user/Consultation");
  const goToProjects = () => router.push("/user/Projects");

  // ==========================================================
  // LOGOUT
  // ==========================================================
  const logout = async () => {
    try {
      await AsyncStorage.clear();
      await auth.signOut();
      router.replace("/User/Login");
    } catch (error) {
      Alert.alert("Error", "Logout failed.");
    }
  };

  // ==========================================================
  // INIT LOAD
  // ==========================================================
  useEffect(() => {
    loadProfile();
    fetchRooms();
    fetchActivity();
    getAISuggestion();
  }, []);

  // ==========================================================
  // LOADING
  // ==========================================================
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <ImageBackground
          source={{ uri: "https://i.imgur.com/HSm6Jcs.jpeg" }}
          style={styles.hero}
        >
          <View style={styles.overlay} />
          <View style={styles.heroContent}>
            <Text style={styles.greet}>Welcome back,</Text>
            <Text style={styles.name}>{profile.name}</Text>
            <Ionicons name="person-circle-outline" size={60} color="#FFF" />
          </View>
        </ImageBackground>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {/* Design with AI */}
          <TouchableOpacity style={styles.actionCard} onPress={goToDesignAI}>
            <Ionicons name="color-palette" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Design with AI</Text>
          </TouchableOpacity>

          {/* Customize with AI */}
          <TouchableOpacity style={styles.actionCard} onPress={goToCustomizeAI}>
            <Ionicons name="construct-outline" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Customize with AI</Text>
          </TouchableOpacity>

          {/* Consultation */}
          <TouchableOpacity style={styles.actionCard} onPress={goToConsultation}>
            <Ionicons name="chatbubbles-outline" size={30} color="#0F3E48" />
            <Text style={styles.actionText}>Consultation</Text>
          </TouchableOpacity>
        </View>

        {/* ROOMS */}
        <Text style={styles.sectionTitle}>Your Rooms / Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.horizontalCard}>
              <Image source={{ uri: room.image }} style={styles.cardImage} />
              <Text style={styles.cardText}>{room.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* RECENT ACTIVITY */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <View style={styles.activityCard}>
            <Ionicons name="sparkles-outline" size={28} color="#0F3E48" />
            <View>
              <Text style={styles.activityTitle}>AI Suggestion</Text>
              <Text style={styles.activityDesc}>{aiSuggestion}</Text>
            </View>
          </View>
        )}

        {/* Other Activity */}
        {activity.map((item) => (
          <View key={item.id} style={styles.activityCard}>
            <Ionicons name={item.icon} size={28} color="#0F3E48" />
            <View>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityDesc}>{item.subtitle}</Text>
            </View>
          </View>
        ))}

      </ScrollView>

      <BottomNavbar consultationNotifications={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
  },
  hero: {
    height: 200,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    padding: 20,
  },
  greet: {
    color: "#DDEFF2",
    fontSize: 18,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#0F3E48",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0F3E48",
    marginTop: 25,
    marginLeft: 20,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  actionCard: {
    width: 110,
    height: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  actionText: {
    marginTop: 5,
    fontWeight: "600",
    color: "#0F3E48",
    textAlign: "center",
  },
  horizontalCard: {
    width: 160,
    height: 140,
    backgroundColor: "#FFF",
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardText: {
    margin: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F3E48",
  },
  activityCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    gap: 15,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F3E48",
  },
  activityDesc: {
    fontSize: 13,
    color: "#4A6B70",
  },
});
