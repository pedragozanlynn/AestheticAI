import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, getFirestore } from "firebase/firestore";
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
import ScheduleModal from "../components/ScheduleModal"; // ✅ ADDED

export default function ConsultantProfile() {
  const { consultantId } = useLocalSearchParams();
  const router = useRouter();
  const db = getFirestore();

  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  const [scheduleVisible, setScheduleVisible] = useState(false); // ✅ ADDED

  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        const ref = doc(db, "consultants", consultantId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setConsultant({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultant();
  }, []);

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

  return (
    <ScrollView style={styles.page}>
      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#0F3E48" />
      </TouchableOpacity>

      {/* COVER PHOTO */}
      <View style={styles.coverPhoto} />

      {/* AVATAR */}
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
          <Text style={styles.statValue}>N/A</Text>
          <Text style={styles.statLabel}>Ratings</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {consultant.experience ? "Yes" : "None"}
          </Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {consultant.availability?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Schedules</Text>
        </View>
      </View>

      {/* MENU-STYLE INFO CARD */}
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

        {/* LICENSE - only if PROFESSIONAL */}
        {consultant.consultantType === "Professional" && (
          <View style={styles.infoItem}>
            <Ionicons name="ribbon-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>
              {consultant.licenseNumber || "License not provided"}
            </Text>
          </View>
        )}

        <Text style={[styles.title, { marginTop: 10 }]}>Availability</Text>

        {consultant.availability?.length > 0 ? (
          consultant.availability.map((slot, idx) => (
            <View key={idx} style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                {slot.day}: {slot.am} / {slot.pm}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noInfo}>No schedule provided.</Text>
        )}
      </View>

      {/* REQUEST CONSULTATION BUTTON — ADDED */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => setScheduleVisible(true)} // OPEN MODAL
      >
        <Ionicons name="calendar-outline" size={20} color="#FFF" />
        <Text style={styles.chatText}>Request Consultation</Text>
      </TouchableOpacity>

     <ScheduleModal
  visible={scheduleVisible}
  onClose={() => setScheduleVisible(false)}
  consultantId={consultant.id}
  availability={consultant.availability}
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

  coverPhoto: {
    width: "100%",
    height: 160,
    backgroundColor: "#BFD8CC",
  },

  avatarContainer: {
    alignItems: "center",
    marginTop: -50,
    paddingBottom: 10,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    color: "#0F3E48",
  },

  subText: { fontSize: 16, color: "#5F7F85" },

  typeTag: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },

  typeText: { color: "#fff", fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
  },

  statBox: {
    backgroundColor: "#fff",
    width: 100,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 1,
  },

  statValue: { fontSize: 18, fontWeight: "700", color: "#0F3E48" },
  statLabel: { fontSize: 12, color: "#777" },

  infoCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F3E48",
    marginBottom: 8,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },

  infoText: { fontSize: 15, color: "#333" },
  noInfo: { fontSize: 14, color: "#777" },

  chatBtn: {
    backgroundColor: "#0F3E48",
    margin: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  chatText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
});
