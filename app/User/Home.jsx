import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
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
const CARD_WIDTH = width * 0.7;
const PROFILE_KEY_PREFIX = "aestheticai:user-profile:";

/* ================= TIP OF THE DAY DATA ================= */

const DESIGN_INSPIRATIONS = [
  { title: "Warm Minimalism", tip: "Use neutral colors with natural wood to create a calm, cozy space." },
  { title: "Small Space Trick", tip: "Mirrors help small rooms feel bigger and brighter." },
  { title: "Color Balance", tip: "Stick to one main color and two supporting tones for harmony." },
  { title: "Lighting Matters", tip: "Layer lighting (ambient, task, accent) for a more premium feel." },
  { title: "Texture Upgrade", tip: "Mix textures like wood, fabric, and metal to add depth." },
];

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tipOfTheDay, setTipOfTheDay] = useState(null);
  const subType = useSubscriptionType();

  const scrollRef = useRef(null);
  const carouselIndex = useRef(0); // ✅ DOES NOT CAUSE RE-RENDER

  const carouselImages = [
    require("../../assets/carousel1.jpg"),
    require("../../assets/carousel2.jpg"),
    require("../../assets/carousel3.png"),
  ];

  /* ================= TIP OF THE DAY ================= */
  const loadTipOfTheDay = async () => {
    const todayKey = `tip-${new Date().toDateString()}`;
    const saved = await AsyncStorage.getItem(todayKey);

    if (saved) {
      setTipOfTheDay(JSON.parse(saved));
    } else {
      const index = new Date().getDate() % DESIGN_INSPIRATIONS.length;
      const tip = DESIGN_INSPIRATIONS[index];
      setTipOfTheDay(tip);
      await AsyncStorage.setItem(todayKey, JSON.stringify(tip));
    }
  };

  const isPremium = subType === "Premium";

  /* ================= AUTO CAROUSEL (FIX ONLY) ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      carouselIndex.current =
        (carouselIndex.current + 1) % carouselImages.length;

      scrollRef.current?.scrollTo({
        x: carouselIndex.current * (width - 32),
        animated: true,
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  /* ================= NAVIGATION ================= */
  const goToConsultations = () => {
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
    router.push("/User/Consultations");
  };

  const goToDesignAI = () => router.push("/User/Design");
  const goToCustomize = () => router.push("/User/Customize");
  const goToProjects = () => router.push("/User/Projects");

  useEffect(() => {
    /* ================= MOCK PROJECTS ================= */
    const fetchRooms = () => {
      setRooms([
        {
          id: "1",
          name: "Living Room",
          image: require("../../assets/livingroom.jpg"),
        },
        {
          id: "2",
          name: "Bedroom",
          image: require("../../assets/carousel2.jpg"),
        },
        {
          id: "3",
          name: "Workspace",
          image: require("../../assets/carousel3.png"),
        },
      ]);
    };

    /* ================= LOAD PROFILE ================= */
    const fetchProfile = async (user) => {
      try {
        const currentUser = user || auth.currentUser;
        if (!currentUser) return;
        const uid = currentUser.uid;

        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) return;

        const data = snap.data();
        setProfile(data);
        await AsyncStorage.setItem(
          `${PROFILE_KEY_PREFIX}${uid}`,
          JSON.stringify(data)
        );
      } catch (err) {
        console.log("Profile Load Error:", err);
      }
    };

    fetchRooms();
    loadTipOfTheDay();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProfile(user);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.greet}>Welcome back,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name}</Text>
            {isPremium && <Ionicons name="diamond" size={22} color="#FFD700" />}
          </View>
        </View>

        {/* ===== AUTO CAROUSEL ===== */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {carouselImages.map((img, i) => (
              <View key={i} style={styles.carouselCard}>
                <Image source={img} style={styles.carouselImage} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ===== QUICK ACTIONS ===== */}
        <View style={styles.quickActions}>
          <Action bg={styles.actionCardTeal} icon={require("../../assets/design.png")} label="Design with AI" onPress={goToDesignAI} />
          <Action bg={styles.actionCardPink} icon={require("../../assets/customize.png")} label="Customize with AI" onPress={goToCustomize} />
          <Action bg={styles.actionCardPurple} icon={require("../../assets/consultation.png")} label="Consultation" onPress={goToConsultations} />
        </View>

        {/* ===== TIP OF THE DAY ===== */}
        {tipOfTheDay && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tip of the Day</Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={18} color="#8f2f52" />
                <Text style={styles.tipTitle}>{tipOfTheDay.title}</Text>
              </View>
              <Text style={styles.tipText}>{tipOfTheDay.tip}</Text>
            </View>
          </>
        )}

        {/* ===== RECENT PROJECTS ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectsRow}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.projectCard}>
              <Image source={room.image} style={styles.projectImage} />
              <View style={styles.projectOverlay}>
                <Ionicons name="sparkles-outline" size={16} color="#FFD700" />
                <Text style={styles.projectText}>{room.name}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={[styles.projectCard, styles.viewAllCard]} onPress={goToProjects}>
            <Ionicons name="grid" size={28} color="#2c4f4f" />
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

/* ================= SMALL COMPONENT ================= */
const Action = ({ bg, icon, label, onPress }) => (
  <TouchableOpacity style={[styles.actionCard, bg]} onPress={onPress}>
    <Image source={icon} style={styles.actionIcon} />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },
  header: {
    backgroundColor: "#01579B",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  greet: { color: "#FFF", fontSize: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#FFF", fontSize: 28, fontWeight: "700" },

  carouselWrap: { height: 200, marginTop: -60 },
  carouselCard: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  carouselImage: { width: "100%", height: "100%" },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: -40,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    margin: 6,
    height: 110,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardTeal: { backgroundColor: "#e0f7fa" },
  actionCardPink: { backgroundColor: "#fce4ec" },
  actionCardPurple: { backgroundColor: "#ede7f6" },
  actionIcon: { width: 36, height: 36, marginBottom: 6 },
  actionText: { fontWeight: "900", fontSize: 11 },

  sectionHeader: { marginHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2c4f4f", marginTop: -10, },
  tipCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 30,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#8f2f52",
    elevation: 2,
    marginLeft: 20,
    marginRight: 20,

  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  tipTitle: { fontSize: 15, fontWeight: "800", color: "#8f2f52" },
  tipText: { fontSize: 13, color: "#444", lineHeight: 18 },

  projectsRow: { paddingLeft: 16, paddingBottom: 80 },
  projectCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 16,
  },
  projectImage: { width: "100%", height: "100%" },
  projectOverlay: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    gap: 6,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  projectText: { color: "#FFF", fontWeight: "700" },

  viewAllCard: {
    backgroundColor: "#e6f0ee",
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllText: { marginTop: 6, fontWeight: "800", color: "#2c4f4f" },
});
