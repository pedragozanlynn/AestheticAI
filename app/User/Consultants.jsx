import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

const safeLower = (val) =>
  typeof val === "string" ? val.toLowerCase() : "";

export default function Consultation() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [consultants, setConsultants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const subType = useSubscriptionType();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find(k =>
        k.startsWith("aestheticai:user-profile:")
      );
      if (!profileKey) return;
      const data = await AsyncStorage.getItem(profileKey);
      setUser(JSON.parse(data));
    };
    loadUser();
  }, []);

  const categories = [
    "All",
    "Architecture",
    "Interior Design",
    "Civil Engineering",
    "Structural Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Sanitary / Plumbing Engineering",
    "Landscape Architecture",
    "Construction Management",
  ];

  useEffect(() => {
    const fetchConsultantsAndRatings = async () => {
      const consultantsQuery = query(
        collection(db, "consultants"),
        where("status", "==", "accepted")
      );

      const consultantsSnap = await getDocs(consultantsQuery);
      const tempConsultants = consultantsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        averageRating: 0,
        reviewCount: 0,
      }));

      const ratingsSnap = await getDocs(collection(db, "ratings"));
      const ratingsByConsultant = {};

      ratingsSnap.docs.forEach(doc => {
        const r = doc.data();
        if (!ratingsByConsultant[r.consultantId]) {
          ratingsByConsultant[r.consultantId] = [];
        }
        ratingsByConsultant[r.consultantId].push(r.rating);
      });

      const consultantsWithRatings = tempConsultants.map(c => {
        const ratings = ratingsByConsultant[c.id] || [];
        const count = ratings.length;
        const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
        return { ...c, reviewCount: count, averageRating: avg };
      });

      setConsultants(consultantsWithRatings);

      const unsubscribeRatings = onSnapshot(
        collection(db, "ratings"),
        snapshot => {
          const updatedRatings = {};
          snapshot.docs.forEach(doc => {
            const r = doc.data();
            if (!updatedRatings[r.consultantId]) {
              updatedRatings[r.consultantId] = [];
            }
            updatedRatings[r.consultantId].push(r.rating);
          });

          setConsultants(prev =>
            prev.map(c => {
              const ratings = updatedRatings[c.id] || [];
              const count = ratings.length;
              const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
              return { ...c, reviewCount: count, averageRating: avg };
            })
          );
        }
      );

      return unsubscribeRatings;
    };

    const unsubPromise = fetchConsultantsAndRatings();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const filteredConsultants = consultants
    .filter(c => {
      if (selectedCategory === "All") return true;
      const typeMatch =
        safeLower(c.consultantType) === safeLower(selectedCategory);
      const specializationMatch =
        safeLower(c.specialization) === safeLower(selectedCategory);
      return typeMatch || specializationMatch;
    })
    .filter(c =>
      safeLower(c.fullName).includes(safeLower(searchQuery))
    );

  return (
    <View style={styles.page}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse consultants</Text>
        <Text style={styles.headerSubtitle}>Connect with trusted experts in every field </Text>

        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#AAA" />
          <TextInput
            placeholder="Search by name or skill..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 🧠 Category Chips outside header */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ✅ Consultant List */}
      <ScrollView style={styles.consultantList}>
        {filteredConsultants.length > 0 ? (
          filteredConsultants.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.consultantCard}
              onPress={() => {
                if (!c?.id) return;
                router.push(`/User/ConsultantProfile?consultantId=${c.id}`);
              }}
            >
              <Image
                source={
                  c.avatar
                    ? { uri: c.avatar }
                    : c.gender === "female"
                    ? require("../../assets/office-woman.png")
                    : require("../../assets/office-man.png")
                }
                style={styles.avatar}
              />

              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.consultantName}>
                  {c.fullName || "Unnamed Consultant"}
                </Text>
                <Text style={styles.consultantTitle}>
                  {c.consultantType || "Consultant"}
                </Text>
                <Text style={styles.consultantBio}>
                  {c.specialization || "No specialization"}
                </Text>

                <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= Math.floor(c.averageRating) ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={{ marginLeft: 6, fontSize: 12, color: "#555" }}>
                    ({c.averageRating.toFixed(1)} / {c.reviewCount} reviews)
                  </Text>
                </View>
              </View>

              <Ionicons name="chatbubble-outline" size={24} color="#0F3E48" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResults}>No accepted consultants yet.</Text>
        )}
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
  },

  // Header
  header: {
    backgroundColor: "#01579B", // ocean blue
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
    textAlign: "left",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E1F5FE", // light sky blue
    marginBottom: 18,
    textAlign: "left",
    letterSpacing: 0.5,
  },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 48,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0F3E48",
  },

  // Category bar
  categoryBar: {
    backgroundColor: "#f5f7f8", // light ocean blue background
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#BBDEFB",
  },
  categoryScroll: {
    flexDirection: "row",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#faf9f6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  categoryChipActive: {
    backgroundColor: "#912f56",  },
  categoryText: {
    fontSize: 14,
    color: "#912f56",    fontWeight: "500",
  },
  categoryTextActive: {
    fontWeight: "700",
    color: "#FFF",
  },

  // Consultant list
  consultantList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 80,
  },
  consultantCard: {
    flexDirection: "row",
    backgroundColor: "#faf9f6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#0288D1", // ocean blue accent strip
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#81D4FA", 
    backgroundColor: "#912f56",
    shadowColor: "#0288D1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F5FE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  chatButton: {
    backgroundColor: "#0288D1",
    borderRadius: 25,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  

  noResults: {
    color: "#AAA",
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});
