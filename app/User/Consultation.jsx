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
import NotificationBell from "../components/NotificationBell";

export default function Consultation() {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [consultants, setConsultants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const subType = useSubscriptionType();
  const [user, setUser] = useState(null);

  // Load logged-in user for notification bell
  useEffect(() => {
    const loadUser = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find(k => k.startsWith("aestheticai:user-profile:"));
      if (!profileKey) return;
      const data = await AsyncStorage.getItem(profileKey);
      setUser(JSON.parse(data));
    };
    loadUser();
  }, []);

  const categories = [
    "All",
    "Architect",
    "Structural Engineer",
    "Electrical Engineer",
    "Interior Designer",
    "Plumber",
    "Contractor",
    "Materials Expert",
  ];

  // Fetch consultants and ratings summary
  useEffect(() => {
    const fetchConsultantsAndRatings = async () => {
      // 1️⃣ Fetch accepted consultants
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

      // 2️⃣ Fetch all ratings in one query
      const ratingsSnap = await getDocs(collection(db, "ratings"));
      const ratingsByConsultant = {};
      ratingsSnap.docs.forEach(doc => {
        const r = doc.data();
        if (!ratingsByConsultant[r.consultantId]) {
          ratingsByConsultant[r.consultantId] = [];
        }
        ratingsByConsultant[r.consultantId].push(r.rating);
      });

      // 3️⃣ Merge ratings summary into consultants
      const consultantsWithRatings = tempConsultants.map(c => {
        const ratings = ratingsByConsultant[c.id] || [];
        const count = ratings.length;
        const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
        return { ...c, reviewCount: count, averageRating: avg };
      });

      setConsultants(consultantsWithRatings);

      // 4️⃣ Optional: Listen for real-time rating updates
      const unsubscribeRatings = onSnapshot(collection(db, "ratings"), snapshot => {
        const updatedRatings = {};
        snapshot.docs.forEach(doc => {
          const r = doc.data();
          if (!updatedRatings[r.consultantId]) updatedRatings[r.consultantId] = [];
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
      });

      return unsubscribeRatings;
    };

    const unsubPromise = fetchConsultantsAndRatings();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const filteredConsultants = consultants
    .filter(c => selectedCategory === "All" || c.consultantType === selectedCategory)
    .filter(c => c.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.page}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{showHistory ? "Chat History" : "Consultants"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <NotificationBell
            userId={user?.uid}
            onPress={() => router.push("/User/NotificationList")}
          />
          <TouchableOpacity
            onPress={() => router.push("/User/ChatList")}
            style={styles.iconButton}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color="#0F3E48" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowHistory(false)}
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons name="people-outline" size={26} color="#0F3E48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      {!showHistory && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#AAA" />
          <TextInput
            placeholder="Search Consultant..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* CATEGORY FILTER */}
      {!showHistory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* CONSULTANTS LIST */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 70 }}>
        {!showHistory && (
          <>
            <Text style={styles.subTitle}>Available Consultants</Text>
            {filteredConsultants.length > 0 ? (
              filteredConsultants.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.consultantCard}
                  onPress={() => router.push(`/User/ConsultantProfile?consultantId=${c.id}`)}
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
                    <Text style={styles.consultantName}>{c.fullName}</Text>
                    <Text style={styles.consultantTitle}>{c.consultantType}</Text>
                    <Text style={styles.consultantBio}>{c.specialization || "No specialization"}</Text>

                    {/* ⭐ Average Rating + Numeric + Review Count */}
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
          </>
        )}
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA", paddingTop: 50, paddingHorizontal: 15 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { fontSize: 26, fontWeight: "700", color: "#0F3E48" },
  iconButton: { padding: 6, borderRadius: 50, backgroundColor: "#FFF", elevation: 3 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 10, marginBottom: 10, height: 45, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#0F3E48" },
  filterContainer: { flexDirection: "row", backgroundColor: "#E8EEF0", borderRadius: 12, padding: 5, marginBottom: 15 },
  filterChip: { width: 130, height: 36, borderRadius: 10, marginRight: 6, justifyContent: "center", alignItems: "center", backgroundColor: "#E5E5EA" },
  filterChipActive: { backgroundColor: "#0F3E48" },
  filterText: { fontSize: 14, color: "#333" },
  filterTextActive: { color: "#FFFFFF" },
  subTitle: { fontSize: 18, fontWeight: "600", color: "#0F3E48", marginVertical: 10 },
  consultantCard: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 14, padding: 12, marginBottom: 12, elevation: 2, alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 30 },
  consultantName: { fontSize: 17, fontWeight: "700", color: "#0F3E48" },
  consultantTitle: { fontSize: 13, color: "#4A6B70", marginTop: 2 },
  consultantBio: { fontSize: 12, color: "#777", marginTop: 2 },
  noResults: { color: "#AAA", marginTop: 15, textAlign: "center", fontStyle: "italic" },
});
