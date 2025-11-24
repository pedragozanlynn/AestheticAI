import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
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
import BottomNavbar from "../components/BottomNav";

// ✅ ADD THIS
import NotificationBell from "../components/NotificationBell";

export default function Consultation() {
  const router = useRouter();

  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [consultants, setConsultants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ LOAD LOGGED-IN USER FOR NOTIFICATION BELL
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find((k) =>
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
    "Architect",
    "Structural Engineer",
    "Electrical Engineer",
    "Interior Designer",
    "Plumber",
    "Contractor",
    "Materials Expert",
  ];

  // ⭐ FETCH ACCEPTED CONSULTANTS + RATINGS
  useEffect(() => {
    const q = query(
      collection(db, "consultants"),
      where("status", "==", "accepted")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const list = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // ⭐ Fetch subcollection ratings
        const ratingsRef = collection(db, "consultants", docSnap.id, "ratings");
        const ratingsSnap = await getDocs(ratingsRef);

        let avgRating = 0;
        if (!ratingsSnap.empty) {
          const allRatings = ratingsSnap.docs.map((r) => r.data().rating);
          avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }

        list.push({
          id: docSnap.id,
          ...data,
          averageRating: avgRating,
        });
      }

      setConsultants(list);
    });

    return () => unsub();
  }, []);

  // 🔎 Filtering
  const filteredConsultants = consultants
    .filter((c) =>
      selectedCategory === "All" ? true : c.consultantType === selectedCategory
    )
    .filter((c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const startChat = (id) => {
    router.push(`/User/ConsultationChat?consultantId=${id}&chatId=new`);
  };

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {showHistory ? "Chat History" : "Consultants"}
        </Text>

        {/* UPDATED ICONS */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <NotificationBell
            userId={user?.uid}
            onPress={() => router.push("/User/NotificationList")}
          />

<TouchableOpacity
  onPress={() => router.push("/User/ChatList")}
  style={styles.iconButton}
>
  <Ionicons
    name="chatbubble-ellipses-outline"
    size={26}
    color="#0F3E48"
  />
</TouchableOpacity>


          {/* ✔ PEOPLE ICON → ALWAYS GO BACK TO CONSULTANTS */}
          <TouchableOpacity
            onPress={() => setShowHistory(false)}
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons
              name="people-outline"
              size={26}
              color="#0F3E48"
            />
          </TouchableOpacity>
        </View>
      </View>

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

      {!showHistory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 70 }}>
        {!showHistory && (
          <>
            <Text style={styles.subTitle}>Available Consultants</Text>

            {filteredConsultants.length > 0 ? (
              filteredConsultants.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.consultantCard}
                  onPress={() =>
                    router.push(`/User/ConsultantProfile?consultantId=${c.id}`)
                  }
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
                    <Text style={styles.consultantTitle}>
                      {c.consultantType}
                    </Text>
                    <Text style={styles.consultantBio}>
                      {c.specialization || "No specialization"}
                    </Text>

                    {/* ⭐ Rating Stars */}
                    <View style={{ flexDirection: "row", marginTop: 6 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons
                          key={i}
                          name={i <= Math.round(c.averageRating) ? "star" : "star-outline"}
                          size={16}
                          color="#FFD700"
                          style={{ marginRight: 2 }}
                        />
                      ))}
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

      <BottomNavbar consultationNotifications={0} />
    </View>
  );
}

// KEEP YOUR STYLES BELOW
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    paddingTop: 50,
    paddingHorizontal: 15,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F3E48",
  },

  iconButton: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: "#FFF",
    elevation: 3,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 45,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#0F3E48",
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#E8EEF0",
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
  },

  filterChip: {
    width: 130,
    height: 36,
    borderRadius: 10,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E5EA",
  },

  filterChipActive: {
    backgroundColor: "#0F3E48",
  },

  filterText: {
    fontSize: 14,
    color: "#333",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F3E48",
    marginVertical: 10,
  },

  consultantCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    alignItems: "center",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 30,
  },

  consultantName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F3E48",
  },

  consultantTitle: {
    fontSize: 13,
    color: "#4A6B70",
    marginTop: 2,
  },

  consultantBio: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  noResults: {
    color: "#AAA",
    marginTop: 15,
    textAlign: "center",
    fontStyle: "italic",
  },
});
