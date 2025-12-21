import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

const { width } = Dimensions.get("window");
const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activity, setActivity] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const subType = useSubscriptionType();
  const scrollRef = useRef(null);

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
      await AsyncStorage.setItem(`${PROFILE_KEY_PREFIX}${uid}`, JSON.stringify(data));
    } catch (err) {
      console.log("Profile Load Error:", err);
      Alert.alert("Error", "Unable to load profile.");
    }
  };

  const fetchRooms = () => {
    setRooms([
      { 
        id: "1", 
        name: "Living Room", 
        image: require("../../assets/livingroom.jpg"), // ✅ only the path here
        date: "2025-12-20" // put date as its own property
      },
    ]);
  };
  

  const fetchActivity = () => {
    setActivity([
      { id: "a1", icon: "image-outline", title: "Generated New Design", subtitle: "AI Interior Suggestion" },
      { id: "a2", icon: "chatbubble-ellipses-outline", title: "Consultation Sent", subtitle: "Pending approval" },
    ]);
  };

  const getAISuggestion = () => {
    setAiSuggestion("Try a Scandinavian minimalistic theme for your workspace.");
  };

  const isPremium = subType === "Premium";

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

  useEffect(() => {
    loadProfile();
    fetchRooms();
    fetchActivity();
    getAISuggestion();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => (prevIndex + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: carouselIndex * width, animated: true });
  }, [carouselIndex]);

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ✅ HEADER */}
        <View style={styles.header}>
          <Text style={styles.greet}>Welcome back,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name}</Text>
            {isPremium && (
              <Ionicons name="diamond" size={22} color="#FFD700" style={styles.premiumIcon} />
            )}
          </View>
        </View>

        {/* ✅ CAROUSEL */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCarouselIndex(index);
            }}
          >
            {[
              require("../../assets/carousel1.jpg"),
              require("../../assets/carousel2.jpg"),
              require("../../assets/carousel3.png"),
            ].map((img, idx) => (
              <View key={idx} style={styles.carouselCard}>
                <Image source={img} style={styles.carouselImage} />
              </View>
            ))}
          </ScrollView>

          <View style={styles.dotsWrap}>
            {[0, 1, 2].map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, { opacity: carouselIndex === idx ? 1 : 0.3 }]}
              />
            ))}
          </View>
        </View>

        {/* ✅ QUICK ACTIONS (Top row only) */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionCard, styles.actionCardTeal]} onPress={goToDesignAI} activeOpacity={0.8}>
            <Image source={require("../../assets/design.png")} style={styles.actionIcon} />
            <Text style={styles.actionText}>Design with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, styles.actionCardPink]} onPress={goToCustomizeAI} activeOpacity={0.8}>
            <Image source={require("../../assets/customize.png")} style={styles.actionIcon} />
            <Text style={styles.actionText}>Customize with AI</Text>
          </TouchableOpacity>
        </View>
      {/* ✅ Consultation moved below Projects */}
      <View style={styles.consultationWrap}>
          <TouchableOpacity style={[styles.actionCard, styles.actionCardPurple]} onPress={goToConsultation} activeOpacity={0.8}>
            <Image source={require("../../assets/consultation.png")} style={styles.actionIcon} />
            <Text style={styles.actionText}>Consultation</Text>
          </TouchableOpacity>
        </View>
        {/* ✅ PROJECTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Projects</Text>
          <TouchableOpacity onPress={goToProjects}>
            <Ionicons name="arrow-forward-outline" size={30} color="#3fa796" />
          </TouchableOpacity>
        </View>

        <View style={styles.projectsList}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.projectCard}>
              <Image
                source={typeof room.image === "string" ? { uri: room.image } : room.image}
                style={styles.projectImage}
              />
              <View style={styles.projectOverlay}>
                <Ionicons name="sparkles-outline" size={16} color="#FFD700" />
                <Text style={styles.projectText}>{room.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNavbar subType={subType} />
    </View>
  );
}

/* ======================== STYLES ======================== */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },

  header: {
    backgroundColor: "#01579B", // ocean blue
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 90,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 1,
  },
  greet: { color: "#FFF", fontSize: 18, marginBottom: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  premiumIcon: { marginLeft: 1 },
  name: { color: "#FFF", fontSize: 28, fontWeight: "700", marginBottom: 0 },

  // ✅ Quick Actions (top row only)
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: -40,
    marginBottom: 20,
    zIndex: 3,
  },
  actionCard: {
    width: 150,
    height: 110,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
  },

  // ✅ Colored variants for Quick Actions
  actionCardTeal: { backgroundColor: "#e0f7fa" },   // soft teal
  actionCardPink: { backgroundColor: "#fce4ec" },   // soft pink
  actionCardPurple: { backgroundColor: "#ede7f6" }, // soft lavender

  actionIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginBottom: 6,
  },
  actionText: {
    fontWeight: "600",
    color: "#0F3E48",
    textAlign: "center",
    fontSize: 13,
  },

  // ✅ Consultation wrapper at bottom
  consultationWrap: {
    alignItems: "center",
    marginBottom: 5,
  },

  // ✅ CAROUSEL
  carouselWrap: {
    height: 200,
    position: "relative",
    top: -60,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  carouselCard: {
    width: width - 32,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 16,
    backgroundColor: "#912f56",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dotsWrap: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    width: "100%",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#912f56" },

  // ✅ SECTION HEADER
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#912f56",
        letterSpacing: 0.5,
  },

  // ✅ PROJECTS LIST
  projectsList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  projectCard: {
    width: "100%",
    height: 180,
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  projectImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  projectOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  projectText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
