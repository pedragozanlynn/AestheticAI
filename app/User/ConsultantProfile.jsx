import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScheduleModal from "../components/ScheduleModal";

export default function ConsultantProfile() {
  const { consultantId } = useLocalSearchParams();
  const router = useRouter();
  const db = getFirestore();

  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  // Fetch consultant profile
  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        const ref = doc(db, "consultants", consultantId);
        const snap = await getDoc(ref);
        if (snap.exists()) setConsultant({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.log("Error fetching consultant:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultant();
  }, [consultantId]);

  // Fetch ratings
  useEffect(() => {
    if (!consultantId) return;

    const fetchRatings = async () => {
      setRatingsLoading(true);
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(
          ratingsRef,
          where("consultantId", "==", consultantId),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRatings(results);
      } catch (err) {
        console.log("Failed to fetch ratings:", err);
      } finally {
        setRatingsLoading(false);
      }
    };
    fetchRatings();
  }, [consultantId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!consultant) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>Consultant not found.</Text>
      </View>
    );
  }

  // Average rating
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  // Format timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Normalize availability for display
  const availabilitySlots = (() => {
    if (!consultant.availability) return [];
    if (Array.isArray(consultant.availability)) {
      // If array of strings, convert to objects
      if (consultant.availability.length > 0 && typeof consultant.availability[0] === "string") {
        return consultant.availability.map(day => ({ day }));
      }
      return consultant.availability;
    } else if (typeof consultant.availability === "object") {
      // If object, convert keys to array
      return Object.keys(consultant.availability).map(day => ({ day }));
    }
    return [];
  })();

  return (
    <ScrollView style={styles.page}>
      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#0F3E48" />
      </TouchableOpacity>

      {/* COVER PHOTO */}
      <View style={styles.coverPhoto} />

      {/* AVATAR & INFO */}
      <View style={styles.avatarContainer}>
        <Image
          source={
            consultant.avatar
              ? { uri: consultant.avatar }
              : consultant.gender === "female"
              ? require("../../assets/office-woman.png")
              : require("../../assets/office-man.png")
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{consultant.fullName}</Text>
        <Text style={styles.subText}>{consultant.specialization}</Text>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{consultant.consultantType}</Text>
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {ratings.length > 0 ? averageRating.toFixed(1) : "N/A"}
          </Text>
          <Text style={styles.statLabel}>Ratings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{consultant.experience ? "Yes" : "None"}</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{availabilitySlots.length}</Text>
          <Text style={styles.statLabel}>Schedules</Text>
        </View>
      </View>

      {/* INFO CARD */}
      <View style={styles.infoCard}>
        <Text style={styles.title}>Information</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>{consultant.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>{consultant.address || "Not provided"}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="school-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>{consultant.education || "Not provided"}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="briefcase-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>{consultant.experience || "Not provided"}</Text>
        </View>
        {consultant.consultantType === "Professional" && (
          <View style={styles.infoItem}>
            <Ionicons name="ribbon-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>
              {consultant.licenseNumber || "License not provided"}
            </Text>
          </View>
        )}

        {/* AVAILABILITY — DISPLAY DAY ONLY */}
        <Text style={[styles.title, { marginTop: 10 }]}>Availability</Text>
        {availabilitySlots.length > 0 ? (
          availabilitySlots.map((slot, idx) => (
            <View key={idx} style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>{slot.day}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noInfo}>No schedule provided.</Text>
        )}
      </View>

      {/* RATINGS / FEEDBACK */}
      <View style={styles.infoCard}>
        <Text style={styles.title}>User Feedback</Text>
        {ratingsLoading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : ratings.length === 0 ? (
          <Text style={styles.noInfo}>No ratings yet.</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= Math.floor(averageRating) ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={{ marginLeft: 8, fontWeight: "700", color: "#0F3E48" }}>
                {averageRating.toFixed(1)} / {ratings.length} reviews
              </Text>
            </View>

            {ratings.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Text style={styles.reviewName}>
                  {r.reviewerName?.trim() ? r.reviewerName : "Anonymous"}
                </Text>
                <Text style={styles.reviewDate}>{formatDate(r.timestamp)}</Text>
                <View style={{ flexDirection: "row", marginVertical: 6 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons
                      key={i}
                      name={i <= r.rating ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                {r.feedback?.trim() ? (
                  <Text style={styles.reviewText}>{r.feedback}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </View>

      {/* REQUEST CONSULTATION BUTTON */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => setScheduleVisible(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#FFF" />
        <Text style={styles.chatText}>Request Consultation</Text>
      </TouchableOpacity>

      <ScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
        consultantId={consultant.id}
        availability={availabilitySlots}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#F3F9FA" },
  backBtn: {
    marginTop: 40,
    marginLeft: 12,
    position: "absolute",
    zIndex: 10,
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 50,
  },
  coverPhoto: { width: "100%", height: 160, backgroundColor: "#BFD8CC" },
  avatarContainer: { alignItems: "center", marginTop: -50, paddingBottom: 10 },
  avatar: { width: 110, height: 110, borderRadius: 60, borderWidth: 4, borderColor: "#fff", backgroundColor: "#eee" },
  name: { fontSize: 22, fontWeight: "700", marginTop: 10, color: "#0F3E48" },
  subText: { fontSize: 16, color: "#5F7F85" },
  typeTag: { backgroundColor: "#4CAF50", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  typeText: { color: "#fff", fontWeight: "600" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15 },
  statBox: { backgroundColor: "#fff", width: 100, paddingVertical: 10, borderRadius: 10, alignItems: "center", elevation: 1 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#0F3E48" },
  statLabel: { fontSize: 12, color: "#777" },
  infoCard: { backgroundColor: "#fff", margin: 15, padding: 15, borderRadius: 15, elevation: 2 },
  title: { fontSize: 16, fontWeight: "700", color: "#0F3E48", marginBottom: 8 },
  infoItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  infoText: { fontSize: 15, color: "#333" },
  noInfo: { fontSize: 14, color: "#777" },
  chatBtn: { backgroundColor: "#0F3E48", margin: 20, padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  chatText: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  reviewName: { fontSize: 14, fontWeight: "700", color: "#0F3E48" },
  reviewDate: { fontSize: 11, color: "#777", marginTop: 2 },
  reviewText: { fontSize: 13, color: "#333", marginTop: 4, lineHeight: 18 },
  reviewCard: { backgroundColor: "#F7F7F7", padding: 10, borderRadius: 10, marginBottom: 10, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
});
