import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
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
import { db } from "../../config/firebase";
import ScheduleModal from "../components/ScheduleModal";

const ICON_COLOR = "#2c4f4f";

export default function ConsultantProfile() {
  const { consultantId } = useLocalSearchParams();
  const router = useRouter();

  const [consultant, setConsultant] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  /* ================= FETCH CONSULTANT ================= */
  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        const snap = await getDoc(doc(db, "consultants", consultantId));
        if (snap.exists()) {
          setConsultant({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.log("Consultant fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultant();
  }, [consultantId]);

  /* ================= FETCH RATINGS ================= */
  useEffect(() => {
    if (!consultantId) return;

    const fetchRatings = async () => {
      setRatingsLoading(true);
      try {
        const q = query(
          collection(db, "ratings"),
          where("consultantId", "==", consultantId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setRatings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.log("Ratings fetch error:", e);
      } finally {
        setRatingsLoading(false);
      }
    };

    fetchRatings();
  }, [consultantId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ICON_COLOR} />
      </View>
    );
  }

  if (!consultant) {
    return (
      <View style={styles.center}>
        <Text>Consultant not found</Text>
      </View>
    );
  }

  const availability = Array.isArray(consultant.availability)
    ? consultant.availability
    : [];

  const avgRating =
    ratings.length > 0
      ? (
          ratings.reduce((sum, r) => sum + (r.rating || 0), 0) /
          ratings.length
        ).toFixed(1)
      : "—";

  return (
    <ScrollView style={styles.page}>
      {/* BACK */}
      <TouchableOpacity style={styles.backBtn} onPress={router.back}>
        <Ionicons name="arrow-back" size={26} color= "#ffff" />
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={
            consultant.avatar
              ? { uri: consultant.avatar }
              : consultant.gender === "Female"
              ? require("../../assets/office-woman.png")
              : require("../../assets/office-man.png")
          }
          style={styles.avatar}
        />

        <Text style={styles.headerTitle}>{consultant.fullName}</Text>
        <Text style={styles.headerSubtitle}>{consultant.specialization}</Text>

        <View style={styles.headerStats}>
          <Stat label="Rating" value={avgRating} />
          <Stat label="Reviews" value={ratings.length} />
          <Stat label="Schedules" value={availability.length} />
        </View>
      </View>

      <View style={styles.content}>
        {/* INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.section}>Information</Text>

          <InfoRow icon="person" label="Full Name" value={consultant.fullName} />
          <InfoRow icon="mail" label="Email" value={consultant.email} />
          <InfoRow icon="home" label="Address" value={consultant.address} />
          <InfoRow icon="male-female" label="Gender" value={consultant.gender} />
          <InfoRow
            icon="briefcase"
            label="Type"
            value={consultant.consultantType}
          />
          <InfoRow
            icon="construct"
            label="Specialization"
            value={consultant.specialization}
          />
          <InfoRow
            icon="school"
            label="Education"
            value={consultant.education || "Not provided"}
          />

          {consultant.experience && (
            <InfoRow
              icon="time"
              label="Experience"
              value={`${consultant.experience} years`}
            />
          )}

          {consultant.licenseNumber && (
            <InfoRow
              icon="card"
              label="License Number"
              value={consultant.licenseNumber}
            />
          )}
        </View>

        {/* AVAILABILITY */}
        <View style={styles.card}>
          <Text style={styles.section}>Availability</Text>
          {availability.length > 0 ? (
            availability.map((day, i) => (
              <InfoRow key={i} icon="calendar" label="Day" value={day} />
            ))
          ) : (
            <Text style={styles.value}>Not specified</Text>
          )}
        </View>

        {/* RATINGS */}
        <View style={styles.card}>
          <Text style={styles.section}>User Feedback</Text>

          {ratingsLoading ? (
            <ActivityIndicator />
          ) : ratings.length === 0 ? (
            <Text style={styles.muted}>No ratings yet</Text>
          ) : (
            ratings.map((r) => (
              <View key={r.id} style={styles.review}>
                <Text style={styles.reviewName}>
                  {r.reviewerName || "Anonymous"}
                </Text>
                <Text style={styles.reviewDate}>
                  {r.createdAt?.toDate?.().toDateString()}
                </Text>

                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons
                      key={i}
                      name={i <= r.rating ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>

                {!!r.feedback && (
                  <Text style={styles.reviewText}>{r.feedback}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* ACTION */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => setScheduleVisible(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color="#fff"
          />
          <Text style={styles.ctaText}>Request Consultation</Text>
        </TouchableOpacity>
      </View>

      <ScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
        consultantId={consultant.id}
        availability={availability}
      />
    </ScrollView>
  );
}

/* ================= SMALL COMPONENTS ================= */

const Stat = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={ICON_COLOR} style={styles.icon} />
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: { backgroundColor: "#fff" },

  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },

  header: {
    backgroundColor: "#C48AA0",
    paddingTop: 70,
    paddingBottom: 20,
    alignItems: "center",
  },
  avatar: {
    marginTop: -10,
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 6,
  },
  headerSubtitle: {
    color: "#f5f5f5",
    marginBottom: 12,
  },

  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 30,
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 12, color: "#f5f5f5" },

  content: {
    paddingHorizontal: 32,
    paddingTop: 32,
    marginTop: -10,
    backgroundColor: "#faf9f6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F3E48",
    marginBottom: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { marginRight: 8 },
  label: { fontSize: 14, color: "#666", flex: 1 },
  value: { fontSize: 14, color: "#4A4A4A", flex: 1, textAlign: "right" },

  muted: { color: "#777", fontStyle: "italic" },

  review: {
    backgroundColor: "#F7F7F7",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  reviewName: { fontWeight: "700" },
  reviewDate: { fontSize: 11, color: "#777" },
  stars: { flexDirection: "row", marginVertical: 4 },
  reviewText: { color: "#333", marginTop: 4 },

  cta: {
    backgroundColor: "#3fa796",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
