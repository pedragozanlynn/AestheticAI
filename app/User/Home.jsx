import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [nextConsultation, setNextConsultation] = useState(null);
  const subType = useSubscriptionType();
  const scrollRef = useRef(null);

  /* ================= LOAD PROFILE ================= */
  const loadProfile = async () => {
    try {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
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

  /* ================= CONSULTATION PREVIEW ================= */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("date", "asc")
    );

    return onSnapshot(q, (snap) => {
      const parsed = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNextConsultation(parsed[0] || null);
    });
  }, []);

  const isPremium = subType === "Premium";

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
    loadProfile();
    fetchRooms();
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

        {/* ===== CAROUSEL ===== */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {[
              require("../../assets/carousel1.jpg"),
              require("../../assets/carousel2.jpg"),
              require("../../assets/carousel3.png"),
            ].map((img, i) => (
              <View key={i} style={styles.carouselCard}>
                <Image source={img} style={styles.carouselImage} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ===== QUICK ACTIONS (RESTORED) ===== */}
        <View style={styles.quickActions}>
          <Action
            bg={styles.actionCardTeal}
            icon={require("../../assets/design.png")}
            label="Design with AI"
            onPress={goToDesignAI}
          />
          <Action
            bg={styles.actionCardPink}
            icon={require("../../assets/customize.png")}
            label="Customize"
            onPress={goToCustomize}
          />
          <Action
            bg={styles.actionCardPurple}
            icon={require("../../assets/consultation.png")}
            label="Consultation"
            onPress={goToConsultations}
          />
        </View>

        {/* ===== CONSULTATION PREVIEW ===== */}
        {nextConsultation && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Consultation</Text>
            </View>

            <View style={styles.consultPreview}>
              <View>
                <Text style={styles.consultTitle}>Upcoming Consultation</Text>
                <Text style={styles.consultSub}>
                  {nextConsultation.date} @ {nextConsultation.time}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.consultBtn}
                onPress={goToConsultations}
              >
                <Text style={styles.consultBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ===== RECENT PROJECTS (HORIZONTAL) ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.projectsRow}
        >
          {rooms.map((room) => (
            <View key={room.id} style={styles.projectCard}>
              <Image source={room.image} style={styles.projectImage} />
              <View style={styles.projectOverlay}>
                <Ionicons name="sparkles-outline" size={16} color="#FFD700" />
                <Text style={styles.projectText}>{room.name}</Text>
              </View>
            </View>
          ))}

          {/* VIEW ALL */}
          <TouchableOpacity
            style={[styles.projectCard, styles.viewAllCard]}
            onPress={goToProjects}
          >
            <Ionicons name="grid-outline" size={28} color="#2c4f4f" />
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },

  header: {
    backgroundColor: "#01579B",
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 90,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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

  /* QUICK ACTIONS */
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
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#2c4f4f" },

  consultPreview: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  /* PROJECTS */
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
